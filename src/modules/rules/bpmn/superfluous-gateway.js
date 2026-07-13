const {
  is
} = require('bpmnlint-utils');

/**
 * A rule that checks whether a gateway neither merges nor splits the flow.
 *
 * A gateway is meaningful only if it has multiple incoming (a merge) or multiple outgoing (a split)
 * sequence flows. With at most one on each side it does nothing, so it is superfluous.
 */
module.exports = function() {

  function check(node, reporter) {

    if (!is(node, 'bpmn:Gateway')) {
      return;
    }

    const incoming = node.incoming || [];
    const outgoing = node.outgoing || [];

    if (incoming.length <= 1 && outgoing.length <= 1) {
      reporter.report(node.id, 'Superfluous gateway');
    }
  }

  return {
    check
  };

};
