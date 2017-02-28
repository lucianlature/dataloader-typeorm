require("babel-register");

const unexpected = require('unexpected');
unexpected.use(require('unexpected-sinon'));
unexpected.use(require('unexpected-set'));

// require('sinon-as-promised);
const typeorm = require('typeorm');

/*
unexpected.addType({
  name: 'typeorm.entity',
  identify: function (value) {
    return value && value instanceof typeorm.Instance;
  },
  inspect: function (value, depth, output, inspect) {
    output
      .text(value.Model.name).text('(')
      .append(inspect(value.get(), depth))
      .text(')');
  },
  equal: function (a, b) {
    const pk = a.Model.primaryKeyAttribute;
    return a.Model.name === b.Model.name && a.get(pk) === b.get(pk);
  }
});

unexpected.addType({
  name: 'typeorm.Association',
  identify: function (value) {
    return value && value instanceof typeorm.Association;
  },
  inspect: function (value, depth, output) {
    output
      .text(value.associationType).text(': ')
      .text(value.source.name).text(' -> ').text(value.target.name)
      .text('(').text(value.as).text(')');
  },
  equal: function (a, b, equal) {
    return a.associationType === b.associationType && equal(a.source, b.source) && equal(a.target, b.target) && a.as === b.as;
  }
});
*/
unexpected.addAssertion('<function> [not] to be shimmed', function (expect, subject) {
  return expect(subject, '[not] to have property', '__wrapped');
});
