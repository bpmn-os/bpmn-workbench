const {
  is
} = require('bpmnlint-utils');


/**
 * A rule that checks that no implicit split is modeled.
 *
 * Users should model the parallel splitting gateway
 * explicitly instead.
 */
module.exports = function() {

  function check(node, reporter) {

    if ( is(node, 'bpmn:Gateway') || !is(node,'bpmn:FlowNode') ) {
      return;
    }

    const outgoing = node.outgoing || [];

    const outgoingWithoutCondition = outgoing.filter((flow) => {
      return !hasCondition(flow) && !isDefaultFlow(node, flow);
    });

    if (outgoingWithoutCondition.length > 1) {
      const subtype = is(node, 'bpmn:Activity') ? 'activity' : 'event';
      reporter.report(node.id, 'Outgoing flows split implicitly', { subtype });
    }
  }

  return {
    check
  };

};


// helpers /////////////////////////////

function hasCondition(flow) {
  return !!flow.conditionExpression;
}

function isDefaultFlow(node, flow) {
  return node['default'] === flow;
}
