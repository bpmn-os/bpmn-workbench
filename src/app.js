import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css';
import 'bpmn-js-side-panel/assets/side-panel.css';
import 'bpmn-js-animation/assets/animation.css';
import 'bpmn-js-animation/assets/token-panel.css';
import './app.less';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import LintModule from 'bpmn-js-bpmnlint';
import getRules from './modules/rules'; // essential lint rules (the bundle carries their rationales)
import IssuesPanelModule from './modules/issues'; // self-registering "Issues" side-panel tab

import SidePanelModule from 'bpmn-js-side-panel';

// Token animation (the swap-in for bpmn-js-token-simulation): the interactive simulator, the playback
// controller, the Simulation side-panel tab, and the mode controller that toggles editing ⇄ simulation.
import {
  SimulatorModule,
  PlaybackModule,
  TokenPanelModule,
  ModeModule
} from 'bpmn-js-animation';

import createModeButtons, { modeIcon } from './mode-buttons';
import createToolbar from './modules/toolbar'; // on-canvas file/view toolbar (open/save/export/zoom)

import newDiagram from './newDiagram.bpmn?raw';

var modeler = new BpmnModeler({
  container: '#canvas',
  linting: {
    bpmnlint: getRules()  // the bundle carries rule descriptions; the Issues panel reads them itself
  },
  tokenPanel: {
    // shown in the Tokens tab while in Model mode — points at the on-canvas mode buttons (same icons)
    modelNote: 'Click ' + modeIcon('simulate', 'simulate')
      + ' to start/end a user-controlled simulation, or ' + modeIcon('playback', 'playback')
      + ' to start/end playback of execution logs.'
  },
  sidePanel: {
    parent: '#side-panel',
    width: '320px',
    // app identity + source link, shown in the side-panel header (above the tabs)
    header: '<div class="wb-brand">'
      + '<span class="wb-brand-name">BPMN Workbench</span>'
      + '<a class="wb-brand-gh" href="https://github.com/bpmn-os/bpmn-workbench" target="_blank"'
      + ' rel="noopener" title="View source on GitHub" aria-label="GitHub repository">'
      + '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></a>'
      + '</div>'
  },
  additionalModules: [
    SidePanelModule,
    LintModule,
    IssuesPanelModule,        // → "Issues" tab
    SimulatorModule,
    PlaybackModule,
    TokenPanelModule,    // → "Tokens" tab
    ModeModule                // → mode.setMode('model'|'simulate'|'playback')
  ]
});

modeler.importXML(newDiagram);

// the on-canvas Simulation / Playback buttons (Model = neither active)
createModeButtons(modeler);

// On-canvas file/view toolbar (open, save, export SVG, centre, zoom) — the packaged toolbar module.
createToolbar(modeler);

// Optional deep-linking: ?src=<url> loads a diagram on startup.
var src = new URL(window.location.href).searchParams.get('src');
if (src) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      modeler.importXML(xhttp.responseText);
    }
    else if (this.readyState == 4) {
      console.warn('Failed to load ' + src + ' (status ' + this.status + ')');
    }
  };
  xhttp.open('GET', src, true);
  xhttp.send();
}
