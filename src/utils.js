import {clone} from 'ramda';

export const stringifyValue = (value, key) => {
  if (value && value.associationType) {
    return `${value.associationType},${value.target.name},${value.as}`;
  } else if (Array.isArray(value)) {
    if (key !== 'order') {
      // attribute order doesn't matter - order order definitely does
      value = clone(value).sort();
    }
    return value.map(stringifyValue).join(',');
  } else if (typeof value === 'object' && value !== null) {
    return stringifyObject(value);
  }
  return value;
};

// This is basically a home-grown JSON.stringifier. However, JSON.stringify on objects
// depends on the order in which the properties were defined - which we don't like!
// Additionally, JSON.stringify escapes strings, which we don't need here
export const stringifyObject = (object, keys = Object.keys(object)) => {
  return keys.sort().map(key => `${key}:${stringifyValue(object[key], key)}`).join('|');
};

export const getCacheKey = (model, attribute, options) => {
  options = stringifyObject(options, ['association', 'attributes', 'groupedLimit', 'limit', 'offset', 'order', 'where', 'through', 'raw']);

  return `${model.name}|${attribute}|${options}`;
};

export const mergeWhere = (where, optionsWhere) => {
  if (optionsWhere) {
    return {
      $and: [where, optionsWhere]
    };
  }
  return where;
};
