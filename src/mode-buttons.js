import {
  domify,
  classes as domClasses,
  event as domEvent
} from 'min-dom';

/**
 * On-canvas mode buttons for the workbench — two mutually-exclusive buttons, **Simulation** and
 * **Playback**, placed top-left on the canvas (above the palette). Greyed by default = **Model**
 * (editing). Activating one enters that mode; clicking the active one returns to Model.
 *
 * All the heavy lifting (disable editing, gate the simulator, clear tokens, hide the palette) is done by
 * bpmn-js-animation's `mode` controller — these buttons just call `mode.setMode(...)` and reflect the
 * current mode. They also bring the matching side-panel tab to the front (Issues in Model, Simulation
 * otherwise).
 */
export default function installModeButtons(modeler) {
  const mode = modeler.get('mode');
  const canvas = modeler.get('canvas');
  const sidePanel = modeler.get('sidePanel', false);
  const container = canvas.getContainer();

  // Icon-only segmented control. Each icon is a composite: a thin outline ring (far fa-circle) with an
  // inner glyph — a clicking finger for interactive Simulation, a play triangle for Playback. Labels live
  // in the tooltips.
  const el = domify(`
    <div class="wb-mode-buttons">
      <button type="button" data-mode="simulate" title="Simulation">
        <span class="fa-stack wb-mode-icon">
          <i class="far fa-circle fa-stack-2x"></i>
          <i class="fas fa-hand-pointer fa-stack-1x wb-mode-inner"></i>
        </span>
      </button>
      <button type="button" data-mode="playback" title="Playback">
        <span class="fa-stack wb-mode-icon">
          <i class="far fa-circle fa-stack-2x"></i>
          <i class="fas fa-play fa-stack-1x wb-mode-inner wb-mode-play"></i>
        </span>
      </button>
    </div>
  `);
  container.appendChild(el);

  const buttons = Array.from(el.querySelectorAll('button'));

  function render() {
    const current = mode.getMode();
    buttons.forEach(b => domClasses(b).toggle('active', b.getAttribute('data-mode') === current));
  }

  buttons.forEach(b => domEvent.bind(b, 'click', () => {
    const target = b.getAttribute('data-mode');
    // toggle: clicking the active mode returns to Model
    mode.setMode(mode.getMode() === target ? 'model' : target);
  }));

  modeler.on('mode.changed', event => {
    render();
    if (sidePanel) {
      sidePanel.activate(event.mode === 'model' ? 'issues' : 'tokens');
    }
  });

  render();
  return el;
}
