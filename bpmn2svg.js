#!/usr/bin/env node

// Headless BPMN → SVG renderer, reusable across apps.
//
// The rendering itself is plain bpmn-js (importXML / saveSVG / expand collapsed sub-processes / add
// tooltips) and is entirely app-agnostic — it only needs a running app that exposes the modeller as
// `window.modeler`. What a rendering looks like depends purely on *which app* is driven:
//   - as a bin, this file auto-starts THIS package's app (plain BPMN);
//   - a downstream app can import `runCli` from here and point it at its own app (its own extensions).
// Either way there is one implementation of the puppeteer/expand/tooltip logic.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { Launcher } from 'chrome-launcher';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

/**
 * Render a .bpmn file to SVG against a running app that exposes `window.modeler`.
 * Writes `<baseName>.svg` for the root plane plus `<baseName>-<id>.svg` for each collapsed
 * sub-process, each with `data-element-id` tooltips.
 *
 * @param {Object} options
 * @param {string} options.serverURL  URL of an app exposing `window.modeler`
 * @param {string} options.file       path to the .bpmn file
 * @param {string} [options.outDir='.'] output directory (created if missing)
 * @return {Promise<number>} number of SVG files written
 */
export async function renderBpmnToSvg({ serverURL, file, outDir = '.' }) {
  const chromePath = Launcher.getFirstInstallation();
  if (!chromePath) {
    throw new Error('Cannot find Chrome. To install run: sudo apt install google-chrome-stable');
  }

  const baseName = path.basename(file, path.extname(file));
  const diagram = fs.readFileSync(file, 'utf-8');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
    headless: true
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => console.error('[page error]', err.message));
    await page.goto(serverURL);
    // Wait for the app to expose the modeller (module scripts may still be initialising after `load`).
    await page.waitForFunction(() => typeof window.modeler !== 'undefined', { timeout: 20000 });
    await page.evaluate((xml) => modeler.importXML(xml), diagram);

    // root plane
    let svg = await page.evaluate(() => modeler.saveSVG({ format: true }).then((m) => m.svg));
    fs.writeFileSync(path.join(outDir, baseName + '.svg'), addTooltips(svg), 'utf-8');

    // one SVG per collapsed sub-process (ids only cross the page boundary — bpmn-js elements are cyclic)
    const collapsedIds = await page.evaluate(() =>
      modeler.get('elementRegistry').getAll().filter((el) => el.collapsed).map((el) => el.id));

    for (const id of collapsedIds) {
      svg = await page.evaluate((elId) => {
        const registry = modeler.get('elementRegistry');
        const canvas = modeler.get('canvas');
        const root = registry.get(elId + '_plane');
        if (!root) { return null; }
        canvas.setRootElement(root);
        return modeler.saveSVG({ format: true }).then((m) => m.svg);
      }, id);

      if (svg) {
        fs.writeFileSync(path.join(outDir, baseName + '-' + id + '.svg'), addTooltips(svg), 'utf-8');
      }
    }

    return collapsedIds.length + 1;
  } finally {
    await browser.close();
  }
}

/**
 * Start `vite` in `appDir`, wait for its URL, run `fn(url)`, then tear the server down.
 * @param {string} appDir      an app package with a `vite` dev dependency (its bin is spawned)
 * @param {function(string): Promise<*>} fn
 */
export async function withDevServer(appDir, fn) {
  // Run Vite's binary directly (not via `npm run dev`) so npm's own logging never leaks into output.
  // detached:true puts it in its own process group so we can tear the whole group down afterwards.
  const viteBin = path.join(appDir, 'node_modules', '.bin', 'vite');
  const server = spawn(viteBin, [], { cwd: appDir, detached: true, stdio: [ 'ignore', 'pipe', 'pipe' ] });

  const stripAnsi = (s) => s.replace(/\x1B\[[0-9;]*m/g, '');
  const stop = () => {
    try {
      process.kill(-server.pid); // whole process group
    } catch (e) {
      server.kill();
    }
  };
  server.stderr.on('data', (d) => process.stderr.write(d));

  try {
    const url = await new Promise((resolve, reject) => {
      server.on('error', reject);
      server.on('exit', () => reject(new Error('dev server exited before it was ready')));
      let resolved = false;
      server.stdout.on('data', (data) => {
        if (resolved) { return; }
        const out = stripAnsi(data.toString());
        const m = out.match(/Local:\s*(https?:\/\/\S+)/) || out.match(/(https?:\/\/localhost:\d+\/?)/);
        if (m) {
          resolved = true;
          resolve(m[1].replace(/\/+$/, ''));
        }
      });
    });
    console.log('Server URL:', url);
    return await fn(url);
  } finally {
    stop();
  }
}

/**
 * CLI entry point, parameterised by which app to auto-start.
 * @param {Object} options
 * @param {string} options.appDir     app whose dev server is started when no `-s` is given
 * @param {string[]} options.argv     args after the program name
 * @param {string} [options.toolName='bpmn2svg'] name shown in the usage string
 */
export async function runCli({ appDir, argv, toolName = 'bpmn2svg' }) {
  let file, outDir = '.', serverURL;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-o' || arg === '--output') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        console.error('Error: missing output directory after ' + arg);
        process.exit(1);
      }
      outDir = argv[++i];
    } else if (arg === '-s' || arg === '--server') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        console.error('Error: missing server URL after ' + arg);
        process.exit(1);
      }
      serverURL = argv[++i];
    } else {
      file = arg;
    }
  }

  if (!file) {
    console.error(`Usage: ${toolName} [-s <serverURL>] [-o <outputDir>] <BPMN filename>`);
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error('File does not exist:', file);
    process.exit(1);
  }

  let count;
  if (serverURL) {
    count = await renderBpmnToSvg({ serverURL, file, outDir });
  } else {
    console.log('Starting local dev server ...');
    count = await withDevServer(appDir, (url) => renderBpmnToSvg({ serverURL: url, file, outDir }));
  }
  console.log(`Saved ${count} diagram(s) to: ${outDir}`);
}

function addTooltips(svgContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const elements = doc.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.hasAttribute('data-element-id')) {
      const title = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = element.getAttribute('data-element-id');
      element.appendChild(title);
    }
  }
  return new XMLSerializer().serializeToString(doc);
}

// Run as a bin: drive THIS package's app (bpmn-workbench → plain BPMN).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const appDir = path.dirname(fileURLToPath(import.meta.url));
  runCli({ appDir, argv: process.argv.slice(2) })
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
