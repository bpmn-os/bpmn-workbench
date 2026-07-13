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

In addition to the application, this repository provides three reusable modules:

- `bpmn-workbench/rules` — the essential model-checking rules and the bpmnlint configuration composer
  (see [Rules](#rules) below).
- `bpmn-workbench/issues` — a self-registering Issues side-panel tab that presents the results of the
  model checker.
- `bpmn-workbench/toolbar` — a self-contained on-canvas file/view toolbar (open, save, export SVG,
  centre, zoom) with inline SVG icons and its own CSS. `import createToolbar from
  'bpmn-workbench/toolbar'; createToolbar(modeler);` — no HTML, CSS link, or icon font required (the
  module needs a CSS loader in the host bundler, as it imports its stylesheet).

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

## Development

```sh
npm install
npm start        # build, then watch (webpack + lessc) and serve dist/
npm run bundle   # one-off production build → dist/
npm test         # run the lint-rule regression tests (see test/README.md)
```

## License

MIT — see [LICENSE](LICENSE).
