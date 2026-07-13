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

import newDiagram from './newDiagram.bpmn';

var modeler = new BpmnModeler({
  container: '#canvas',
  linting: {
    bpmnlint: getRules()  // the bundle carries rule descriptions; the Issues panel reads them itself
  },
  tokenPanel: {
    // shown in the Tokens tab while in Model mode — points at the on-canvas mode buttons (same icons)
    modelNote: 'Click ' + modeIcon('fa-hand-pointer', 'simulate')
      + ' to start/end a user-controlled simulation, or ' + modeIcon('fa-play wb-mode-play', 'playback')
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
      + '<i class="fab fa-github"></i></a>'
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
