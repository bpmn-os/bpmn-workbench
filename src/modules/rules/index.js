// The essential, BPMN-OS–agnostic model-checking rules — owned and redistributed by bpmn-workbench
// (exported as `bpmn-workbench/rules`). `rules.json` is the source of truth: it maps each rule's
// **locator** (`bpmn/<name>.js`, or `@module/folder/<name>.js` to reuse another package's rule) to its
// severity + rationale. `getRules()` drops straight into `linting: { bpmnlint }`; a consumer can copy
// rules.json, adjust severities, drop/add entries, and pass it (with its own source registry) to
// `createRules` — no rule .js is copied.

import { createRules } from "./create-rules";
import rules from "./rules.json";

export { createRules, rules };

// This package's rule implementations, as a webpack context. Exported so a consumer reusing these rules
// can register it as their '@bpmn-workbench' source — require.context is resolved relative to the file
// it's written in, so it must be the one created here, not one the consumer builds against our package.
export const ruleContext = require.context("./", true, /\.js$/);

// Rule sources: marker -> a webpack require.context. '' is this package's local rules. This default
// bundle stays local-only; a consumer that reuses these rules — or mixes in rules from bpmnlint or any
// other package — builds its own registry and calls createRules (see README). (require.context is eager,
// so we register only sources we actually use.)
const sources = {
  "": ruleContext
};

// A ready-to-use bpmnlint bundle for the essential rules. The bundle carries `descriptions`, which the
// Issues panel reads from the linting config — so the host needs no separate descriptions wiring.
export function getRules() {
  return createRules(rules, sources);
}

export default getRules;
