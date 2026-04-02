/**
 * WMD Validator — Field validation logic with i18n support.
 */

import { t as defaultT, DEFAULT_LOCALE } from './i18n.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\-+().]{7,20}$/;
const SSN_RE = /^\d{3}-?\d{2}-?\d{4}$/;

export function validateField(field, value, locale) {
  const errors = [];
  const tr = (key, vars) => t(locale || DEFAULT_LOCALE, key, vars);
  const label = field._displayLabel || field.label;

  // Required check
  if (field.required) {
    if (value === undefined || value === null || value === '' || value === false) {
      errors.push(tr('required', { label }));
      return errors;
    }
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === '') return errors;

  const strVal = String(value);

  switch (field.type) {
    case 'email':
      if (!EMAIL_RE.test(strVal)) errors.push(tr('invalidEmail', { label }));
      break;

    case 'phone':
      if (!PHONE_RE.test(strVal)) errors.push(tr('invalidPhone', { label }));
      break;

    case 'ssn':
      if (!SSN_RE.test(strVal)) errors.push(tr('invalidSSN', { label }));
      break;

    case 'number':
    case 'currency':
      if (isNaN(Number(strVal))) {
        errors.push(tr('invalidNumber', { label }));
      } else {
        const num = Number(strVal);
        if (field.attrs.min !== undefined && num < Number(field.attrs.min)) {
          errors.push(tr('minValue', { label, min: field.attrs.min }));
        }
        if (field.attrs.max !== undefined && num > Number(field.attrs.max)) {
          errors.push(tr('maxValue', { label, max: field.attrs.max }));
        }
      }
      break;

    case 'text':
    case 'textarea':
      if (field.attrs.min !== undefined && strVal.length < Number(field.attrs.min)) {
        errors.push(tr('minLength', { label, min: field.attrs.min }));
      }
      if (field.attrs.max !== undefined && strVal.length > Number(field.attrs.max)) {
        errors.push(tr('maxLength', { label, max: field.attrs.max }));
      }
      if (field.attrs.pattern) {
        const re = new RegExp(field.attrs.pattern);
        if (!re.test(strVal)) errors.push(tr('invalidFormat', { label }));
      }
      break;
  }

  return errors;
}

export function validateStep(fields, values, locale) {
  const allErrors = {};
  for (const field of fields) {
    if (field.type.startsWith('_')) continue;
    if (field.type === 'hidden') continue;
    const errs = validateField(field, values[field.name], locale);
    if (errs.length) allErrors[field.name] = errs;
  }
  return allErrors;
}
