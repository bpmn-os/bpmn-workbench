import IssuesPanel from './IssuesPanel';
import createLintControls from './create-lint-controls';

/**
 * Opt-in **Issues panel** — adds a self-registering "Issues" tab to a `bpmn-js-side-panel` (if present;
 * no-ops otherwise) that renders the linting results. Add `IssuesPanelModule` to a modeller/viewer that
 * also has the `linting` service (bpmn-js-bpmnlint) and a side panel.
 *
 * Exported as `bpmn-workbench/issues`. For a host that wants to place the controls itself (no side
 * panel), use the named `createLintControls(modeler, parentEl)` instead.
 */
export const IssuesPanelModule = {
  __init__: [ 'issuesPanel' ],
  issuesPanel: [ 'type', IssuesPanel ]
};

export default IssuesPanelModule;

export { createLintControls };
