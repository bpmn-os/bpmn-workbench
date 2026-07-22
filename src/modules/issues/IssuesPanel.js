import createIssues from './create-issues';

/**
 * IssuesPanel — a self-registering "Issues" side-panel tab, the counterpart to bpmn-js-animation's
 * TokenPanel. On `diagram.init`, if a `sidePanel` service is present, it adds an "Issues" tab and
 * renders the linting results into it (via createIssues). No-ops without a side panel, so the
 * module stays optional for the host.
 *
 * Owned and redistributed by bpmn-workbench (exported as `bpmn-workbench/issues`). It depends on the
 * `linting` service (bpmn-js-bpmnlint) at runtime, not on the rules module — it renders whatever lint
 * results exist, so rules and panel are independent and composable.
 */
export default function IssuesPanel(injector, eventBus, config) {
  this._injector = injector;
  this._config = config || {};

  eventBus.on('diagram.init', () => this._init());
}

IssuesPanel.$inject = [ 'injector', 'eventBus', 'config.issuesPanel' ];

IssuesPanel.prototype._init = function() {
  const sidePanel = this._injector.get('sidePanel', false);
  if (!sidePanel) {
    return; // no side panel → the Issues tab is not shown
  }

  const { body } = sidePanel.addTab({
    id: 'issues',
    label: this._config.label || 'Issues',
    priority: this._config.priority != null ? this._config.priority : 10
  });

  // Rule descriptions (the "why" rationale per rule id) ride along in the rules bundle the host passes
  // to `linting: { bpmnlint: … }` — read them from there so no separate wiring is needed. An explicit
  // `issuesPanel: { descriptions }` still overrides.
  const linting = this._injector.get('config.linting', false);
  const descriptions = this._config.descriptions
    || (linting && linting.bpmnlint && linting.bpmnlint.descriptions)
    || {};

  // createIssues expects a `modeler`-like object exposing `.get(name)`; the diagram-js injector
  // provides exactly that. Use the non-strict form so an optional service (e.g. contextPad in a bare
  // viewer) resolves to null instead of throwing at init.
  createIssues(
    { get: (name) => this._injector.get(name, false) },
    body,
    { descriptions }
  );
};
