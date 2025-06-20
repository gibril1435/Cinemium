const _ = require('lodash');

function toCamelCaseDeep(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCaseDeep);
  } else if (obj && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = _.camelCase(key);
      result[camelKey] = toCamelCaseDeep(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

module.exports = { toCamelCaseDeep }; 