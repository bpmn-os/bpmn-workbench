import BpmnModeler from 'bpmn-js/lib/Modeler';

import EventSubProcessPaletteModule from './modules/event-subprocess'; // "Create expanded event sub-process" palette entry

import LintModule from 'bpmn-js-bpmnlint';
import getLintConfig, { essentialDescriptions } from './modules/rules'; // essential lint rules + rationales (incl. spec refs)
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

import installModeButtons, { modeIcon } from './mode-buttons';

import sampleProcess from './newDiagram.bpmn';

var modelName = 'diagram';

var modeler = new BpmnModeler({
  container: '#canvas',
  linting: {
    bpmnlint: getLintConfig()
  },
  issuesPanel: {
    descriptions: essentialDescriptions // show each rule's "why it's poor practice" rationale
  },
  tokenPanel: {
    // shown in the Tokens tab while in Model mode — points at the on-canvas mode buttons (same icons)
    modelNote: 'Click ' + modeIcon('fa-hand-pointer', 'simulate')
      + ' to start/end a user-controlled simulation, or ' + modeIcon('fa-play wb-mode-play', 'playback')
      + ' to start/end playback of execution logs.'
  },
  sidePanel: {
    parent: '#side-panel',
    // app identity + source link, shown in the side-panel header (above the tabs)
    header: '<span class="wb-brand-name">BPMN Workbench</span>'
      + '<a class="wb-brand-gh" href="https://github.com/bpmn-os/bpmn-workbench" target="_blank"'
      + ' rel="noopener" title="View source on GitHub" aria-label="GitHub repository">'
      + '<i class="fab fa-github"></i></a>'
  },
  additionalModules: [
    SidePanelModule,
    EventSubProcessPaletteModule,
    LintModule,
    IssuesPanelModule,        // → "Issues" tab
    SimulatorModule,
    PlaybackModule,
    TokenPanelModule,    // → "Tokens" tab
    ModeModule                // → mode.setMode('model'|'simulate'|'playback')
  ]
});

modeler.importXML(sampleProcess);

// the on-canvas Simulation / Playback buttons (Model = neither active)
installModeButtons(modeler);

window.modeler = modeler;

var HIGH_PRIORITY = 100000;

modeler.on('element.contextmenu', HIGH_PRIORITY, function(event) {
  event.originalEvent.preventDefault();
  event.originalEvent.stopPropagation();

  return true;
});

function downloadXML(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

var zoomIn = document.getElementById('js-zoom-in');
var zoomOut = document.getElementById('js-zoom-out');
var center = document.getElementById('js-center');

if (zoomIn) {
  zoomIn.addEventListener('click', function() {
    modeler.get('zoomScroll').stepZoom(1);
    return false;
  });
}
if (zoomOut) {
  zoomOut.addEventListener('click', function() {
    modeler.get('zoomScroll').stepZoom(-1);
    return false;
  });
}

if (center) {
  center.addEventListener('click', function() {
    modeler.get('canvas').zoom('fit-viewport', 'auto');
    return false;
  });
}

function show(content) {
  modeler.importXML(content);
}

var href = new URL(window.location.href);
var src = href.searchParams.get('src');
if (src) {
  loadBPMN(src);
}

function loadBPMN(URL) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      show(xhttp.responseText);
    }
    else {
      console.warn('Failed to get file. ReadyState: ' + xhttp.readyState + ', Status: ' + xhttp.status);
    }
  };
  xhttp.open('GET',URL,true);
  xhttp.send();
}

var uploadBPMN = document.getElementById('js-upload-bpmn');
if (uploadBPMN) {
  uploadBPMN.value = '';
  uploadBPMN.addEventListener('change', function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function() {
      show(reader.result);
    };
    reader.onerror = function(err) {
      console.log(err, err.loaded, err.loaded === 0, file);
    };

    reader.readAsText(event.target.files[0]);
    modelName = event.target.files[0].name.split('.')[0];
  });
}

var downloadBPMN = document.getElementById('js-download-bpmn');
var downloadSVG = document.getElementById('js-download-svg');

if (downloadBPMN) {
  downloadBPMN.addEventListener('click', function() {
    modeler.saveXML({ format: true }).then( function(model) {
      downloadXML(modelName + '.bpmn', model.xml);
    } );
    return false;
  });
}
if (downloadSVG) {
  downloadSVG.addEventListener('click', function() {
    modeler.saveSVG({ format: true }).then( function(model) {
      downloadXML(modelName + '.svg', model.svg);
    });
    return false;
  });
}
