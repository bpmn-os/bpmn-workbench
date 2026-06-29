# BPMN Workbench

A BPMN modeller for educational purpose with model checker and simulation.

The workbench supports three activities on a single process model: editing the model, simulating its
execution by advancing tokens along the sequence flows, and replaying a recorded execution. A model
checker reports issues continuously while editing. Its rules are opinionated and stricter than the BPMN
specification: they report constructs that can be considered poor modelling practice even if they are 
syntactically valid but.

The application is built on [bpmn-js](https://github.com/bpmn-io/bpmn-js); token animation and the side
panel are provided by [bpmn-js-animation](https://github.com/bpmn-os/bpmn-js-animation) and
[bpmn-js-side-panel](https://github.com/bpmn-os/bpmn-js-side-panel), and model checking by
[bpmn-js-bpmnlint](https://github.com/bpmn-io/bpmn-js-bpmnlint).

## Provided modules

In addition to the application, this repository provides two reusable modules:

- `bpmn-workbench/rules` — the essential model-checking rules and the bpmnlint configuration composer.
- `bpmn-workbench/issues` — a self-registering Issues side-panel tab that presents the results of the
  model checker.

## Development

```sh
npm install
npm start        # build, then watch (webpack + lessc) and serve dist/
npm run bundle   # one-off production build → dist/
```

## License

MIT — see [LICENSE](LICENSE).
