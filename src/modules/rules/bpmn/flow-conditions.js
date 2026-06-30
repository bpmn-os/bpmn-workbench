const {
  is
} = require('bpmnlint-utils');

/**
 * Flags every conditional (diamond) or default (dash) flow out of a non-gateway — these form an implicit
 * gateway and are an easy trap, so they are info regardless of whether the activity's flows are
 * consistent. Each is reported with a subtype ("conditional" / "default"). Conditional/default flows out
 * of a gateway are normal and not flagged; the inconsistent (mixed) case is an error via inconsistent-flows.
 */
module.exports = function() {

  function check(node, reporter) {

    if (!is(node, 'bpmn:FlowNode') || is(node, 'bpmn:Gateway')) {
      return;
    }

    const isDefault = (flow) => node['default'] === flow;

    (node.outgoing || []).forEach((flow) => {
      if (flow.conditionExpression || isDefault(flow)) {
        reporter.report(flow.id, isDefault(flow) ? 'Default flow' : 'Conditional flow',
          { subtype: isDefault(flow) ? 'default' : 'conditional' });
      }
    });
  }

  return {
    check
  };

};
