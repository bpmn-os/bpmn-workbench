// The essential, BPMN-OS–agnostic model-checking rules — owned and redistributed by bpmn-workbench
// (exported as `bpmn-workbench/rules`). A consumer (e.g. the workbench app, or the future
// bpmnos-modeller) either drops `getLintConfig()` straight into `linting: { bpmnlint }`, or composes
// `createLintConfig({ rules, plugins: [essentialRules, ...own plugins] })` to add more tiers on top.

import { createLintConfig } from "./create-lint-config";

import adHocSubProcess from "./bpmn/adhoc-subprocess";
import implicitStart from "./bpmn/implicit-start";
import implicitEnd from "./bpmn/implicit-end";
import noBlankEvent from "./bpmn/no-blank-event";
import implicitSplit from "./bpmn/implicit-split";
import implicitJoin from "./bpmn/implicit-join";
import flowConditions from "./bpmn/flow-conditions"; // conditional/default flow out of a non-gateway (info)
import cycle from "./bpmn/cycle";
import complexGateway from "./bpmn/complex-gateway";       // any complex gateway (warn)
import structuralAnomaly from "./bpmn/structural-anomaly";
import nonInterruptingBoundaryEvent from "./bpmn/non-interrupting-boundary-event";
import processStartEvent from "./bpmn/process-start-event";             // process: multiple start events (info)
import subProcessStartEvent from "./bpmn/sub-process-start-event";       // sub-process: typed / multiple (error)
import eventSubProcessStartEvent from "./bpmn/event-sub-process-start-event"; // event sub-process: multiple / none (error)
import noDuplicateSequenceFlows from "./bpmn/no-duplicate-sequence-flows"; // classifies by outcome (race/deadlock/redundant)
import superfluousGateway from "bpmnlint/rules/superfluous-gateway";

export { createLintConfig };

// The essential plugin: rule name -> implementation. Pass this (with more plugins) to createLintConfig.
export const essentialRules = {
  name: "essential",
  rules: {
    "adhoc-subprocess": adHocSubProcess,
    "implicit-start": implicitStart,
    "implicit-end": implicitEnd,
    "no-blank-event": noBlankEvent,
    "implicit-split": implicitSplit,
    "implicit-join": implicitJoin,
    "flow-conditions": flowConditions,
    "cycle": cycle,
    "complex-gateway": complexGateway,
    "structural-anomaly": structuralAnomaly,
    "non-interrupting-boundary-event": nonInterruptingBoundaryEvent,
    "process-start-event": processStartEvent,
    "sub-process-start-event": subProcessStartEvent,
    "event-sub-process-start-event": eventSubProcessStartEvent,
    "no-duplicate-sequence-flows": noDuplicateSequenceFlows,
    "superfluous-gateway": superfluousGateway
  }
};

// Per-rule metadata (default severity + an educational "why it's poor practice" rationale), in one
// editable JSON keyed by rule id (the `rule` field on every linting.completed issue). This is just the
// DEFAULT: a consumer of `bpmn-workbench/rules` can point at its own meta file (same shape) and derive
// the two maps with the helpers below, or spread `ruleMeta` and override per rule —
//   import myMeta from './my-rule-meta.json';
//   createLintConfig({ rules: severitiesOf(myMeta), plugins: [ essentialRules ] });
//   // app config: issuesPanel: { descriptions: descriptionsOf(myMeta) }
import ruleMeta from "./rule-meta.json";
export { ruleMeta };

// Derive the consumer-specific maps from a meta object: severities → createLintConfig, descriptions →
// the Issues panel. (Split because they go to two different places.)
export const severitiesOf = (meta) =>
  Object.fromEntries(Object.entries(meta).map(([ id, m ]) => [ id, m.severity ]));
// Flat map: rule id (and "<rule id>/<subtype>") → { description, reference, url }. `description` is the
// rationale text; `reference` is an optional spec citation shown under it; `url` is its optional hyperlink
// (a url requires a reference). Severity lives at the rule level (it cannot vary per subtype); the
// explanatory fields live at the rule level for rules WITHOUT subtypes, and INSIDE each subtype object
// (each with its own reference/url) for rules WITH subtypes. The panel looks up "<rule>/<subtype>", then
// "<rule>".
export const descriptionsOf = (meta) => {
  const out = {};
  for (const [ id, m ] of Object.entries(meta)) {
    out[id] = { description: m.description, reference: m.reference, url: m.url };
    for (const [ sub, v ] of Object.entries(m.subtypes || {})) {
      out[id + '/' + sub] = { description: v.description, reference: v.reference, url: v.url };
    }
  }
  return out;
};

// The bundled defaults, derived from the default ruleMeta.
export const essentialSeverities = severitiesOf(ruleMeta);
export const essentialDescriptions = descriptionsOf(ruleMeta);

// A ready-to-use bpmnlint bundle for **just** the essential rules.
export function getLintConfig() {
  return createLintConfig({
    rules: { ...essentialSeverities },
    plugins: [ essentialRules ]
  });
}

export default getLintConfig;
