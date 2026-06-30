# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Per-rule metadata** (`src/modules/rules/rule-meta.json`): every essential rule carries a default
  severity, an educational rationale, and (where applicable) an OMG BPMN 2.0.2 spec reference with a
  deep link. The Issues panel renders the rationale (caret-expandable) and the reference as a link.
- **`complex-gateway`** rule (`warn`): flags complex gateways, whose behaviour cannot be determined
  by structure.
- **`structural-anomaly`** now reports by conceptual outcome via issue subtypes — `deadlock`,
  `possible-deadlock`, `race`, `possible-race`, `mismatch`, `overcomplex` — each with its own
  rationale, and messages that name the nodes involved.
- **Issues panel**: issue-count badge on the tab; an `info` severity tier; severity icons matching the
  canvas markers.
- **File System Access API** for opening/saving BPMN and exporting SVG, so the browser remembers the
  last-used folder across sessions (separate folder memory for SVG export). Falls back to the native
  file input / download on browsers without the API.
- **Lint-rule regression tests** (`test/`, run with `npm test`) driving the rules via `bpmn-moddle`,
  with `.bpmn` fixtures that carry bpmn.io DI (`scripts/layout-fixtures.mjs`). See `test/README.md`.

### Changed
- Lint-rule severities follow a convention: `error` = illegal by the spec or always broken; `warn` =
  runtime hazard (deadlock / livelock / race); `info` = legal but a readability footgun.
- Start-event checks split by container (`process-start-event`, `sub-process-start-event`,
  `event-sub-process-start-event`); `flow-conditions` replaces `conditional-flow`;
  `no-duplicate-sequence-flows` is classified by outcome (race / deadlock / redundant);
  `superfluous-gateway` is an `error` (spec requires a gateway to merge or split).
- The default diagram for a new model is a start event followed by a task.
