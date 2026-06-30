// One-shot: generate bpmn.io DI for every test fixture so they render in a modeller.
// The lint runner ignores DI, so this does not affect tests. Re-run after editing a fixture's flow.
//
//   node scripts/layout-fixtures.mjs
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { layoutProcess } from 'bpmn-auto-layout';

const dir = new URL('../test/fixtures/', import.meta.url);

for (const file of readdirSync(dir).filter(f => f.endsWith('.bpmn'))) {
  const path = new URL(file, dir);
  try {
    const laidOut = await layoutProcess(readFileSync(path, 'utf8'));
    writeFileSync(path, laidOut);
    console.log('laid out', file);
  } catch (err) {
    console.error('FAILED', file, '-', err.message);
  }
}
