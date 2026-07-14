import { is } from 'bpmnlint-utils';

/**
 * A rule that checks that no implicit join is modeled by attempting
 * to give a task or event join semantics.
 *
 * Users should model a parallel joining gateway
 * to achieve the desired behavior.
 */
export default function() {

  function check(node, reporter) {

    if ( is(node, 'bpmn:Gateway') || !is(node,'bpmn:FlowNode') ) {
      return;
    }

    const incoming = node.incoming || [];

    if (incoming.length > 1) {
      const subtype = is(node, 'bpmn:Activity') ? 'activity' : 'event';
      reporter.report(node.id, 'Incoming flows join implicitly', { subtype });
    }
  }

  return {
    check
  };

};
