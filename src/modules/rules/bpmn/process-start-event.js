const {
  is
} = require('bpmnlint-utils');

/**
 * A top-level process MAY have multiple start events, but the spec recommends against it because the
 * behaviour is harder to understand (BPMN 2.0.2, Start Event, p. 239). Reports each start event.
 */
module.exports = function() {

  function check(node, reporter) {

    if (!is(node, 'bpmn:Process')) {
      return;
    }

    const startEvents = (node.flowElements || []).filter(function(flowElement) {
      return is(flowElement, 'bpmn:StartEvent');
    });

    if (startEvents.length > 1) {
      startEvents.forEach(function(startEvent) {
        reporter.report(startEvent.id, 'Multiple start events');
      });
    }
  }

  return {
    check
  };

};
