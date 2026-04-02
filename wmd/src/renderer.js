/**
 * WMD Renderer — Renders a parsed WMD AST into an interactive wizard.
 */

import { validateStep } from './validator.js';
import { t, mergeLocale, DEFAULT_LOCALE } from './i18n.js';
import { evaluateFormula } from './formula.js';

export class WizardRenderer {
  constructor(ast, container, options = {}) {
    this.ast = ast;
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.values = {};
    this.errors = {};
    this.currentStep = 0;
    this.onSubmit = options.onSubmit || null;
    this._storageKey = `wmd:${ast.config.title || 'form'}`;
    this.locale = mergeLocale(DEFAULT_LOCALE, options._externalLocale, ast.config.locale, options.locale);

    // Initialize hidden field values and defaults
    this._walkFields(ast.steps, field => {
      if (field.type === 'hidden' && field.value !== undefined) {
        this.values[field.name] = field.value;
      }
      if (field.attrs?.default !== undefined) {
        this.values[field.name] = field.attrs.default;
      }
    });

    // Restore saved state from localStorage
    this._loadState();
  }

  /** Translate a UI string key with interpolation. */
  _t(key, vars) {
    return t(this.locale, key, vars);
  }

  /** Translate a step title. */
  _tStep(title) {
    return this.locale.steps?.[title] ?? title;
  }

  /** Translate a step description. */
  _tDesc(text) {
    return this.locale.descriptions?.[text] ?? text;
  }

  /** Translate a field label. Returns the translated label. */
  _tField(field) {
    return this.locale.fields?.[field.name] ?? field.label;
  }

  /** Translate a field placeholder. */
  _tPlaceholder(field) {
    return this.locale.placeholders?.[field.name] ?? field.attrs.placeholder ?? '';
  }

  /** Translate a section title. */
  _tSection(label) {
    return this.locale.sections?.[label] ?? label;
  }

  /** Translate a heading label. Falls back to sections for backward compat. */
  _tHeading(label) {
    return this.locale.headings?.[label] ?? this.locale.sections?.[label] ?? label;
  }

  /** Translate an option label for a given field. */
  _tOption(fieldName, optionLabel) {
    return this.locale.options?.[fieldName]?.[optionLabel] ?? optionLabel;
  }

  render() {
    this.container.innerHTML = '';
    this.container.classList.add('wmd-wizard');

    const title = document.createElement('h1');
    title.className = 'wmd-title';
    title.textContent = this.locale.title ?? this.ast.config.title ?? 'Form';
    this.container.appendChild(title);

    // Progress bar
    if (this.ast.steps.length > 1) {
      this.container.appendChild(this._renderProgress());
    }

    // Step content
    const stepEl = this._renderStep(this.ast.steps[this.currentStep]);
    this.container.appendChild(stepEl);

    // Navigation
    this.container.appendChild(this._renderNav());
  }

  _renderProgress() {
    const bar = document.createElement('div');
    bar.className = 'wmd-progress';

    const steps = this.ast.steps;
    steps.forEach((step, idx) => {
      const dot = document.createElement('div');
      dot.className = 'wmd-progress-step';
      if (idx < this.currentStep) dot.classList.add('wmd-completed');
      if (idx === this.currentStep) dot.classList.add('wmd-active');

      const num = document.createElement('span');
      num.className = 'wmd-step-number';
      num.textContent = idx + 1;
      dot.appendChild(num);

      const label = document.createElement('span');
      label.className = 'wmd-step-label';
      label.textContent = this._tStep(step.title);
      dot.appendChild(label);

      bar.appendChild(dot);

      if (idx < steps.length - 1) {
        const line = document.createElement('div');
        line.className = 'wmd-progress-line';
        if (idx < this.currentStep) line.classList.add('wmd-completed');
        bar.appendChild(line);
      }
    });

    return bar;
  }

  _renderStep(step) {
    const el = document.createElement('div');
    el.className = 'wmd-step';

    const heading = document.createElement('h2');
    heading.className = 'wmd-step-title';
    heading.textContent = this._tStep(step.title);
    el.appendChild(heading);

    if (step.descriptions.length) {
      const desc = document.createElement('p');
      desc.className = 'wmd-step-desc';
      this._appendInline(desc, step.descriptions.map(d => this._tDesc(d)).join(' '));
      el.appendChild(desc);
    }

    const visibleFields = this._resolveFields(step.fields);
    for (const field of visibleFields) {
      el.appendChild(this._renderField(field));
    }

    return el;
  }

  _resolveFields(fields) {
    const result = [];
    for (const field of fields) {
      if (field.type === '_condition') {
        if (this._evalCondition(field)) {
          result.push(...this._resolveFields(field.fields));
        }
      } else if (field.type === '_toggle') {
        // Keep toggle as a single node; resolve its children at render time
        result.push({ ...field, fields: this._resolveFields(field.fields) });
      } else {
        result.push(field);
      }
    }
    return result;
  }

  _evalCondition(cond) {
    const actual = String(this.values[cond.field] ?? '');
    const expected = cond.value;
    switch (cond.operator) {
      case '=': return actual === expected;
      case '!=': return actual !== expected;
      case '>': return Number(actual) > Number(expected);
      case '<': return Number(actual) < Number(expected);
      case '>=': return Number(actual) >= Number(expected);
      case '<=': return Number(actual) <= Number(expected);
      case 'contains': return actual.includes(expected);
      default: return false;
    }
  }

  _renderField(field) {
    if (field.type === '_heading') {
      const level = Math.min(Math.max(field.level, 1), 4);
      const h = document.createElement(`h${level + 1}`);
      h.className = `wmd-heading wmd-heading-${level}`;
      this._appendInline(h, this._tHeading(field.label));
      return h;
    }
    if (field.type === '_section') {
      const h = document.createElement('h3');
      h.className = 'wmd-heading wmd-heading-2';
      h.textContent = this._tSection(field.label);
      return h;
    }
    if (field.type === '_divider') {
      const hr = document.createElement('hr');
      hr.className = 'wmd-divider';
      return hr;
    }
    if (field.type === '_code') {
      return this._renderCodeBlock(field);
    }
    if (field.type === '_text') {
      return this._renderMarkdown(field);
    }
    if (field.type === '_blockquote') {
      return this._renderBlockquote(field);
    }
    if (field.type === '_image') {
      return this._renderImage(field);
    }
    if (field.type === '_table') {
      return this._renderTable(field);
    }
    if (field.type === '_toggle') {
      return this._renderToggle(field);
    }
    if (field.type === 'formula') {
      return this._renderFormula(field);
    }
    if (field.type === 'hidden') {
      return document.createElement('span');
    }

    const displayLabel = this._tField(field);
    // Attach translated label for use in validation messages
    field._displayLabel = displayLabel;

    const wrapper = document.createElement('div');
    wrapper.className = 'wmd-field';
    if (this.errors[field.name]) wrapper.classList.add('wmd-field-error');

    // Checkbox is special — label wraps the input
    if (field.type === 'checkbox') {
      const label = document.createElement('label');
      label.className = 'wmd-checkbox-label';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = field.name;
      input.checked = !!this.values[field.name];
      input.addEventListener('change', () => {
        this.values[field.name] = input.checked;
        this._clearFieldError(field.name, wrapper);
        this._rerender();
      });
      label.appendChild(input);
      const span = document.createElement('span');
      this._appendInline(span, displayLabel + (field.required ? ' *' : ''));
      // Prevent link clicks from toggling the checkbox
      span.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          window.open(a.href, '_blank', 'noopener,noreferrer');
        });
      });
      label.appendChild(span);
      wrapper.appendChild(label);
      this._appendError(wrapper, field.name);
      return wrapper;
    }

    // Label
    const label = document.createElement('label');
    label.className = 'wmd-label';
    this._appendInline(label, displayLabel + (field.required ? ' *' : ''));
    label.htmlFor = `wmd-${field.name}`;
    // Prevent link clicks from activating the label's associated input
    label.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.open(a.href, '_blank', 'noopener,noreferrer');
      });
    });
    wrapper.appendChild(label);

    // Input
    let input;
    switch (field.type) {
      case 'textarea':
        input = document.createElement('textarea');
        input.rows = 4;
        break;

      case 'select':
        input = document.createElement('select');
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = this._t('selectPlaceholder', { label: displayLabel });
        blank.disabled = true;
        blank.selected = !this.values[field.name];
        input.appendChild(blank);
        for (const opt of field.options) {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = this._tOption(field.name, opt.label);
          if (this.values[field.name] === opt.value) o.selected = true;
          input.appendChild(o);
        }
        break;

      case 'radio':
        input = document.createElement('div');
        input.className = 'wmd-radio-group';
        for (const opt of field.options) {
          const rl = document.createElement('label');
          rl.className = 'wmd-radio-label';
          const r = document.createElement('input');
          r.type = 'radio';
          r.name = field.name;
          r.value = opt.value;
          r.checked = this.values[field.name] === opt.value;
          r.addEventListener('change', () => {
            this.values[field.name] = opt.value;
            this._clearFieldError(field.name, wrapper);
            this._rerender();
          });
          rl.appendChild(r);
          const s = document.createElement('span');
          s.textContent = this._tOption(field.name, opt.label);
          rl.appendChild(s);
          input.appendChild(rl);
        }
        wrapper.appendChild(input);
        this._appendError(wrapper, field.name);
        return wrapper;

      case 'checkboxes':
        input = document.createElement('div');
        input.className = 'wmd-checkbox-group';
        const selected = this.values[field.name] || [];
        for (const opt of field.options) {
          const cl = document.createElement('label');
          cl.className = 'wmd-checkbox-label';
          const c = document.createElement('input');
          c.type = 'checkbox';
          c.value = opt.value;
          c.checked = selected.includes(opt.value);
          c.addEventListener('change', () => {
            const cur = this.values[field.name] || [];
            if (c.checked) {
              this.values[field.name] = [...cur, opt.value];
            } else {
              this.values[field.name] = cur.filter(v => v !== opt.value);
            }
            this._clearFieldError(field.name, wrapper);
            this._saveState();
          });
          cl.appendChild(c);
          const s = document.createElement('span');
          s.textContent = this._tOption(field.name, opt.label);
          cl.appendChild(s);
          input.appendChild(cl);
        }
        wrapper.appendChild(input);
        this._appendError(wrapper, field.name);
        return wrapper;

      case 'ssn':
        input = document.createElement('input');
        input.type = 'password';
        input.maxLength = 11;
        input.autocomplete = 'off';
        input.setAttribute('data-lpignore', 'true');
        break;

      case 'currency':
        input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        break;

      default:
        input = document.createElement('input');
        input.type = field.type === 'phone' ? 'tel' :
                     field.type === 'email' ? 'email' :
                     field.type === 'number' ? 'number' :
                     field.type === 'date' ? 'date' :
                     field.type === 'password' ? 'password' :
                     field.type === 'file' ? 'file' : 'text';
        break;
    }

    if (input.tagName !== 'DIV') {
      input.id = `wmd-${field.name}`;
      input.name = field.name;
      input.className = 'wmd-input';

      const placeholder = this._tPlaceholder(field);
      if (placeholder) input.placeholder = placeholder;
      if (field.attrs.accept) input.accept = field.attrs.accept;
      if (field.type !== 'file' && this.values[field.name] !== undefined) {
        input.value = this.values[field.name];
      }

      input.addEventListener('input', () => {
        this.values[field.name] = input.value;
        this._clearFieldError(field.name, wrapper);
        this._saveState();
      });

      // For select
      if (field.type === 'select') {
        input.addEventListener('change', () => {
          this.values[field.name] = input.value;
          this._clearFieldError(field.name, wrapper);
          this._rerender();
        });
      }
    }

    wrapper.appendChild(input);
    this._appendError(wrapper, field.name);
    return wrapper;
  }

  _renderImage(field) {
    const figure = document.createElement('figure');
    figure.className = 'wmd-image';

    const img = document.createElement('img');
    img.src = field.src;
    img.alt = field.alt;
    img.loading = 'lazy';
    figure.appendChild(img);

    if (field.alt) {
      const caption = document.createElement('figcaption');
      caption.className = 'wmd-image-caption';
      caption.textContent = field.alt;
      figure.appendChild(caption);
    }

    return figure;
  }

  _renderBlockquote(field) {
    const bq = document.createElement('blockquote');
    bq.className = 'wmd-blockquote';
    for (const line of field.lines) {
      const p = document.createElement('p');
      this._appendInline(p, line);
      bq.appendChild(p);
    }
    return bq;
  }

  _renderTable(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wmd-table-wrapper';

    const table = document.createElement('table');
    table.className = 'wmd-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    field.headers.forEach((h, idx) => {
      const th = document.createElement('th');
      th.style.textAlign = field.aligns[idx] || 'left';
      this._appendInline(th, h);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    for (const row of field.rows) {
      const tr = document.createElement('tr');
      row.forEach((cell, idx) => {
        const td = document.createElement('td');
        td.style.textAlign = field.aligns[idx] || 'left';
        this._appendInline(td, cell);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    wrapper.appendChild(table);
    return wrapper;
  }

  _renderToggle(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wmd-toggle';

    // Auto-open if there are validation errors inside this toggle
    const childFields = this._flattenFields(field.fields);
    const hasErrors = childFields.some(f => f.name && this.errors[f.name]);
    const isOpen = field.open || hasErrors;
    if (isOpen) wrapper.classList.add('wmd-toggle-open');

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'wmd-toggle-header';

    const arrow = document.createElement('span');
    arrow.className = 'wmd-toggle-arrow';
    arrow.textContent = '\u25B6'; // right-pointing triangle
    header.appendChild(arrow);

    const label = document.createElement('span');
    label.className = 'wmd-toggle-label';
    const displayLabel = this.locale.toggles?.[field.label] ?? field.label;
    this._appendInline(label, displayLabel);
    header.appendChild(label);

    wrapper.appendChild(header);

    const content = document.createElement('div');
    content.className = 'wmd-toggle-content';

    for (const child of field.fields) {
      content.appendChild(this._renderField(child));
    }

    wrapper.appendChild(content);

    header.addEventListener('click', () => {
      wrapper.classList.toggle('wmd-toggle-open');
    });

    return wrapper;
  }

  _renderFormula(field) {
    const displayLabel = this._tField(field);
    const wrapper = document.createElement('div');
    wrapper.className = 'wmd-field wmd-field-formula';

    const label = document.createElement('label');
    label.className = 'wmd-label';
    this._appendInline(label, displayLabel);
    label.htmlFor = `wmd-${field.name}`;
    label.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.open(a.href, '_blank', 'noopener,noreferrer');
      });
    });
    wrapper.appendChild(label);

    // Evaluate formula against current values
    const rawValue = evaluateFormula(field.formula, this.values);
    const decimals = field.attrs.decimals !== undefined ? Number(field.attrs.decimals) : 2;
    const numValue = Number(rawValue.toFixed(decimals));

    // Store computed value for submission and other formulas
    this.values[field.name] = numValue;

    // Format for display
    const formatted = this._formatFormulaValue(numValue, decimals, field.attrs.format);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `wmd-${field.name}`;
    input.name = field.name;
    input.className = 'wmd-input wmd-input-formula';
    input.readOnly = true;
    input.tabIndex = -1;
    input.value = formatted;

    wrapper.appendChild(input);
    return wrapper;
  }

  _formatFormulaValue(num, decimals, format) {
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const display = decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;

    if (format === 'currency') return `$${display}`;
    if (format === 'percent') return `${display}%`;
    return display;
  }

  _renderMarkdown(field) {
    const frag = document.createDocumentFragment();
    let i = 0;
    const lines = field.lines;

    while (i < lines.length) {
      const line = lines[i];

      // Unordered list — collect consecutive ul items
      if (line.kind === 'ul') {
        const ul = document.createElement('ul');
        ul.className = 'wmd-list';
        while (i < lines.length && lines[i].kind === 'ul') {
          const li = document.createElement('li');
          this._appendInline(li, lines[i].text);
          ul.appendChild(li);
          i++;
        }
        frag.appendChild(ul);
        continue;
      }

      // Ordered list — collect consecutive ol items
      if (line.kind === 'ol') {
        const ol = document.createElement('ol');
        ol.className = 'wmd-list';
        while (i < lines.length && lines[i].kind === 'ol') {
          const li = document.createElement('li');
          this._appendInline(li, lines[i].text);
          ol.appendChild(li);
          i++;
        }
        frag.appendChild(ol);
        continue;
      }

      // Paragraph — collect consecutive p lines into one <p>
      const p = document.createElement('p');
      p.className = 'wmd-text';
      const pTexts = [];
      while (i < lines.length && lines[i].kind === 'p') {
        pTexts.push(lines[i].text);
        i++;
      }
      this._appendInline(p, pTexts.join(' '));
      frag.appendChild(p);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'wmd-markdown';
    wrapper.appendChild(frag);
    return wrapper;
  }

  /**
   * Parse inline markdown (bold, italic, bold-italic, inline code, links)
   * and append as DOM nodes to the parent element. No innerHTML — safe from XSS.
   */
  _appendInline(parent, text) {
    // Regex matches inline tokens in order of priority:
    // 1. ![alt](url)              — inline image (must be before link)
    // 2. [link text](url)         — markdown link
    // 3. ***bold italic*** / ___  — bold italic
    // 4. **bold** / __            — bold
    // 5. *italic* / _             — italic
    // 6. `inline code`            — code
    const TOKEN_RE = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|(\*{3}|_{3})(.*?)\5|(\*{2}|_{2})(.*?)\7|(\*|_)(.*?)\9|`([^`]+)`/g;

    let lastIndex = 0;
    let match;

    while ((match = TOKEN_RE.exec(text)) !== null) {
      // Append any plain text before this match
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      if (match[1] !== undefined) {
        // ![alt](url) — inline image
        const img = document.createElement('img');
        img.src = match[2];
        img.alt = match[1];
        img.loading = 'lazy';
        img.className = 'wmd-inline-image';
        parent.appendChild(img);
      } else if (match[3] !== undefined) {
        // [link text](url)
        const a = document.createElement('a');
        a.href = match[4];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'wmd-link';
        // Recurse to support formatting inside link text: [**bold link**](url)
        this._appendInline(a, match[3]);
        parent.appendChild(a);
      } else if (match[5]) {
        // ***bold italic***
        const el = document.createElement('strong');
        const em = document.createElement('em');
        em.textContent = match[6];
        el.appendChild(em);
        parent.appendChild(el);
      } else if (match[7]) {
        // **bold**
        const el = document.createElement('strong');
        el.textContent = match[8];
        parent.appendChild(el);
      } else if (match[9]) {
        // *italic*
        const el = document.createElement('em');
        el.textContent = match[10];
        parent.appendChild(el);
      } else if (match[11] !== undefined) {
        // `inline code`
        const el = document.createElement('code');
        el.className = 'wmd-inline-code';
        el.textContent = match[11];
        parent.appendChild(el);
      }

      lastIndex = match.index + match[0].length;
    }

    // Append remaining plain text
    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  _renderCodeBlock(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wmd-code-block';

    // Header bar with optional language label and copy button
    const header = document.createElement('div');
    header.className = 'wmd-code-header';

    const langLabel = document.createElement('span');
    langLabel.className = 'wmd-code-lang';
    langLabel.textContent = field.lang || '';
    header.appendChild(langLabel);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'wmd-code-copy';
    copyBtn.textContent = this._t('codeCopy');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(field.code).then(() => {
        copyBtn.textContent = this._t('codeCopied');
        copyBtn.classList.add('wmd-code-copied');
        setTimeout(() => {
          copyBtn.textContent = this._t('codeCopy');
          copyBtn.classList.remove('wmd-code-copied');
        }, 2000);
      });
    });
    header.appendChild(copyBtn);

    wrapper.appendChild(header);

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = field.code;
    pre.appendChild(code);
    wrapper.appendChild(pre);

    return wrapper;
  }

  _appendError(wrapper, fieldName) {
    if (this.errors[fieldName]) {
      const errEl = document.createElement('div');
      errEl.className = 'wmd-error-msg';
      errEl.textContent = this.errors[fieldName][0];
      wrapper.appendChild(errEl);
    }
  }

  _clearFieldError(name, wrapper) {
    delete this.errors[name];
    wrapper.classList.remove('wmd-field-error');
    const errEl = wrapper.querySelector('.wmd-error-msg');
    if (errEl) errEl.remove();
  }

  _renderNav() {
    const nav = document.createElement('div');
    nav.className = 'wmd-nav';

    if (this.currentStep > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'wmd-btn wmd-btn-back';
      back.textContent = this._t('back');
      back.addEventListener('click', () => {
        this.currentStep--;
        this.errors = {};
        this._saveState();
        this.render();
      });
      nav.appendChild(back);
    } else {
      nav.appendChild(document.createElement('span')); // spacer
    }

    const isLast = this.currentStep === this.ast.steps.length - 1;
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'wmd-btn wmd-btn-next';
    next.textContent = isLast ? this._t('submit') : this._t('next');
    next.addEventListener('click', () => this._handleNext(isLast));
    nav.appendChild(next);

    return nav;
  }

  /** Flatten toggles so their children are included for validation/submission. */
  _flattenFields(fields) {
    const result = [];
    for (const field of fields) {
      if (field.type === '_toggle') {
        result.push(...this._flattenFields(field.fields));
      } else {
        result.push(field);
      }
    }
    return result;
  }

  _handleNext(isSubmit) {
    const step = this.ast.steps[this.currentStep];
    const visibleFields = this._flattenFields(this._resolveFields(step.fields));
    // Set _displayLabel on each field before validation so messages use translated labels
    for (const field of visibleFields) {
      if (!field.type.startsWith('_') && field.type !== 'hidden') {
        field._displayLabel = this._tField(field);
      }
    }
    this.errors = validateStep(visibleFields, this.values, this.locale);

    if (Object.keys(this.errors).length > 0) {
      this.render();
      const firstErr = this.container.querySelector('.wmd-field-error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (isSubmit) {
      this._submit();
    } else {
      this.currentStep++;
      this._saveState();
      this.render();
      this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async _submit() {
    // Build clean output — exclude hidden conditional fields
    const output = {};
    for (const step of this.ast.steps) {
      const visible = this._flattenFields(this._resolveFields(step.fields));
      for (const field of visible) {
        if (field.type?.startsWith('_')) continue;
        if (field.type === 'formula') {
          // Recompute formula at submission time
          output[field.name] = evaluateFormula(field.formula, this.values);
          const dec = field.attrs?.decimals !== undefined ? Number(field.attrs.decimals) : 2;
          output[field.name] = Number(output[field.name].toFixed(dec));
          continue;
        }
        const val = field.type === 'hidden' ? field.value : this.values[field.name];
        if (val !== undefined && val !== '') {
          output[field.name] = field.type === 'number' || field.type === 'currency'
            ? Number(val) : val;
        }
      }
    }

    // Custom submit handler
    if (this.onSubmit) {
      this._clearState();
      this.onSubmit(output);
      return;
    }

    const url = this.ast.config.submit_url;
    if (!url) {
      this._showSuccess(output);
      return;
    }

    // Show loading
    const nav = this.container.querySelector('.wmd-nav');
    const btn = nav.querySelector('.wmd-btn-next');
    btn.disabled = true;
    btn.textContent = this._t('submitting');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.ast.config.auth_header) {
        headers['Authorization'] = this.ast.config.auth_header;
      }

      const resp = await fetch(url, {
        method: (this.ast.config.method || 'POST').toUpperCase(),
        headers,
        body: JSON.stringify(output),
      });

      if (!resp.ok) throw new Error(`Server responded with ${resp.status}`);
      this._showSuccess(output);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = this._t('submit');
      const errDiv = document.createElement('div');
      errDiv.className = 'wmd-submit-error';
      errDiv.textContent = this._t('submitError', { error: err.message });
      nav.prepend(errDiv);
    }
  }

  _showSuccess(output) {
    this._clearState();
    this.container.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = 'wmd-success';

    const icon = document.createElement('div');
    icon.className = 'wmd-success-icon';
    icon.textContent = '\u2713';
    msg.appendChild(icon);

    const text = document.createElement('p');
    text.textContent = this.ast.config.success_message || this._t('defaultSuccess');
    msg.appendChild(text);

    this.container.appendChild(msg);

    console.log('[WMD] Submitted data:', output);
  }

  _saveState() {
    try {
      const state = { values: this.values, step: this.currentStep };
      localStorage.setItem(this._storageKey, JSON.stringify(state));
    } catch { /* quota exceeded or unavailable — ignore */ }
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.values && typeof state.values === 'object') {
        Object.assign(this.values, state.values);
      }
      if (typeof state.step === 'number' && state.step >= 0 && state.step < this.ast.steps.length) {
        this.currentStep = state.step;
      }
    } catch { /* corrupted or unavailable — start fresh */ }
  }

  _clearState() {
    try { localStorage.removeItem(this._storageKey); } catch { /* ignore */ }
  }

  _rerender() {
    this._saveState();
    this.render();
  }

  _walkFields(steps, cb) {
    for (const step of steps) {
      for (const field of step.fields) {
        if (field.type === '_condition') {
          field.fields.forEach(cb);
        } else {
          cb(field);
        }
      }
    }
  }
}
