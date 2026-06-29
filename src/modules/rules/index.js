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
import conditionalFlow from "./bpmn/conditional-flow";
import cycle from "./bpmn/cycle";
import structuralAnomaly from "./bpmn/structural-anomaly";
import nonInterruptingBoundaryEvent from "./bpmn/non-interrupting-boundary-event";
import singleBlankStartEvent from "bpmnlint/rules/single-blank-start-event";
import subProcessBlankStartEvent from "bpmnlint/rules/sub-process-blank-start-event";
import noDuplicateSequenceFlows from "bpmnlint/rules/no-duplicate-sequence-flows";
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
    "conditional-flow": conditionalFlow,
    "cycle": cycle,
    "structural-anomaly": structuralAnomaly,
    "non-interrupting-boundary-event": nonInterruptingBoundaryEvent,
    "single-blank-start-event": singleBlankStartEvent,
    "sub-process-blank-start-event": subProcessBlankStartEvent,
    "no-duplicate-sequence-flows": noDuplicateSequenceFlows,
    "superfluous-gateway": superfluousGateway
  }
};

// Default severities for the essential rules (the `rules` map createLintConfig expects).
export const essentialSeverities = {
  "essential/adhoc-subprocess": "error",
  "essential/implicit-start": "error",
  "essential/implicit-end": "error",
  "essential/no-blank-event": "error",
  "essential/implicit-split": "error",
  "essential/implicit-join": "error",
  "essential/conditional-flow": "error",
  "essential/cycle": "warn",
  "essential/structural-anomaly": "error",
  "essential/non-interrupting-boundary-event": "warn",
  "essential/single-blank-start-event": "error",
  "essential/sub-process-blank-start-event": "error",
  "essential/no-duplicate-sequence-flows": "error",
  "essential/superfluous-gateway": "warn"
};

// A ready-to-use bpmnlint bundle for **just** the essential rules.
export function getLintConfig() {
  return createLintConfig({
    rules: { ...essentialSeverities },
    plugins: [ essentialRules ]
  });
}

export default getLintConfig;
