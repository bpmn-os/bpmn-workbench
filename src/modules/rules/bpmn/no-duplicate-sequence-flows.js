import { is, isAny } from 'bpmnlint-utils';

/**
 * Two or more sequence flows between the same source and target are always wrong. The effect depends on
 * the source (an exclusive/event-based gateway sends one token, everything else sends two) and the target
 * (a parallel join waits for a token on each incoming flow), so the finding is classified by outcome:
 *
 *                       target fires per token   target is a parallel join
 *   source sends two →  race                     redundant
 *   source sends one  → redundant                deadlock
 */
export default function() {

  const MESSAGES = {
    race: 'Duplicate flows cause a race',
    deadlock: 'Duplicate flows cause a deadlock',
    redundant: 'Redundant duplicate flow'
  };

  function check(node, reporter) {

    if (!is(node, 'bpmn:FlowNode')) {
      return;
    }

    const outgoing = node.outgoing || [];
    if (outgoing.length < 2) {
      return;
    }

    const byTarget = {};
    outgoing.forEach((flow) => {
      const target = flow.targetRef;
      if (target) {
        (byTarget[target.id] = byTarget[target.id] || []).push(flow);
      }
    });

    Object.keys(byTarget).forEach((targetId) => {
      const flows = byTarget[targetId];
      if (flows.length < 2) {
        return;
      }

      const sourceSendsTwo = !isAny(node, [ 'bpmn:ExclusiveGateway', 'bpmn:EventBasedGateway' ]);
      const targetIsParallelJoin = is(flows[0].targetRef, 'bpmn:ParallelGateway');

      let subtype;
      if (targetIsParallelJoin) {
        subtype = sourceSendsTwo ? 'redundant' : 'deadlock';
      } else {
        subtype = sourceSendsTwo ? 'race' : 'redundant';
      }

      reporter.report(node.id, MESSAGES[subtype], { subtype });
    });
  }

  return {
    check
  };

};
