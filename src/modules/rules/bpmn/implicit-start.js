import { is, isAny } from 'bpmnlint-utils';

export default function () {
  function check(node, reporter) {
    if ( is(node,'bpmn:FlowNode') && !is(node.$parent,'bpmn:AdHocSubProcess') && !isAny(node, ['bpmn:StartEvent','bpmn:BoundaryEvent']) ) {    
      if (!(node.incoming && node.incoming.length) && !node.triggeredByEvent && !node.isForCompensation ) {
        reporter.report(node.id, 'Implicit start');
      }
    }
  }
  return {
    check
  };
}


