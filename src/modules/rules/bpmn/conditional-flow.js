const {
  is
} = require('bpmnlint-utils');

module.exports = function () {
  function check(flow, reporter) {
    if ( is(flow,'bpmn:SequenceFlow') && flow.conditionExpression ) {
      reporter.report(flow.id, 'Implicit gateway');
    }
  }
  return {
    check
  };
}

