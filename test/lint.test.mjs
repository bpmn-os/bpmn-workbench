import test from 'node:test';
import assert from 'node:assert/strict';
import { lint, messages, subtypes } from './lint-runner.mjs';

const fx = f => new URL(`./fixtures/${f}.bpmn`, import.meta.url).pathname;

// Message-based cases: [fixture, rules, expected messages].
const messageCases = [
  // --- cycle ---
  ['cycle-self-loop',                ['cycle'], ['Use loop activities instead of cycles']],
  ['cycle-backedge',                 ['cycle'], ['Use loop activities instead of cycles']],
  ['acyclic-ok',                     ['cycle'], []],

  // --- implicit-end (also flags start events without an outflow) ---
  ['implicit-end-start-no-outflow',  ['implicit-end'], ['Implicit end']],
  ['implicit-end-dangling',          ['implicit-end'], ['Implicit end']],
  ['explicit-end',                   ['implicit-end'], []],

  // --- implicit-start ---
  ['implicit-start-no-inflow',       ['implicit-start'], ['Implicit start']],

  // --- non-interrupting boundary events ---
  ['boundary-non-interrupting',      ['non-interrupting-boundary-event'], ['Non-interrupting boundary events can cause races']],
  ['boundary-interrupting-ok',       ['non-interrupting-boundary-event'], []],

  // --- complex gateways are flagged on sight (structural-anomaly then ignores them) ---
  ['block-complex-exclusive',        ['complex-gateway'], ['Complex gateway']],
];

// Fixtures are named by STRUCTURE (split-join, plus -escape for an escapable branch); the test
// asserts the conceptual OUTCOME (subtype), not the message wording (which also names the node).
// [fixture, expected subtypes].
const blockCases = [
  ['block-parallel-parallel',         []],                                         // sound
  ['block-exclusive-exclusive',       []],                                         // sound
  ['block-exclusive-parallel',        ['deadlock', 'deadlock']],                   // one branch into a synchronising join (always)
  ['block-parallel-exclusive',        ['race', 'race']],                           // all branches into a per-token merge (always)
  ['block-inclusive-exclusive',       ['possible-race', 'possible-race']],         // inclusive split may over-activate a per-token merge
  ['block-inclusive-parallel',        ['possible-deadlock', 'possible-deadlock']], // inclusive split may under-feed a synchronising join
  ['block-parallel-exclusive-escape', ['possible-race', 'possible-race']],          // escapable branch into a per-token merge (merge + escape)
  ['block-parallel-parallel-escape',  ['possible-deadlock', 'possible-deadlock']], // escapable branch may starve a synchronising join
  ['block-exclusive-inclusive',       ['mismatch', 'mismatch']],                   // exclusive split closed by an inclusive merge
  ['block-parallel-inclusive',        ['mismatch', 'mismatch']],                   // parallel split closed by an inclusive merge
  ['block-complex-exclusive',         []],                                         // complex is ignored here (see complex-gateway)
];

for (const [f, rules, expected] of messageCases) {
  test(`${f} (${rules.join(', ')})`, async () => {
    const reports = await lint(fx(f), rules);
    assert.deepEqual(messages(reports), [...expected].sort());
  });
}

for (const [f, expected] of blockCases) {
  test(`${f} (structural-anomaly outcome)`, async () => {
    const reports = await lint(fx(f), ['structural-anomaly']);
    assert.deepEqual(subtypes(reports), [...expected].sort());
  });
}
