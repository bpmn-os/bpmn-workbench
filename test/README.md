# Lint rule tests

Regression tests for the essential model-checking rules (`src/modules/rules/`). Run with:

```sh
npm test        # node --test test/*.test.mjs
```

## How it works

`lint-runner.mjs` parses a fixture with `bpmn-moddle` and runs selected rule factories directly against
the moddle tree (it does **not** go through the webpack bundle), collecting each `reporter.report` as
`{ rule, id, message, subtype }`. `lint.test.mjs` asserts, per fixture, either the reported **messages**
(most rules) or the reported **subtypes** (structural-anomaly, where the wording also names a node).

## Fixtures

`.bpmn` files in `fixtures/`. They carry bpmn.io DI so they also open in a modeller — regenerate it after
editing a flow with:

```sh
node scripts/layout-fixtures.mjs
```

Naming:

- **structural-anomaly:** `block-<split>-<join>[-escape]` describes the *structure* (e.g.
  `block-exclusive-parallel`, `block-parallel-exclusive-escape`); the test asserts the conceptual
  *outcome* subtype. `-escape` means one branch carries an interrupting boundary event.
- **other rules:** named for what they model (`cycle-self-loop`, `implicit-start-no-inflow`,
  `boundary-non-interrupting`); a no-issue case is suffixed `-ok` (or named for the valid construct, e.g.
  `explicit-end`).

## structural-anomaly outcome coverage

| subtype | fixture(s) |
|---|---|
| `deadlock` | `block-exclusive-parallel` |
| `possible-deadlock` | `block-inclusive-parallel`, `block-parallel-parallel-escape` |
| `race` | `block-parallel-exclusive` |
| `possible-race` | `block-inclusive-exclusive`, `block-parallel-exclusive-escape` |
| `mismatch` | `block-exclusive-inclusive`, `block-parallel-inclusive` |
| `overcomplex` | *(none — defensive net)* |

`overcomplex` is the "remaining nodes after reduction" guard. It is unreached by connected, acyclic,
complex-gateway-free input — consistent with the source algorithm, whose authors left block-finding
completeness unproven — so it has no fixture by design.

## Adding a case

1. Add `fixtures/<name>.bpmn` (semantics only; DI optional).
2. `node scripts/layout-fixtures.mjs` to add DI.
3. Add a row to the appropriate array in `lint.test.mjs`; if it needs a rule the runner doesn't know yet,
   add it to `RULES` in `lint-runner.mjs`.
