/**
 * WMD — Wizard Markdown
 *
 * Main entry point. Parses a WMD source string or fetches a .wmd file,
 * then renders an interactive wizard into the target container.
 *
 * Usage:
 *   WMD.render('#wizard', { src: '/form.wmd' });
 *   WMD.render('#wizard', { source: '---\ntitle: ...\n---\n# Step 1\n...' });
 */

import { parse } from './parser.js';
import { WizardRenderer } from './renderer.js';

const WMD = {
  /**
   * Parse WMD source into an AST.
   */
  parse,

  /**
   * Render a wizard into a container element.
   *
   * @param {string|HTMLElement} container - CSS selector or DOM element
   * @param {Object} options
   * @param {string} [options.src]      - URL to a .wmd file to fetch
   * @param {string} [options.source]   - Raw WMD source string
   * @param {Function} [options.onSubmit] - Custom submit handler (receives JSON data)
   * @returns {Promise<WizardRenderer>}
   */
  async render(container, options = {}) {
    let source = options.source;

    if (!source && options.src) {
      const resp = await fetch(options.src);
      if (!resp.ok) throw new Error(`Failed to fetch ${options.src}: ${resp.status}`);
      source = await resp.text();
    }

    if (!source) throw new Error('WMD.render requires either `src` or `source` option');

    const ast = parse(source);
    const wizard = new WizardRenderer(ast, container, { onSubmit: options.onSubmit });
    wizard.render();
    return wizard;
  },
};

export default WMD;

// Auto-init: look for elements with data-wmd-src attribute
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-wmd-src]').forEach(el => {
      WMD.render(el, { src: el.dataset.wmdSrc });
    });
  });
}
