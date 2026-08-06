/**
 * Which severities a linter reports, and how to ask it for fewer.
 *
 * A bpmnlint rule states its own severity in the configuration it is given, so showing fewer severities is
 * not a matter of hiding rows: it is a matter of running fewer rules. What is switched off is therefore
 * gone from the canvas overlays, from the panel, from the canvas outline and from the tab badge alike,
 * which is what makes the diagram and the list say the same thing.
 *
 * A rule's severity may be written as a word, as a number, or as a pair of a severity and the options the
 * rule takes, so it is read here rather than compared.
 */

/** The severities, worst first, as bpmnlint names them. */
export const SEVERITIES = [ 'error', 'warn', 'info' ];

const BY_NUMBER = { 0: 'off', 1: 'warn', 2: 'error', 3: 'info' };

/**
 * The severity a rule is configured with.
 *
 * @param {string|number|Array} value  what the configuration states for one rule
 * @return {string} `error`, `warn`, `info` or `off`
 */
export function severityOf(value) {
  const stated = Array.isArray(value) ? value[0] : value;

  if (typeof stated === 'number') {
    return BY_NUMBER[stated] || 'off';
  }

  return SEVERITIES.includes(stated) ? stated : 'off';
}

/**
 * The same linter configuration with every rule of a severity that is not shown switched off.
 *
 * The configuration given is never modified: it is the original, and it is the only thing that still says
 * what severity a rule has once others have been switched off.
 *
 * @param {Object} config  the linter configuration the host provided
 * @param {Set<string>} shown  the severities to keep
 * @return {Object} a configuration for `Linting#setLinterConfig`
 */
export function withSeverities(config, shown) {
  const rules = (config && config.config && config.config.rules) || {},
        kept = {};

  Object.keys(rules).forEach((rule) => {
    kept[rule] = shown.has(severityOf(rules[rule])) ? rules[rule] : 'off';
  });

  return { ...config, config: { ...config.config, rules: kept } };
}
