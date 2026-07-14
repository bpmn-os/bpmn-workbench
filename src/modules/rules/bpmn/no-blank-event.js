import { is, isAny } from 'bpmnlint-utils';


/**
 * Flags events that should declare a type (event definition), by element kind:
 *  - intermediate (throw/catch): stricter than the spec, which allows an untyped none throw event;
 *  - boundary: an untyped boundary event catches nothing;
 *  - event-sub-process start: must be triggered by a typed start event.
 */
export default function() {

  function check(node, reporter) {
    const blank = !node.eventDefinitions || !node.eventDefinitions.length;
    if (!blank) {
      return;
    }

    if (isAny(node, ['bpmn:IntermediateThrowEvent', 'bpmn:IntermediateCatchEvent'])) {
      reporter.report(node.id, 'Untyped intermediate event', { subtype: 'intermediate' });
    }
    else if (is(node, 'bpmn:BoundaryEvent')) {
      reporter.report(node.id, 'Untyped boundary event', { subtype: 'boundary' });
    }
    else if (is(node, 'bpmn:StartEvent') && node.$parent && node.$parent.triggeredByEvent) {
      reporter.report(node.id, 'Untyped start event in event sub-process', { subtype: 'event-sub-process-start' });
    }
  }

  return {
    check
  };

};
