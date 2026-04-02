/**
 * WMD Renderer — Renders a parsed WMD AST into an interactive wizard.
 */

import { validateStep } from './validator.js';

export class WizardRenderer {
  constructor(ast, container, options = {}) {
    this.ast = ast;
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.values = {};
    this.errors = {};
    this.currentStep = 0;
    this.onSubmit = options.onSubmit || null;
    this._storageKey = `wmd:${ast.config.title || 'form'}`;

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

  render() {
    this.container.innerHTML = '';
    this.container.classList.add('wmd-wizard');

    const title = document.createElement('h1');
    title.className = 'wmd-title';
    title.textContent = this.ast.config.title || 'Form';
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
      label.textContent = step.title;
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
    heading.textContent = step.title;
    el.appendChild(heading);

    if (step.descriptions.length) {
      const desc = document.createElement('p');
      desc.className = 'wmd-step-desc';
      desc.textContent = step.descriptions.join(' ');
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
    if (field.type === '_section') {
      const h = document.createElement('h3');
      h.className = 'wmd-section-title';
      h.textContent = field.label;
      return h;
    }
    if (field.type === '_divider') {
      const hr = document.createElement('hr');
      hr.className = 'wmd-divider';
      return hr;
    }
    if (field.type === 'hidden') {
      return document.createElement('span'); // invisible
    }

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
      span.textContent = field.label + (field.required ? ' *' : '');
      label.appendChild(span);
      wrapper.appendChild(label);
      this._appendError(wrapper, field.name);
      return wrapper;
    }

    // Label
    const label = document.createElement('label');
    label.className = 'wmd-label';
    label.textContent = field.label + (field.required ? ' *' : '');
    label.htmlFor = `wmd-${field.name}`;
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
        blank.textContent = `Select ${field.label}...`;
        blank.disabled = true;
        blank.selected = !this.values[field.name];
        input.appendChild(blank);
        for (const opt of field.options) {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
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
          s.textContent = opt.label;
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
          s.textContent = opt.label;
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

      if (field.attrs.placeholder) input.placeholder = field.attrs.placeholder;
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
      back.textContent = 'Back';
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
    next.textContent = isLast ? 'Submit' : 'Next';
    next.addEventListener('click', () => this._handleNext(isLast));
    nav.appendChild(next);

    return nav;
  }

  _handleNext(isSubmit) {
    const step = this.ast.steps[this.currentStep];
    const visibleFields = this._resolveFields(step.fields);
    this.errors = validateStep(visibleFields, this.values);

    if (Object.keys(this.errors).length > 0) {
      this.render();
      // Scroll to first error
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
      const visible = this._resolveFields(step.fields);
      for (const field of visible) {
        if (field.type?.startsWith('_')) continue;
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
    btn.textContent = 'Submitting...';

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
      btn.textContent = 'Submit';
      const errDiv = document.createElement('div');
      errDiv.className = 'wmd-submit-error';
      errDiv.textContent = `Submission failed: ${err.message}`;
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
    text.textContent = this.ast.config.success_message || 'Form submitted successfully!';
    msg.appendChild(text);

    this.container.appendChild(msg);

    // Log output for dev purposes
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
