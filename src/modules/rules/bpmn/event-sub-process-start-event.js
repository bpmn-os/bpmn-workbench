const {
  is
} = require('bpmnlint-utils');

/**
 * An event sub-process must have exactly one start event (BPMN 2.0.2, Start Events for Event
 * Sub-Processes, p. 241). The requirement that the start event be typed (not None) is covered by the
 * no-blank-event rule, so it is not duplicated here.
 */
module.exports = function() {

  function check(node, reporter) {

    if (!is(node, 'bpmn:SubProcess') || !node.triggeredByEvent) {
      return;
    }

    const startEvents = (node.flowElements || []).filter(function(flowElement) {
      return is(flowElement, 'bpmn:StartEvent');
    });

    if (startEvents.length > 1) {
      startEvents.forEach(function(startEvent) {
        reporter.report(startEvent.id, 'Multiple start events in event sub-process');
      });
    }
  }

  return {
    check
  };

};
