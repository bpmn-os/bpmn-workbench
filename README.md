# BPMN Workbench

A BPMN modeller for educational purpose with model checker and simulation.

Available online at [bpmn-os.github.io/bpmn-workbench](https://bpmn-os.github.io/bpmn-workbench/).

The workbench supports three activities on a single process model: editing the model, simulating its
execution by advancing tokens along the sequence flows, and replaying a recorded execution. A model
checker reports issues continuously while editing. Its rules are opinionated and stricter than the BPMN
specification: they report constructs that can be considered poor modelling practice even if they are
syntactically valid.

The application is built on [bpmn-js](https://github.com/bpmn-io/bpmn-js); token animation and the side
panel are provided by [bpmn-js-animation](https://github.com/bpmn-os/bpmn-js-animation) and
[bpmn-js-side-panel](https://github.com/bpmn-os/bpmn-js-side-panel), and model checking by
[bpmn-js-bpmnlint](https://github.com/bpmn-io/bpmn-js-bpmnlint).

## Provided modules

In addition to the application, this repository provides four reusable modules:

- `bpmn-workbench/rules` — the essential model-checking rules and the bpmnlint configuration composer
  (see [Rules](#rules) below).
- `bpmn-workbench/issues` — a self-registering Issues side-panel tab that presents the results of the
  model checker.
- `bpmn-workbench/toolbar` — a self-contained on-canvas file/view toolbar (open, save, export SVG,
  centre, zoom) with inline SVG icons and its own CSS. `import createToolbar from
  'bpmn-workbench/toolbar'; createToolbar(modeler);` — no HTML, CSS link, or icon font required (the
  module needs a CSS loader in the host bundler, as it imports its stylesheet).
- `bpmn-workbench/bpmn2svg` — a headless BPMN→SVG renderer, available both as a `bpmn2svg` command and
  as a reusable module (`renderBpmnToSvg`, `withDevServer`, `runCli`) for building app-specific
  variants. See [Rendering diagrams to SVG](#rendering-diagrams-to-svg-bpmn2svg) below.

## Rules

The rule set is declared in [`src/modules/rules/rules.json`](src/modules/rules/rules.json) — the single
source of truth. It maps each rule's **locator** to its severity and rationale:

```jsonc
{
  "bpmn/cycle.js": { "severity": "warn", "description": "…", "reference": "…", "url": "…" },
  "bpmn/no-blank-event.js": { "severity": "error", "subtypes": { "boundary": { "description": "…" } } }
}
```

A locator is `[@module/]folder/file.js` (folder depth 1):

- `folder/file.js` — a rule **local** to the package.
- `@module/folder/file.js` — a rule **reused** from another package (`@` marks "external").

The bpmnlint rule id is the locator minus `.js` (`bpmn/cycle.js` → `bpmn/cycle`,
`@bpmn-workbench/bpmn/cycle.js` → `@bpmn-workbench/bpmn/cycle`) — exactly bpmnlint's
`[@scope/]package/rule` shape, so no other conversion is needed. `severity` feeds `createRules`;
`description`/`reference`/`url` (per rule, or per `subtype`) feed the Issues panel via `descriptionsOf`.

**Composing your own rule set.** `getRules()` returns a ready bundle for the essential rules. To
customise — adjust severities, drop rules, add your own, or **reuse rules from another package** — copy
`rules.json`, edit it, and pass it with a **source registry** to `createRules`:

```js
import { createRules, ruleContext } from 'bpmn-workbench/rules';
import myRules from './rules.json';   // e.g. "engine/my-rule.js", "@bpmn-workbench/bpmn/cycle.js", …

const bundle = createRules(myRules, {
  '': require.context('./', true, /\.js$/),  // your local rules (context written in YOUR build)
  '@bpmn-workbench': ruleContext             // reuse the essential rules (wb's exported context)
  // '@bpmnlint': require.context('bpmnlint', true, /^\.\/rules\/[^/]+\.js$/)  // or any package's rules
});

new BpmnModeler({ linting: { bpmnlint: bundle }, /* … */ });
```

A `require.context` is resolved relative to the file it's written in and is **eager** (it bundles every
file it matches), so: reuse another package's rules through the **context that package exports**
(`ruleContext`), write the context for **your own** rules in your build, and register only the sources
you actually use (this is why the essential set copies its single `bpmnlint` rule locally rather than
pulling in all of `bpmnlint/rules`).

## Rendering diagrams to SVG (`bpmn2svg`)

`bpmn2svg` renders a `.bpmn` file to SVG headlessly. It drives a running app's modeller (exposed as a
global `window.modeler`), emitting one SVG per plane — each collapsed sub-process gets its own file —
and adding `data-element-id` tooltips. As a `bin` it drives **this** app (plain BPMN); its render core
is also exported, so a downstream app can drive its own modeller — reusing this exact logic to render
its own extensions.

### Prerequisites

- Google Chrome — auto-detected via `chrome-launcher` (`sudo apt install google-chrome-stable`).

### Install

The `bpmn2svg` bin lives in this repo and depends on it, so put it on your `PATH` with `npm link`:

```sh
npm install
npm link          # adds `bpmn2svg` to your PATH
```

No `sudo` is needed as long as npm's global prefix is user-writable. If it isn't, point npm at a
user-owned prefix once and make sure its `bin` is on your `PATH` (`npm config set prefix ~/.local`).

### Usage

```sh
# Auto-start: spins up this app's dev server, renders, then shuts it down.
bpmn2svg <file.bpmn> [-o <outputDir>]

# Against an already-running server that exposes window.modeler.
bpmn2svg -s <serverURL> <file.bpmn> [-o <outputDir>]
```

## Development

```sh
npm install
npm run dev       # Vite dev server (hot reload)
npm run build     # production build to dist/
npm run preview   # serve the production build
npm test          # run the lint-rule regression tests (see test/README.md)
```

## License

MIT — see [LICENSE](LICENSE).
