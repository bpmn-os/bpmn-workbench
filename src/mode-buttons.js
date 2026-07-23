import {
  domify,
  classes as domClasses,
  event as domEvent
} from 'min-dom';

import './mode-buttons.css';

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

// FontAwesome free icon paths, inlined (no icon font / CDN). The ring is `circle` (regular); the inner
// glyph is a solid icon composed at fa-stack proportions (glyph at half the ring, centred). `w` is
// the glyph's native viewBox width (all FA icons are 512 tall); `dx` optically re-centres it.
const RING = 'M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z';
const GLYPHS = {
  simulate: { // hand-pointer (solid) — the original fas fa-hand-pointer, filled rather than outlined
    d: 'M448 240v96c0 3.084-.356 6.159-1.063 9.162l-32 136C410.686 499.23 394.562 512 376 512H168a40.004 40.004 0 0 1-32.35-16.473l-127.997-176c-12.993-17.866-9.043-42.883 8.822-55.876 17.867-12.994 42.884-9.043 55.877 8.823L104 315.992V40c0-22.091 17.908-40 40-40s40 17.909 40 40v200h8v-40c0-22.091 17.908-40 40-40s40 17.909 40 40v40h8v-24c0-22.091 17.908-40 40-40s40 17.909 40 40v24h8c0-22.091 17.908-40 40-40s40 17.909 40 40zm-256 80h-8v96h8v-96zm88 0h-8v96h8v-96zm88 0h-8v96h8v-96z',
    w: 448
  },
  playback: { // play (solid)
    d: 'M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z',
    w: 448, dx: 8
  }
};

// The composite mode icon (an outline ring with a small centred inner glyph) as one inline SVG string, so
// the on-canvas buttons and the Tokens-panel "model" note use the exact same visuals. `glyph` is a GLYPHS
// key: 'simulate' (a hand pointer) or 'playback' (a play triangle). Pass `mode` to make it a clickable mode
// switch (the TokenPanel wires data-set-mode).
export function modeIcon(glyph, mode) {
  const g = GLYPHS[glyph];
  const attr = mode ? ' data-set-mode="' + mode + '"' : '';
  const tx = g ? Math.round((512 - g.w * 0.5) / 2) + (g.dx || 0) : 0;
  return '<svg class="wb-mode-icon"' + attr + ' viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">'
    + '<path d="' + RING + '"/>'
    + (g ? '<g transform="translate(' + tx + ' 128) scale(0.5)"><path d="' + g.d + '"/></g>' : '')
    + '</svg>';
}

export default function createModeButtons(modeler) {
  const mode = modeler.get('mode');
  const canvas = modeler.get('canvas');
  const sidePanel = modeler.get('sidePanel', false);
  const container = canvas.getContainer();

  // Icon-only segmented control. Each icon is a composite: a thin outline ring with an inner glyph — a
  // cursor for interactive Simulation, a play triangle for Playback. Labels live in the tooltips.
  const el = domify(`
    <div class="wb-mode-buttons">
      <button type="button" data-mode="simulate" title="Simulation">${modeIcon('simulate')}</button>
      <button type="button" data-mode="playback" title="Playback">${modeIcon('playback')}</button>
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
