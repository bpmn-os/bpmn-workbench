const {
  is
} = require('bpmnlint-utils');

/**
 * Flags every complex gateway. Its activation depends on an expression rather than its structure, so its
 * behaviour cannot be determined by inspection and the structural-anomaly rule deliberately ignores blocks
 * that contain one. Prefer an exclusive, parallel, or inclusive gateway.
 */
module.exports = function() {

  function check(node, reporter) {
    if (is(node, 'bpmn:ComplexGateway')) {
      reporter.report(node.id, 'Complex gateway');
    }
  }

  return {
    check
  };

};
