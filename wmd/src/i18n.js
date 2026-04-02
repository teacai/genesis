/**
 * WMD i18n — Default locale strings and translation helper.
 *
 * Locale shape:
 * {
 *   // UI chrome
 *   back: "Back",
 *   next: "Next",
 *   submit: "Submit",
 *   submitting: "Submitting...",
 *   submitError: "Submission failed: {error}",
 *   selectPlaceholder: "Select {label}...",
 *   defaultSuccess: "Form submitted successfully!",
 *
 *   // Validation messages
 *   required: "{label} is required",
 *   invalidEmail: "{label} must be a valid email",
 *   invalidPhone: "{label} must be a valid phone number",
 *   invalidSSN: "{label} must be a valid SSN (XXX-XX-XXXX)",
 *   invalidNumber: "{label} must be a number",
 *   minValue: "{label} must be at least {min}",
 *   maxValue: "{label} must be at most {max}",
 *   minLength: "{label} must be at least {min} characters",
 *   maxLength: "{label} must be at most {max} characters",
 *   invalidFormat: "{label} format is invalid",
 *
 *   // Content translations (step titles, field labels, descriptions, options)
 *   steps: {
 *     "Personal Information": "Persönliche Daten",
 *     ...
 *   },
 *   descriptions: {
 *     "Please provide your legal name...": "Bitte geben Sie Ihren Namen an...",
 *     ...
 *   },
 *   fields: {
 *     "first_name": "Vorname",
 *     "last_name": "Nachname",
 *     ...
 *   },
 *   placeholders: {
 *     "first_name": "Johann",
 *     ...
 *   },
 *   options: {
 *     "employment_status": {
 *       "Employed full-time": "Vollzeit beschäftigt",
 *       ...
 *     },
 *     ...
 *   },
 *   sections: {
 *     "Income": "Einkommen",
 *     ...
 *   }
 * }
 */

export const DEFAULT_LOCALE = {
  // UI chrome
  back: 'Back',
  next: 'Next',
  submit: 'Submit',
  submitting: 'Submitting...',
  submitError: 'Submission failed: {error}',
  selectPlaceholder: 'Select {label}...',
  defaultSuccess: 'Form submitted successfully!',
  codeCopy: 'Copy',
  codeCopied: 'Copied!',

  // Validation
  required: '{label} is required',
  invalidEmail: '{label} must be a valid email',
  invalidPhone: '{label} must be a valid phone number',
  invalidSSN: '{label} must be a valid SSN (XXX-XX-XXXX)',
  invalidNumber: '{label} must be a number',
  minValue: '{label} must be at least {min}',
  maxValue: '{label} must be at most {max}',
  minLength: '{label} must be at least {min} characters',
  maxLength: '{label} must be at most {max} characters',
  invalidFormat: '{label} format is invalid',
};

/**
 * Look up a locale key and interpolate {placeholder} tokens.
 *
 * @param {Object} locale  Merged locale object
 * @param {string} key     Dot-free key name (e.g. "required", "back")
 * @param {Object} [vars]  Interpolation values (e.g. { label: "Email", min: 2 })
 * @returns {string}
 */
export function t(locale, key, vars = {}) {
  const template = locale[key] ?? DEFAULT_LOCALE[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`
  );
}

/**
 * Build a merged locale: defaults < external < frontmatter < JS options.
 * Each layer is a partial object — only provided keys override.
 */
export function mergeLocale(...layers) {
  const merged = { ...DEFAULT_LOCALE };
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue;
    for (const [k, v] of Object.entries(layer)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        // Nested objects (steps, fields, options, etc.) — merge one level deep
        merged[k] = { ...(merged[k] || {}), ...v };
      } else if (v !== undefined) {
        merged[k] = v;
      }
    }
  }
  return merged;
}
