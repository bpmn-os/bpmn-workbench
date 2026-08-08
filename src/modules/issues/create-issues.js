import './issues.css';

import { createListEntry, createCollapsibleEntry } from 'bpmn-js-side-panel';

import { SEVERITIES, withSeverities } from './severities.js';

export default function(modeler, parent, options = {}) {
  // where the severities stand: the tab's band if the host hands one over, else above the list
  const band = options.header || null;
  const linting = modeler.get('linting');
  const eventBus = modeler.get('eventBus');
  const elementRegistry = modeler.get('elementRegistry');
  const selectionService = modeler.get('selection');
  const canvas = modeler.get('canvas');
  const contextPad = modeler.get('contextPad');
  // bpmn-js-bpmnlint routes every issue message through the `translate` service (for its own canvas
  // overlays); honour it here too, so a host that overrides/localises messages via translate sees them
  // in this panel as well.
  const translate = modeler.get('translate', false) || (s => s);

  // rule-id -> short "why it's poor practice" rationale (optional); rendered under each issue message
  const descriptions = options.descriptions || {};

  // In a collaboration a Participant (pool) has no process shape, so a process-level issue is attached to
  // the participant. Show the referenced process id in the header (the issue is about the process), while
  // the group's data-id stays the participant so click-to-select still hits the pool.
  function displayId(id) {
    const element = elementRegistry.get(id);
    if (element && element.type === 'bpmn:Participant' && element.businessObject.processRef) {
      return element.businessObject.processRef.id;
    }
    return id;
  }

  // A process that is the canvas root (a plain process, not a pool) has no shape, so bpmn-js-bpmnlint
  // can't mark its issues on the diagram. Outline the whole canvas by the worst such severity instead.
  // (In a collaboration the process is a pool, so the marker sits on the participant — no outline.)
  const SEVERITY_RANK = { error: 3, warn: 2, info: 1 };
  const CANVAS_CLASSES = [ 'bpmn-issues-canvas-error', 'bpmn-issues-canvas-warning', 'bpmn-issues-canvas-info' ];
  function markCanvas(issues) {
    const container = canvas.getContainer();
    container.classList.remove(...CANVAS_CLASSES);
    let worst = null;
    for (const id of Object.keys(issues || {})) {
      const element = elementRegistry.get(id);
      if (!element || element.type !== 'bpmn:Process') {
        continue;
      }
      for (const issue of issues[id]) {
        const cat = issue.category === 'error' ? 'error' : issue.category === 'info' ? 'info' : 'warn';
        if (!worst || SEVERITY_RANK[cat] > SEVERITY_RANK[worst]) {
          worst = cat;
        }
      }
    }
    if (worst) {
      container.classList.add('bpmn-issues-canvas-' + (worst === 'warn' ? 'warning' : worst));
    }
  }

  // markup: a line per severity, then the issue list. The list is a bpmn-js-side-panel ListEntry
  // (keyed, reconciled in place) rather than a div rebuilt each lint pass — linting re-runs on every
  // model edit, so a wholesale rebuild would collapse any expanded rationale and reset scroll; keyed
  // reconcile keeps both. The element keeps id "issueList" the stylesheet targets.
  const wrap = document.createElement('div');
  wrap.className = 'bpmn-issues';

  const issueList = createListEntry();   // keyed by element id — one group per element
  issueList.element.id = 'issueList';
  wrap.appendChild(issueList.element);

  const emptyHint = document.createElement('div');
  emptyHint.className = 'bpmn-issues-empty';
  emptyHint.textContent = 'No issues found.';
  emptyHint.style.display = 'none';
  wrap.appendChild(emptyHint);

  parent.appendChild(wrap);

  // Which severities are looked for. A severity that is not shown has its rules switched off, so the
  // linter reports nothing of it: it is gone from the canvas, from this list, from the canvas outline and
  // from the tab badge together. With none shown nothing is linted at all, which is what the switch this
  // replaces used to say.
  //
  // The configuration the host gave is the baseline and is never written to, since a rule switched off no
  // longer states the severity it had. It is read from the host's own `linting.bpmnlint`, which is what a
  // host passes to the modeller, and from the linter itself where a host configured it another way.
  const baseline = (modeler.get('config.linting', false) || {}).bpmnlint || linting.getLinterConfig();
  const shown = new Set(SEVERITIES);

  // panel severity icons mirror the canvas markers: a colored circle (currentColor, set per severity via
  // CSS) with a white glyph — error ✗, warning !, info i.
  // The glyph alone, which is what a flex row wants: a mark in the tab's band sits beside its name as a box
  // among boxes, so it carries no wrapper, no leading space and no trailing one.
  const GLYPHS = {
    error: '<svg width="12" height="12" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="8" fill="currentColor"></circle><path d="M5.3 5.3L10.7 10.7M10.7 5.3L5.3 10.7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"></path></svg>',
    warning: '<svg width="12" height="12" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="8" fill="currentColor"></circle><rect x="7.1" y="3.5" width="1.8" height="5.5" rx="0.6" fill="#fff"></rect><circle cx="8" cy="11.7" r="1.05" fill="#fff"></circle></svg>',
    info: '<svg width="12" height="12" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="8" fill="currentColor"></circle><rect x="7" y="7" width="2" height="5" rx="0.5" fill="#fff"></rect><circle cx="8" cy="4.3" r="1.15" fill="#fff"></circle></svg>'
  };

  // The same glyph in a line of text, where it needs the wrapper that colours it and a space after it.
  const inline = (kind) => '<span class="icon ' + kind + '">' + GLYPHS[kind] + '</span>&nbsp;';

  const error = inline('error');

  const warning = inline('warning');

  const info = inline('info');

  // One button per severity: its mark and its name. They stand on one line in the tab's band, above the list
  // they govern, so that they stay while it scrolls; the names are accordingly the short ones and there are
  // no counts, how many were found being said in the tab's own name. The three read alike, and the only
  // thing that changes a colour is whether a severity is looked for.
  const LABELS = { error: 'errors', warn: 'warnings', info: 'notes' };
  const MARKS = { error: GLYPHS.error, warn: GLYPHS.warning, info: GLYPHS.info };
  const CLASSES = { error: 'error', warn: 'warning', info: 'info' };

  const severities = document.createElement('div');
  severities.className = 'bpmn-issues-severities';

  // The band of the tab, where a control that governs the whole list belongs, so that it stays while the
  // list scrolls under it. A host that gives none keeps the severities where they were, above the list.
  if (band) {
    const name = document.createElement('h1');

    name.className = 'bjs-tab-name';
    name.textContent = options.name || 'Issues';
    band.append(name, severities);
  } else {
    wrap.insertBefore(severities, issueList.element);
  }

  SEVERITIES.forEach((severity) => {
    const line = document.createElement('button'),
          mark = document.createElement('span'),
          name = document.createElement('span');

    line.type = 'button';
    line.className = 'bpmn-issues-severity ' + CLASSES[severity];
    mark.className = 'bpmn-issues-mark';
    mark.innerHTML = MARKS[severity];
    name.className = 'bpmn-issues-name';
    name.textContent = LABELS[severity];

    line.append(mark, name);
    line.addEventListener('click', () => {
      shown.has(severity) ? shown.delete(severity) : shown.add(severity);
      line.setAttribute('aria-pressed', String(shown.has(severity)));
      applySeverities();
    });
    line.setAttribute('aria-pressed', 'true');

    severities.appendChild(line);
  });

  // The three read alike, and the only thing that changes a severity's colour is whether it is looked for:
  // dark where it is, grey where it is not. How many of a kind were found is said in the tab's own name.
  function applySeverities() {
    linting.setLinterConfig(withSeverities(baseline, shown));
  }

  // How many issues a lint found, said in the tab's own name — at-a-glance feedback without opening the
  // tab. It is the name rather than a mark beside it because the name is what both of the panel's views
  // show, a selector in one and a column's resizer in the other, and because the panel renames a tab
  // without this needing to know where either is drawn. The count is dropped when the model is clean.
  const sidePanel = modeler.get('sidePanel', false);
  const tabName = (sidePanel && sidePanel.getTab('issues') || {}).label || 'Issues';

  function setBadge(errors, warnings, infos) {
    if (!sidePanel) {
      return;
    }

    const total = errors + warnings + infos;

    sidePanel.setTabLabel('issues', total ? tabName + ' (' + total + ')' : tabName);
  }

  // --- keyed reconcile --------------------------------------------------------
  // one element-group per id (outer list), each holding a keyed inner list of issue entries. A re-lint
  // updates both in place: persisting groups/issues keep their DOM (and open state), gone ones drop.
  const groups = new Map();   // elementId -> { element, idEl, inner: ListEntry }

  // a stable identity for an issue within its element: same rule + subtype + message ⇒ same entry, so an
  // expanded rationale survives a re-lint that still reports it.
  function issueKey(issue) {
    return issue.rule + '|' + (issue.subtype || '') + '|' + issue.message;
  }

  // Render one issue with bpmn-js-side-panel's collapsible entry: the summary is the severity icon +
  // message; the rationale (when present) is the expandable body, so an issue with no rationale is a
  // plain, non-expandable row.
  function makeIssueEntry(issue) {
    // a rule may tag a finding with a `subtype` (report(id, msg, { subtype })) for a more specific
    // rationale; fall back to the rule-level entry. Each entry is { description, reference, url }.
    const desc = (issue.subtype && descriptions[issue.rule + '/' + issue.subtype])
      || descriptions[issue.rule] || {};
    const why = desc.description;
    const ref = desc.reference;
    const detail = why || ref;

    const summary = document.createElement('span');
    summary.className = 'bpmn-issues-head';
    summary.innerHTML = (issue.category === 'error' ? error : issue.category === 'info' ? info : warning)
      + '<span class="bpmn-issues-msg">' + translate(issue.message) + '</span>';

    const entry = createCollapsibleEntry({ label: summary, expandable: !!detail });
    entry.summaryEl.style.whiteSpace = 'normal';   // let the message wrap (titles default to nowrap)
    entry.summaryEl.style.overflow = 'visible';

    if (detail) {
      const whyEl = document.createElement('div');
      whyEl.className = 'bpmn-issues-why';
      whyEl.style.display = 'block';   // visibility now comes from the entry's open state, not li.expanded
      whyEl.innerHTML = (why || '')
        + (ref ? '<div class="bpmn-issues-ref">' + (desc.url
            ? '<a href="' + desc.url + '" target="_blank" rel="noopener">' + ref + '</a>'
            : ref) + '</div>' : '');
      entry.contentEl.appendChild(whyEl);
    }
    return entry.element;
  }

  function makeGroup(id) {
    const group = document.createElement('div');
    group.className = 'bjsl-issues';
    group.setAttribute('data-id', id);
    const inner = document.createElement('div');
    inner.className = 'bjsl-current-element-issues';
    const idEl = document.createElement('div');
    idEl.className = 'bpmn-issues-id';
    idEl.textContent = displayId(id);
    inner.appendChild(idEl);
    const innerList = createListEntry();   // keyed by issueKey
    inner.appendChild(innerList.element);
    group.appendChild(inner);
    // clicking the group selects its element on the canvas (expanding an entry bubbles here too)
    group.addEventListener('click', function() {
      const element = elementRegistry.get(id);
      canvas.setRootElement(canvas.findRoot(element));
      selectionService.select(element);
      if (element.type === 'bpmn:Process') {
        contextPad.close(element);
      }
    });
    return { element: group, idEl, inner: innerList };
  }

  function render(issues) {
    const ids = Object.keys(issues || {});
    const present = new Set(ids);

    // drop groups whose element no longer has any issue
    for (const id of issueList.keys()) {
      if (!present.has(id)) {
        issueList.remove(id);
        groups.delete(id);
      }
    }

    let errors = 0, warnings = 0, infos = 0;
    ids.forEach((id, gi) => {
      let g = groups.get(id);
      if (!g) {
        g = makeGroup(id);
        groups.set(id, g);
        issueList.add(id, g.element, gi);
      } else {
        g.idEl.textContent = displayId(id);   // participant → processRef may have changed
        issueList.move(id, gi);
      }

      const wanted = new Set();
      issues[id].forEach((issue, ii) => {
        if (issue.category === 'error') { errors++; }
        else if (issue.category === 'info') { infos++; }
        else { warnings++; }
        const key = issueKey(issue);
        wanted.add(key);
        if (!g.inner.has(key)) {
          g.inner.add(key, makeIssueEntry(issue), ii);
        } else {
          g.inner.move(key, ii);   // keep the existing entry (and its open state), just reorder
        }
      });
      for (const key of g.inner.keys()) {
        if (!wanted.has(key)) {
          g.inner.remove(key);
        }
      }
    });

    emptyHint.style.display = ids.length ? 'none' : '';
    setBadge(errors, warnings, infos);
    markCanvas(issues);
  }

  function clearAll() {
    for (const id of issueList.keys()) {
      issueList.remove(id);
    }
    groups.clear();
    emptyHint.style.display = 'none';
    setBadge(0, 0, 0);
    markCanvas({});
  }

  eventBus.on('linting.toggle', function(event) {
    if (!event.active) {
      clearAll();
    }
  });

  eventBus.on('linting.completed', function(event) {
    // linting.completed also fires while linting is toggled OFF (bpmn-js-bpmnlint re-lints on toggle);
    // when inactive, clear everything so that off means off.
    if (!linting.isActive()) {
      clearAll();
      return;
    }
    render(event.issues || {});
  });

  // Enable the model checker by default so issues are shown without asking for them.
  linting.toggle(true);
  applySeverities();
}
