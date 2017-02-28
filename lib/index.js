'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.resetCache = resetCache;

exports.default = function (target) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  options = _extends({}, options, {
    max: 500
  });

  if (!cache) {
    cache = (0, _lruCache2.default)(options);
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
  shimModel(target);
  // shimBelongsTo(target.Association.BelongsTo.prototype);
  // shimHasOne(target.Association.HasOne.prototype);
  // shimHasMany(target.Association.HasMany.prototype);
  // shimBelongsToMany(target.Association.BelongsToMany.prototype);
  /* } */
};

var _typeorm = require('typeorm');

var _typeorm2 = _interopRequireDefault(_typeorm);

var _dataloader = require('dataloader');

var _dataloader2 = _interopRequireDefault(_dataloader);

var _ramda = require('ramda');

var _utils = require('./utils');

var _shimmer = require('shimmer');

var _shimmer2 = _interopRequireDefault(_shimmer);

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function mapResult(attribute, keys, options, result) {
  // Convert an array of results to an object of attribute (primary / foreign / target key) -> array of matching rows
  if (Array.isArray(attribute) && options.multiple && !options.raw) {
    // Regular belongs to many
    var _attribute = attribute,
        _attribute2 = _slicedToArray(_attribute, 2),
        throughAttribute = _attribute2[0],
        foreignKey = _attribute2[1];

    result = result.reduce(function (carry, row) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = row.get(throughAttribute)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var throughRow = _step.value;

          var key = throughRow[foreignKey];
          if (!(key in carry)) {
            carry[key] = [];
          }

          carry[key].push(row);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return carry;
    }, {});
  } else {
    if (Array.isArray(attribute)) {
      // Belongs to many count is a raw query, so we have to get the attribute directly
      attribute = attribute.join('.');
    }
    result = (0, _ramda.groupBy)(result, (0, _ramda.property)(attribute));
  }

  return keys.map(function (key) {
    if (key in result) {
      var value = result[key];

      return options.multiple ? value : value[0];
    }
    return options.multiple ? [] : null;
  });
}

function rejectOnEmpty(options, result) {
  if ((0, _ramda.isEmpty)(result) && options.rejectOnEmpty) {
    if (typeof options.rejectOnEmpty === 'function') {
      throw new options.rejectOnEmpty();
    } else if (_typeof(options.rejectOnEmpty) === 'object') {
      throw options.rejectOnEmpty;
    } else {
      throw new _typeorm2.default.EmptyResultError();
    }
  }

  return result;
}

function loaderForModel(model, attribute, attributeField) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  if (typeof options.include === 'undefined') {
    console.warn('options.include is not supported by model loader');
  }

  var cacheKey = (0, _utils.getCacheKey)(model, attribute, options);

  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, new _dataloader2.default(function (keys) {
      var findOptions = Object.assign({}, options);
      delete findOptions.rejectOnEmpty;

      if (findOptions.limit && keys.length > 1) {
        findOptions.groupedLimit = {
          limit: findOptions.limit,
          on: attributeField,
          values: keys
        };
        delete findOptions.limit;
      } else {
        findOptions.where = (0, _utils.mergeWhere)(_defineProperty({}, attributeField, keys), findOptions.where);
      }

      return model.findAll(findOptions).then(mapResult.bind(null, attribute, keys, findOptions));
    }, {
      cache: false
    }));
  }

  return cache.get(cacheKey);
}

function shimModel(target) {
  if (target.findOneById.__wrapped) return;

  _shimmer2.default.massWrap(target, ['findOne', 'findOneById'], function (original) {
    return function batchedFindById(id) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if ([null, undefined].indexOf(id) !== -1) {
        return Promise.resolve(null);
      }
      if (options.transaction || options.include) {
        return original.apply(this, arguments);
      }
      return loaderForModel(this, this.primaryKeyAttribute, this.primaryKeyField).load(id).then(rejectOnEmpty.bind(null, options));
    };
  });
}

var cache = void 0;
function resetCache() {
  if (cache) {
    cache.reset();
  }
}