/**
 * WMD Validator — Field validation logic.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\-+().]{7,20}$/;
const SSN_RE = /^\d{3}-?\d{2}-?\d{4}$/;

export function validateField(field, value) {
  const errors = [];

  // Required check
  if (field.required) {
    if (value === undefined || value === null || value === '' || value === false) {
      errors.push(`${field.label} is required`);
      return errors; // no point checking further
    }
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === '') return errors;

  const strVal = String(value);

  switch (field.type) {
    case 'email':
      if (!EMAIL_RE.test(strVal)) errors.push(`${field.label} must be a valid email`);
      break;

    case 'phone':
      if (!PHONE_RE.test(strVal)) errors.push(`${field.label} must be a valid phone number`);
      break;

    case 'ssn':
      if (!SSN_RE.test(strVal)) errors.push(`${field.label} must be a valid SSN (XXX-XX-XXXX)`);
      break;

    case 'number':
    case 'currency':
      if (isNaN(Number(strVal))) {
        errors.push(`${field.label} must be a number`);
      } else {
        const num = Number(strVal);
        if (field.attrs.min !== undefined && num < Number(field.attrs.min)) {
          errors.push(`${field.label} must be at least ${field.attrs.min}`);
        }
        if (field.attrs.max !== undefined && num > Number(field.attrs.max)) {
          errors.push(`${field.label} must be at most ${field.attrs.max}`);
        }
      }
      break;

    case 'text':
    case 'textarea':
      if (field.attrs.min !== undefined && strVal.length < Number(field.attrs.min)) {
        errors.push(`${field.label} must be at least ${field.attrs.min} characters`);
      }
      if (field.attrs.max !== undefined && strVal.length > Number(field.attrs.max)) {
        errors.push(`${field.label} must be at most ${field.attrs.max} characters`);
      }
      if (field.attrs.pattern) {
        const re = new RegExp(field.attrs.pattern);
        if (!re.test(strVal)) errors.push(`${field.label} format is invalid`);
      }
      break;
  }

  return errors;
}

export function validateStep(fields, values) {
  const allErrors = {};
  for (const field of fields) {
    if (field.type.startsWith('_')) continue;
    if (field.type === 'hidden') continue;
    const errs = validateField(field, values[field.name]);
    if (errs.length) allErrors[field.name] = errs;
  }
  return allErrors;
}
