'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeWhere = exports.getCacheKey = exports.stringifyObject = exports.stringifyValue = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _ramda = require('ramda');

var stringifyValue = exports.stringifyValue = function stringifyValue(value, key) {
  if (value && value.associationType) {
    return value.associationType + ',' + value.target.name + ',' + value.as;
  } else if (Array.isArray(value)) {
    if (key !== 'order') {
      // attribute order doesn't matter - order order definitely does
      value = (0, _ramda.clone)(value).sort();
    }
    return value.map(stringifyValue).join(',');
  } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value !== null) {
    return stringifyObject(value);
  }
  return value;
};

// This is basically a home-grown JSON.stringifier. However, JSON.stringify on objects
// depends on the order in which the properties were defined - which we don't like!
// Additionally, JSON.stringify escapes strings, which we don't need here
var stringifyObject = exports.stringifyObject = function stringifyObject(object) {
  var keys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Object.keys(object);

  return keys.sort().map(function (key) {
    return key + ':' + stringifyValue(object[key], key);
  }).join('|');
};

var getCacheKey = exports.getCacheKey = function getCacheKey(model, attribute, options) {
  options = stringifyObject(options, ['association', 'attributes', 'groupedLimit', 'limit', 'offset', 'order', 'where', 'through', 'raw']);

  return model.name + '|' + attribute + '|' + options;
};

var mergeWhere = exports.mergeWhere = function mergeWhere(where, optionsWhere) {
  if (optionsWhere) {
    return {
      $and: [where, optionsWhere]
    };
  }
  return where;
};