import { is } from 'bpmnlint-utils';

/**
 * An embedded sub-process is triggered by the token arriving from its parent. It has at most one blank
 * (None) start event, which must not be typed (BPMN 2.0.2, Sub-Process execution semantics, p. 430).
 *
 * Event sub-processes and ad-hoc sub-processes have their own rules and are skipped here.
 */
export default function() {

  function check(node, reporter) {

    if (!is(node, 'bpmn:SubProcess') || node.triggeredByEvent || is(node, 'bpmn:AdHocSubProcess')) {
      return;
    }

    const startEvents = (node.flowElements || []).filter(function(flowElement) {
      return is(flowElement, 'bpmn:StartEvent');
    });

    startEvents.forEach(function(startEvent) {
      if ((startEvent.eventDefinitions || []).length) {
        reporter.report(startEvent.id, 'Illegal typed start event in sub-process', { subtype: 'typed-start' });
      }
    });

    if (startEvents.length > 1) {
      startEvents.forEach(function(startEvent) {
        reporter.report(startEvent.id, 'Multiple start events in sub-process', { subtype: 'multiple-start' });
      });
    }
  }

  return {
    check
  };

};
