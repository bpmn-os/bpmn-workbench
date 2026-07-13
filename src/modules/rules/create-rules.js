/**
 * Build a bpmnlint bundle (`{ resolver, config }`) from a `rules.json` map and a source registry.
 *
 * `rules` — the rules.json object, keyed by a **locator**: `"[@module/]folder/file.js"`.
 *   - `folder/file.js`         → a rule local to the consuming package
 *   - `@module/folder/file.js` → a rule reused from another package (`@` marks "external")
 *   Each value is `{ severity, description?, reference?, url?, subtypes? }`.
 *
 * `sources` — maps a locator's leading marker to a webpack `require.context`:
 *   - `''`          → the local rules (context rooted where it's created, e.g. this module's dir)
 *   - `'@module'`   → that module's rules dir
 *
 * The bpmnlint rule id is the locator minus `.js` (`bpmn/cycle.js` → `bpmn/cycle`,
 * `@bpmn-workbench/bpmn/cycle.js` → `@bpmn-workbench/bpmn/cycle`) — which is exactly bpmnlint's
 * `[@scope/]package/rule` shape, so no other conversion is needed.
 */
export function createRules(rules, sources = {}) {
  const cache = {};          // rule id -> implementation
  const config = { rules: {} };
  const descriptions = {};   // rule id (and "<id>/<subtype>") -> { description, reference, url } for the Issues panel

  for (const [ locator, meta ] of Object.entries(rules)) {
    const id = locator.replace(/\.js$/, '');
    cache[id] = loadRule(locator, sources);
    config.rules[id] = meta.severity;

    descriptions[id] = { description: meta.description, reference: meta.reference, url: meta.url };
    for (const [ subtype, v ] of Object.entries(meta.subtypes || {})) {
      descriptions[id + '/' + subtype] = { description: v.description, reference: v.reference, url: v.url };
    }
  }

  function Resolver() {}

  Resolver.prototype.resolveRule = function (pkg, ruleName) {
    const id = toId(pkg, ruleName);
    const rule = cache[id];

    if (!rule) {
      throw new Error('cannot resolve rule <' + pkg + '/' + ruleName + '>');
    }

    return rule;
  };

  Resolver.prototype.resolveConfig = function (pkg, configName) {
    throw new Error('cannot resolve config <' + configName + '> in <' + pkg + '>');
  };

  // descriptions ride along in the bundle so the Issues panel can pick them up from the linting config
  // (no separate wiring for the host).
  return { resolver: new Resolver(), config, descriptions };
}

// Load a rule implementation from its locator via the matching source context.
function loadRule(locator, sources) {
  let marker = '';
  let path = locator;

  if (locator[0] === '@') {
    const slash = locator.indexOf('/');
    marker = locator.slice(0, slash);
    path = locator.slice(slash + 1);
  }

  const context = sources[marker];

  if (!context) {
    throw new Error('no rule source registered for <' + (marker || 'local') + '> (rule ' + locator + ')');
  }

  const mod = context('./' + path);
  return mod && mod.default ? mod.default : mod;
}

// Reverse bpmnlint's (pkg, ruleName) back to our locator-derived id: bpmnlint mangles the package
// segment to `[@scope/]bpmnlint-plugin-<name>`, so strip that to recover `[@scope/]<name>/<rule>`.
function toId(pkg, ruleName) {
  if (pkg === 'bpmnlint') {
    return ruleName;
  }

  const marker = 'bpmnlint-plugin-';
  const i = pkg.indexOf(marker);

  if (i === -1) {
    return pkg + '/' + ruleName;
  }

  const scope = pkg.slice(0, i);          // '' or '@scope/'
  const name = pkg.slice(i + marker.length);
  return scope + name + '/' + ruleName;
}
