import { domify, event as domEvent } from 'min-dom';

import './toolbar.css';

/**
 * A self-contained **file / view toolbar** for a bpmn-js modeller — the load / save / export-SVG /
 * centre / zoom controls that every app around here used to hand-roll in its own HTML + CSS + wiring.
 * Owned and redistributed by bpmn-workbench (exported as `bpmn-workbench/toolbar`).
 *
 * Usage (no HTML, no CSS link, no Font Awesome needed — icons are inline SVG):
 *
 *   import createToolbar from 'bpmn-workbench/toolbar';
 *   createToolbar(modeler);
 *
 * It appends an on-canvas control bar (bottom-right, left of the bpmn.io logo) and wires:
 *   - load  → File System Access picker (remembers the folder), falling back to a native <input>
 *   - save  → download / save the BPMN XML
 *   - image → export the diagram as SVG
 *   - centre / zoom-in / zoom-out → the canvas
 *
 * @param {BpmnModeler} modeler  a modeller exposing saveXML/importXML/saveSVG + `.get()`
 * @param {Object} [options]
 * @param {Element|string} [options.container]  where to mount (default: the canvas container)
 * @param {string} [options.fileName='diagram']  initial base name for saved files
 * @returns {{ element: Element, getFileName: function, setFileName: function }}
 */
export default function createToolbar(modeler, options = {}) {
  const canvas = modeler.get('canvas');

  const container = resolveContainer(options.container) || canvas.getContainer();

  let fileName = options.fileName || 'diagram';

  // A shared picker id lets the browser remember the last-used folder across load and save (and across
  // sessions). SVG export keeps its own id so it remembers its own folder.
  const BPMN_PICKER_ID = 'bpmn-toolbar';
  const SVG_PICKER_ID = 'bpmn-toolbar-svg';
  const BPMN_TYPES = [ { description: 'BPMN diagram', accept: { 'application/xml': [ '.bpmn', '.xml' ] } } ];
  const SVG_TYPES = [ { description: 'SVG image', accept: { 'image/svg+xml': [ '.svg' ] } } ];
  const hasLoadPicker = typeof window.showOpenFilePicker === 'function';
  const hasSavePicker = typeof window.showSaveFilePicker === 'function';

  const el = domify(`
    <div class="bpmn-toolbar">
      <ul>
        <li>
          <a href data-action="load" title="Load BPMN diagram">${ICONS.load}</a>
        </li><li>
          <a href data-action="save" title="Save BPMN diagram">${ICONS.save}</a>
        </li><li>
          <a href data-action="export-svg" title="Export as SVG image">${ICONS.image}</a>
        </li><li>
          <a href data-action="center" title="Center">${ICONS.center}</a>
        </li><li>
          <a href data-action="zoom-in" title="Zoom in">${ICONS.zoomIn}</a>
        </li><li>
          <a href data-action="zoom-out" title="Zoom out">${ICONS.zoomOut}</a>
        </li>
      </ul>
    </div>
  `);
  container.appendChild(el);

  // don't let the <a href> anchors navigate
  el.querySelectorAll('a[href]').forEach(a => domEvent.bind(a, 'click', e => e.preventDefault()));

  // --- load ---------------------------------------------------------------
  // The load control is a plain button. With the File System Access API we use the picker; otherwise we
  // trigger a hidden <input type="file"> programmatically — it is never shown, so the browser's native
  // "No file selected" tooltip never appears.
  if (hasLoadPicker) {
    bindAction('load', () => loadWithPicker().catch(ignoreAbort));
  } else {
    const loadInput = document.createElement('input');
    loadInput.type = 'file';
    loadInput.accept = '.bpmn,.xml';
    loadInput.style.display = 'none';
    el.appendChild(loadInput);
    domEvent.bind(loadInput, 'change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { fileName = baseName(file.name); modeler.importXML(reader.result); };
      reader.readAsText(file);
      loadInput.value = ''; // let the same file be re-loaded
    });
    bindAction('load', () => loadInput.click());
  }

  async function loadWithPicker() {
    const [ handle ] = await window.showOpenFilePicker({ id: BPMN_PICKER_ID, types: BPMN_TYPES });
    const file = await handle.getFile();
    fileName = baseName(file.name);
    modeler.importXML(await file.text());
  }

  // --- save / export ------------------------------------------------------
  bindAction('save', () =>
    modeler.saveXML({ format: true }).then(({ xml }) =>
      saveFile(BPMN_PICKER_ID, fileName + '.bpmn', BPMN_TYPES, xml, 'text/xml')));

  bindAction('export-svg', () =>
    modeler.saveSVG({ format: true }).then(({ svg }) =>
      saveFile(SVG_PICKER_ID, fileName + '.svg', SVG_TYPES, svg, 'image/svg+xml')));

  // --- view ---------------------------------------------------------------
  bindAction('center', () => canvas.zoom('fit-viewport', 'auto'));
  bindAction('zoom-in', () => modeler.get('zoomScroll').stepZoom(1));
  bindAction('zoom-out', () => modeler.get('zoomScroll').stepZoom(-1));

  function bindAction(action, fn) {
    const node = el.querySelector(`[data-action="${action}"]`);
    domEvent.bind(node, 'click', e => { e.preventDefault(); fn(); });
  }

  async function saveFile(id, suggestedName, types, text, mimeType) {
    if (hasSavePicker) {
      try {
        const handle = await window.showSaveFilePicker({ id, suggestedName, types });
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
      } catch (err) {
        ignoreAbort(err);
      }
      return;
    }
    downloadText(suggestedName, text, mimeType);
  }

  return {
    element: el,
    getFileName: () => fileName,
    setFileName: (name) => { fileName = name; }
  };
}

function resolveContainer(container) {
  if (!container) return null;
  return typeof container === 'string' ? document.querySelector(container) : container;
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, '');
}

function ignoreAbort(err) {
  if (err && err.name !== 'AbortError') console.warn(err);
}

function downloadText(filename, text, mimeType) {
  const a = document.createElement('a');
  a.setAttribute('href', `data:${mimeType};charset=utf-8,` + encodeURIComponent(text));
  a.setAttribute('download', filename);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Inline, dependency-free stroke icons (Feather-style, 24x24) so the toolbar needs no icon font.
const ICONS = {
  load: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  center: '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  zoomIn: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
  zoomOut: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
};
