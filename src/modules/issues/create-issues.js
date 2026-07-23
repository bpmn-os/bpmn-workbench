import './issues.css';

import { createListEntry, createCollapsibleEntry } from 'bpmn-js-side-panel';

export default function(modeler, parent, options = {}) {
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

  // markup: the "Show issues" header, then the issue list. The list is a bpmn-js-side-panel ListEntry
  // (keyed, reconciled in place) rather than a div rebuilt each lint pass — linting re-runs on every
  // model edit, so a wholesale rebuild would collapse any expanded rationale and reset scroll; keyed
  // reconcile keeps both. The element keeps id "issueList" the stylesheet targets.
  const wrap = document.createElement('div');
  wrap.className = 'bpmn-issues';
  wrap.innerHTML =
    `<label class="bpmn-issues-header">
       <span class="bpmn-issues-toggle">
         <input id="lintingToggle" type="checkbox" checked>
         <span class="bpmn-issues-toggle-slider"></span>
       </span>
       <span>Show issues</span>
     </label>`;

  const issueList = createListEntry();   // keyed by element id — one group per element
  issueList.element.id = 'issueList';
  wrap.appendChild(issueList.element);

  const emptyHint = document.createElement('div');
  emptyHint.className = 'bpmn-issues-empty';
  emptyHint.textContent = 'No issues found.';
  emptyHint.style.display = 'none';
  wrap.appendChild(emptyHint);

  parent.appendChild(wrap);

  const toggle = wrap.querySelector('input');
  toggle.addEventListener('change', function(event) {
    linting.toggle(event.target.checked);
  });

  eventBus.on('linting.toggle', function(event) {
    const lintingToggle = document.getElementById('lintingToggle');
    if (lintingToggle) {
      lintingToggle.checked = event.active;
    }
  });

  // panel severity icons mirror the canvas markers: a colored circle (currentColor, set per severity via
  // CSS) with a white glyph — error ✗, warning !, info i.
  const error = '<span class="icon error"> <svg width="12" height="12" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="margin: auto;text-align: center;"><circle cx="8" cy="8" r="8" fill="currentColor"></circle><path d="M5.3 5.3L10.7 10.7M10.7 5.3L5.3 10.7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"></path></svg></span>&nbsp;';

  const warning = '<span class="icon warning"> <svg width="12" height="12" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="margin: auto;text-align: center;"><circle cx="8" cy="8" r="8" fill="currentColor"></circle><rect x="7.1" y="3.5" width="1.8" height="5.5" rx="0.6" fill="#fff"></rect><circle cx="8" cy="11.7" r="1.05" fill="#fff"></circle></svg></span>&nbsp;';

  const info = '<span class="icon info"> <svg width="12" height="12" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="margin: auto;text-align: center;"><circle cx="8" cy="8" r="8" fill="currentColor"></circle><rect x="7" y="7" width="2" height="5" rx="0.5" fill="#fff"></rect><circle cx="8" cy="4.3" r="1.15" fill="#fff"></circle></svg></span>&nbsp;';

  // a count badge on the "Issues" side-panel tab — at-a-glance feedback without opening the tab. Red
  // when any errors, amber when only warnings, blue when only info, hidden when clean (or linting off).
  // getTab() doesn't expose the tab <button>, so find it in the DOM by its data-tab attribute
  const tabButton = document.querySelector('.bjs-side-panel-tab[data-tab="issues"]');
  const badge = document.createElement('span');
  badge.className = 'bpmn-issues-tab-badge';
  badge.style.display = 'none';
  if (tabButton) {
    tabButton.appendChild(badge);
  }
  function setBadge(errors, warnings, infos) {
    const total = errors + warnings + infos;
    badge.style.display = total ? '' : 'none';          // no "(0)" when clean
    badge.textContent = total ? '(' + total + ')' : '';  // plain count in parentheses
    badge.title = errors + ' error' + (errors === 1 ? '' : 's')
      + ', ' + warnings + ' warning' + (warnings === 1 ? '' : 's')
      + ', ' + infos + ' info';
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
    // when inactive, clear everything so "Show issues" off means off.
    if (!linting.isActive()) {
      clearAll();
      return;
    }
    render(event.issues || {});
  });

  // Enable the model checker by default so issues are shown without toggling.
  linting.toggle(true);
}
