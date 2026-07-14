import { is } from 'bpmnlint-utils';

// Warns on non-interrupting boundary events: they leave the attached activity running while
// spawning a parallel path, which can race with the activity's own completion.
export default function () {
  function check(node, reporter) {
    if (is(node, 'bpmn:BoundaryEvent') && node.cancelActivity === false) {
      reporter.report(node.id, 'Non-interrupting boundary events can cause races');
    }
  }

  return {
    check
  };
};
