import { is, isAny } from 'bpmnlint-utils';

export default function () {
  function check(node, reporter) {
    if ( is(node,'bpmn:StartEvent')  && is(node.$parent,'bpmn:AdHocSubProcess') ) {
      reporter.report(node.id, 'Illegal start event in ad-hoc sub-process', { subtype: 'start-event' });
    }
    if ( is(node,'bpmn:EndEvent')  && is(node.$parent,'bpmn:AdHocSubProcess') ) {
      reporter.report(node.id, 'Illegal end event in ad-hoc sub-process', { subtype: 'end-event' });
    }
    if ( is(node,'bpmn:AdHocSubProcess') && !(node.flowElements || []).some(e => is(e,'bpmn:Activity')) ) {
      reporter.report(node.id, 'Missing activity in ad-hoc sub-process', { subtype: 'missing-activity' });
    }
  }
  return {
    check
  };
}
