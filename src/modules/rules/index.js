// The essential, BPMN-OS–agnostic model-checking rules — owned and redistributed by bpmn-workbench
// (exported as `bpmn-workbench/rules`). `rules.json` is the source of truth: it maps each rule's
// **locator** (`bpmn/<name>.js`, or `@module/folder/<name>.js` to reuse another package's rule) to its
// severity + rationale. `getRules()` drops straight into `linting: { bpmnlint }`; a consumer can copy
// rules.json, adjust severities, drop/add entries, and pass it (with its own source registry) to
// `createRules` — no rule .js is copied.

import { createRules, createContext } from "./create-rules";
import rules from "./rules.json";

export { createRules, createContext, rules };

// This package's rule implementations, imported explicitly and assembled into a context with
// createContext (bundler-agnostic; replaces webpack's require.context). Exported so a consumer reusing
// these rules can register it as their '@bpmn-workbench' source — the keys are locators relative to this
// directory, so the context must be the one built here, not one the consumer builds against our package.
import * as adhocSubprocess from "./bpmn/adhoc-subprocess.js";
import * as complexGateway from "./bpmn/complex-gateway.js";
import * as cycle from "./bpmn/cycle.js";
import * as eventSubProcessStartEvent from "./bpmn/event-sub-process-start-event.js";
import * as flowConditions from "./bpmn/flow-conditions.js";
import * as implicitEnd from "./bpmn/implicit-end.js";
import * as implicitJoin from "./bpmn/implicit-join.js";
import * as implicitSplit from "./bpmn/implicit-split.js";
import * as implicitStart from "./bpmn/implicit-start.js";
import * as loop from "./bpmn/loop.js";
import * as noBlankEvent from "./bpmn/no-blank-event.js";
import * as noDuplicateSequenceFlows from "./bpmn/no-duplicate-sequence-flows.js";
import * as nonInterruptingBoundaryEvent from "./bpmn/non-interrupting-boundary-event.js";
import * as processStartEvent from "./bpmn/process-start-event.js";
import * as structuralAnomaly from "./bpmn/structural-anomaly.js";
import * as structuralAnomalyWithCycles from "./bpmn/structural-anomaly-with-cycles.js";
import * as subProcessStartEvent from "./bpmn/sub-process-start-event.js";
import * as superfluousGateway from "./bpmn/superfluous-gateway.js";

export const ruleContext = createContext({
  "./bpmn/adhoc-subprocess.js": adhocSubprocess,
  "./bpmn/complex-gateway.js": complexGateway,
  "./bpmn/cycle.js": cycle,
  "./bpmn/event-sub-process-start-event.js": eventSubProcessStartEvent,
  "./bpmn/flow-conditions.js": flowConditions,
  "./bpmn/implicit-end.js": implicitEnd,
  "./bpmn/implicit-join.js": implicitJoin,
  "./bpmn/implicit-split.js": implicitSplit,
  "./bpmn/implicit-start.js": implicitStart,
  "./bpmn/loop.js": loop,
  "./bpmn/no-blank-event.js": noBlankEvent,
  "./bpmn/no-duplicate-sequence-flows.js": noDuplicateSequenceFlows,
  "./bpmn/non-interrupting-boundary-event.js": nonInterruptingBoundaryEvent,
  "./bpmn/process-start-event.js": processStartEvent,
  "./bpmn/structural-anomaly.js": structuralAnomaly,
  "./bpmn/structural-anomaly-with-cycles.js": structuralAnomalyWithCycles,
  "./bpmn/sub-process-start-event.js": subProcessStartEvent,
  "./bpmn/superfluous-gateway.js": superfluousGateway
});

// Rule sources: marker -> a context. '' is this package's local rules. This default bundle stays
// local-only; a consumer that reuses these rules — or mixes in rules from bpmnlint or any other package
// — builds its own registry and calls createRules (see README).
const sources = {
  "": ruleContext
};

// A ready-to-use bpmnlint bundle for the essential rules. The bundle carries `descriptions`, which the
// Issues panel reads from the linting config — so the host needs no separate descriptions wiring.
export function getRules() {
  return createRules(rules, sources);
}

export default getRules;
