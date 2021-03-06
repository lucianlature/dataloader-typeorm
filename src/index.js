import typeorm from 'typeorm';
import DataLoader from 'dataloader';
import {groupBy, prop, isEmpty} from 'ramda';
import {getCacheKey, mergeWhere} from './utils';
import shimmer from 'shimmer';
import LRU from 'lru-cache';

function mapResult(attribute, keys, options, result) {
  // Convert an array of results to an object of attribute (primary / foreign / target key) -> array of matching rows
  if (Array.isArray(attribute) && options.multiple && !options.raw) {
    // Regular belongs to many
    let [throughAttribute, foreignKey] = attribute;
    result = result.reduce((carry, row) => {
      for (const throughRow of row.get(throughAttribute)) {
        let key = throughRow[foreignKey];
        if (!(key in carry)) {
          carry[key] = [];
        }

        carry[key].push(row);
      }

      return carry;
    }, {});
  } else {
    if (Array.isArray(attribute)) {
      // Belongs to many count is a raw query, so we have to get the attribute directly
      attribute = attribute.join('.');
    }
    result = groupBy(prop(attribute), result);
  }

  return keys.map(key => {
    if (key in result) {
      let value = result[key];

      return options.multiple ? value : value[0];
    }
    return options.multiple ? [] : null;
  });
}

function rejectOnEmpty(options, result) {
  if (isEmpty(result) && options.rejectOnEmpty) {
    if (typeof options.rejectOnEmpty === 'function') {
      throw new options.rejectOnEmpty();
    } else if (typeof options.rejectOnEmpty === 'object') {
      throw options.rejectOnEmpty;
    } else {
      throw new typeorm.EmptyResultError();
    }
  }

  return result;
}

function loaderForModel(repo, attribute, options = {}) {
  let cacheKey = getCacheKey(repo, attribute, options);

  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, new DataLoader(keys => {
      const findOptions = Object.assign({}, options);
      delete findOptions.rejectOnEmpty;

      /*
      if (findOptions.limit && keys.length > 1) {
        findOptions.groupedLimit = {
          limit: findOptions.limit,
          on: attributeField,
          values: keys
        };
        delete findOptions.limit;
      } else {*/
      findOptions.where = mergeWhere({
        [attribute]: keys
      }, findOptions.where);
      /* } */

      return repo
        .createQueryBuilder('user')
        .where("user.id IN (:ids)", {ids: findOptions.where.id})
        .getMany()
        .then(mapResult.bind(null, attribute, keys, findOptions));
    }, {
      cache: false
    }));
  }

  return cache.get(cacheKey);
}

function shimRepo(target) {
  if (target.findOneById.__wrapped) return;

  shimmer.massWrap(target, ['findOne', 'findOneById'], original => {
    return function batchedFindOneById(id, options = {}) {
      if ([null, undefined].indexOf(id) !== -1) {
        return Promise.resolve(null);
      }
      if (options.transaction || options.include) {
        return original.apply(this, arguments);
      }

      const targetAttributes = this.metadata.columns.map((columnMeta) => columnMeta.propertyName) || [];
      return loaderForModel(this, targetAttributes[0]).load(id).then(rejectOnEmpty.bind(null, options));
    };
  });
}

let cache;
export function resetCache() {
  if (cache) {
    cache.reset();
  }
}

export default function (target, options = {}) {
  options = {
    ...options,
    max: 500
  };

  if (!cache) {
    cache = LRU(options);
  }

  /*
  if (target.associationType) {
    shimAssociation(target);
  } else if (target.toString().includes('SequelizeModel')) {
    shimModel(target);
    values(target.associations).forEach(shimAssociation);
  } else {
  */
  // Assume target is  constructor
  shimRepo(target);
  // shimBelongsTo(target.Association.BelongsTo.prototype);
  // shimHasOne(target.Association.HasOne.prototype);
  // shimHasMany(target.Association.HasMany.prototype);
  // shimBelongsToMany(target.Association.BelongsToMany.prototype);
  /* } */
}
