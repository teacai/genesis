# WMD — Wizard Markdown

A markdown-based markup language for defining multi-step wizard forms.

## Overview

WMD files (`.wmd`) define wizard forms using a readable, markdown-inspired syntax. A JavaScript library parses WMD and renders an interactive step-by-step wizard that submits answers as JSON.

## File Structure

```
---
frontmatter (YAML-like config)
---

# Step heading

> Description text

field definitions
```

## Frontmatter

A YAML-like block between `---` fences at the top of the file. Configures the wizard behavior.

| Key            | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `title`        | yes      | Wizard title displayed at the top                |
| `submit_url`   | yes      | URL to POST the JSON results to                  |
| `method`       | no       | HTTP method (default: `POST`)                    |
| `success_message` | no    | Message shown after successful submission        |
| `auth_header`  | no       | Authorization header value for the submit request|

Example:
```
---
title: Account Application
submit_url: https://api.example.com/applications
method: POST
success_message: Your application has been submitted!
auth_header: Bearer {{token}}
---
```

## Steps

Each `#` heading creates a new wizard step. The heading text becomes the step label.

```
# Personal Information
```

## Descriptions

Lines starting with `>` add description text to the current step.

```
> Please provide your legal name as it appears on your ID.
> All fields marked with * are required.
```

## Fields

Fields are defined using a bracket syntax:

```
[type: field_name] Label Text
```

Append `*` to the label to mark required:

```
[text: full_name] Full Name *
```

### Field Types

| Type        | Renders As          | Notes                                    |
|-------------|---------------------|------------------------------------------|
| `text`      | Text input          | Single-line text                         |
| `textarea`  | Textarea            | Multi-line text                          |
| `email`     | Email input         | Validates email format                   |
| `phone`     | Phone input         | Validates phone format                   |
| `number`    | Number input        | Numeric only                             |
| `currency`  | Currency input      | Formats as currency, stores as number    |
| `date`      | Date picker         | ISO date format                          |
| `ssn`       | Masked SSN input    | Format: XXX-XX-XXXX, masked display      |
| `password`  | Password input      | Masked input                             |
| `select`    | Dropdown            | Options follow on `- ` lines             |
| `radio`     | Radio button group  | Options follow on `- ` lines             |
| `checkbox`  | Single checkbox     | Boolean value                            |
| `checkboxes`| Checkbox group      | Options follow on `- ` lines, multi-select|
| `file`      | File upload         | Accepts file types via attributes        |
| `hidden`    | Hidden field        | Not shown, value set via `= value`       |

### Field Options

For `select`, `radio`, and `checkboxes`, list options on `- ` lines immediately after the field:

```
[select: country] Country *
- United States
- Canada
- United Kingdom
- Other
```

Option values default to the option text. To set a different value, use `|`:

```
[select: state] State *
- California | CA
- New York | NY
- Texas | TX
```

### Field Attributes

Add attributes in parentheses after the type:

```
[text(placeholder="John Doe", min=2, max=100): full_name] Full Name *
```

| Attribute     | Applies To       | Description                          |
|---------------|------------------|--------------------------------------|
| `placeholder` | text, textarea, email, phone, number, currency | Placeholder text |
| `min`         | text, textarea, number, currency | Minimum length or value   |
| `max`         | text, textarea, number, currency | Maximum length or value   |
| `pattern`     | text, phone      | Regex validation pattern             |
| `accept`      | file             | Accepted file types                  |
| `default`     | all              | Default value                        |
| `mask`        | text             | Input mask pattern (# = digit, A = letter) |

### Hidden Fields

Set hidden field values with `=`:

```
[hidden: source] = website
```

## Conditional Logic

Show or hide fields based on other field values using `?if` syntax:

```
[radio: has_spouse] Do you have a spouse? *
- Yes
- No

?if has_spouse = "Yes"
[text: spouse_name] Spouse's Full Name *
[date: spouse_dob] Spouse's Date of Birth *
?endif
```

Supported operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`

## Sections Within Steps

Use `##` for visual grouping within a step (does not create a new wizard step):

```
# Financial Information

## Income
[currency: annual_income] Annual Income *
[select: income_source] Primary Income Source *
- Employment
- Self-employment
- Investments
- Retirement

## Assets
[currency: savings] Total Savings *
[currency: investments] Investment Portfolio Value
```

## Inline Formatting

Standard markdown inline formatting is supported in descriptions (`>`), text blocks, and list items:

| Syntax | Renders As |
|--------|------------|
| `**bold**` or `__bold__` | **bold** |
| `*italic*` or `_italic_` | *italic* |
| `***bold italic***` or `___bold italic___` | ***bold italic*** |
| `` `inline code` `` | `inline code` |

Example:
```
> Please provide your **legal name** as it appears on your *government-issued ID*.
```

## Text Blocks & Lists

Plain text lines and list items between fields render as styled markdown content. Consecutive lines of the same type are grouped together.

**Paragraphs** — any non-field, non-heading text line:
```
This is a paragraph of explanatory text.
It continues on the next line and wraps into a single `<p>` element.
```

**Unordered lists** — lines starting with `- `, `* `, or `+ `:
```
- First item with **bold** text
- Second item with *italic* text
- Third item with `code`
```

**Ordered lists** — lines starting with `1. `, `2) `, etc:
```
1. Complete the personal information section
2. Provide your employment details
3. Review and submit
```

Lists and text blocks are display-only — they do not produce form values in the JSON output.

## Code Blocks

Use fenced code blocks (triple backticks) to display code snippets within a step. A copy-to-clipboard button appears in the top-right corner. Optionally specify a language after the opening backticks:

````
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```
````

The code block renders with:
- A header bar showing the language label (if provided) and a **Copy** button
- Dark-themed `<pre><code>` block with monospace font
- The Copy button shows "Copied!" feedback for 2 seconds after clicking

Code blocks are display-only — they do not produce form values in the JSON output.

## Dividers

Use `---` (outside frontmatter) to add a visual divider within a step:

```
[text: first_name] First Name *
[text: last_name] Last Name *
---
[email: email] Email Address *
```

## Complete Example

```
---
title: Loan Application
submit_url: https://api.bank.example/applications
success_message: Thank you! Your application is under review.
---

# Personal Information

> Please provide your legal information exactly as it appears on your government-issued ID.

[text(placeholder="John"): first_name] First Name *
[text(placeholder="Doe"): last_name] Last Name *
[date: date_of_birth] Date of Birth *
[ssn: social_security_number] Social Security Number *
[phone: phone_number] Phone Number *
[email: email_address] Email Address *

# Address

> Your current residential address.

[text: street_address] Street Address *
[text: apt_number] Apt / Suite / Unit
[text: city] City *
[select: state] State *
- Alabama | AL
- Alaska | AK
- Arizona | AZ
[text(pattern="\\d{5}"): zip_code] ZIP Code *

# Employment & Income

[select: employment_status] Employment Status *
- Employed full-time
- Employed part-time
- Self-employed
- Retired
- Unemployed

?if employment_status = "Employed full-time"
[text: employer_name] Employer Name *
[phone: employer_phone] Employer Phone
[currency: annual_salary] Annual Salary *
?endif

?if employment_status = "Self-employed"
[text: business_name] Business Name *
[currency: annual_revenue] Annual Business Revenue *
?endif

# Review & Submit

> Please review your information before submitting.

[checkbox: certify_accurate] I certify that all information provided is accurate and complete *
[checkbox: agree_terms] I agree to the Terms of Service and Privacy Policy *
```

## JSON Output

The wizard submits a flat JSON object keyed by field names:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-05-15",
  "social_security_number": "123-45-6789",
  "phone_number": "+15551234567",
  "email_address": "john@example.com",
  "street_address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip_code": "62701",
  "employment_status": "Employed full-time",
  "employer_name": "Acme Corp",
  "annual_salary": 75000,
  "certify_accurate": true,
  "agree_terms": true
}
```

Fields hidden by conditional logic are excluded from the output.

## Internationalization (i18n)

WMD supports full internationalization of both UI chrome (buttons, validation messages) and content (step titles, field labels, descriptions, option text, placeholders).

### Locale Precedence

When multiple sources provide translations, the highest-priority source wins:

```
JS options.locale > frontmatter locale.* > locale_url JSON file > built-in English
```

### Translatable Strings

**UI Chrome** (buttons, messages):

| Key | Default | Context |
|-----|---------|---------|
| `back` | Back | Back button |
| `next` | Next | Next button |
| `submit` | Submit | Submit button (last step) |
| `submitting` | Submitting... | Button during submission |
| `submitError` | Submission failed: {error} | Error banner |
| `selectPlaceholder` | Select {label}... | Dropdown default option |
| `defaultSuccess` | Form submitted successfully! | Success screen |
| `codeCopy` | Copy | Code block copy button |
| `codeCopied` | Copied! | Code block copy confirmation |

**Validation Messages:**

| Key | Default | Interpolation |
|-----|---------|---------------|
| `required` | {label} is required | `{label}` |
| `invalidEmail` | {label} must be a valid email | `{label}` |
| `invalidPhone` | {label} must be a valid phone number | `{label}` |
| `invalidSSN` | {label} must be a valid SSN (XXX-XX-XXXX) | `{label}` |
| `invalidNumber` | {label} must be a number | `{label}` |
| `minValue` | {label} must be at least {min} | `{label}`, `{min}` |
| `maxValue` | {label} must be at most {max} | `{label}`, `{max}` |
| `minLength` | {label} must be at least {min} characters | `{label}`, `{min}` |
| `maxLength` | {label} must be at most {max} characters | `{label}`, `{max}` |
| `invalidFormat` | {label} format is invalid | `{label}` |

**Content** (keyed by original English text or field name):

| Key | Maps | Example |
|-----|------|---------|
| `title` | Wizard title | `"Solicitud de Préstamo"` |
| `steps.{original title}` | Step headings | `steps["Personal Info"] = "Datos Personales"` |
| `descriptions.{original text}` | Step descriptions | `descriptions["Provide your name..."] = "..."` |
| `fields.{field_name}` | Field labels | `fields.first_name = "Nombre"` |
| `placeholders.{field_name}` | Placeholder text | `placeholders.first_name = "Juan"` |
| `sections.{original title}` | `##` section headings | `sections["Income"] = "Ingresos"` |
| `options.{field_name}.{original label}` | Select/radio/checkbox options | `options.state["California"] = "California"` |

### Method 1: JS Options (Runtime)

Pass a `locale` object when rendering — highest priority:

```js
WMD.render('#wizard', {
  src: 'form.wmd',
  locale: {
    back: 'Zurück',
    next: 'Weiter',
    submit: 'Absenden',
    required: '{label} ist erforderlich',
    steps: {
      'Personal Information': 'Persönliche Daten',
    },
    fields: {
      first_name: 'Vorname',
      last_name: 'Nachname',
    },
    options: {
      employment_status: {
        'Employed full-time': 'Vollzeit beschäftigt',
      },
    },
  }
});
```

### Method 2: Frontmatter (Self-Contained)

Define translations inline in the `.wmd` file using dotted keys:

```
---
title: Loan Application
submit_url: https://api.example.com/apply
locale.back: Zurück
locale.next: Weiter
locale.submit: Absenden
locale.required: {label} ist erforderlich
locale.steps.Personal Information: Persönliche Daten
locale.fields.first_name: Vorname
locale.fields.last_name: Nachname
locale.options.employment_status.Employed full-time: Vollzeit beschäftigt
---
```

### Method 3: External JSON File (Scalable)

Reference a locale file URL — either in frontmatter or JS options:

```
---
title: Loan Application
submit_url: https://api.example.com/apply
locale_url: /locales/de.json
---
```

Or at render time:

```js
WMD.render('#wizard', {
  src: 'form.wmd',
  locale_url: '/locales/de.json',
});
```

The JSON file uses the same shape as the JS `locale` object:

```json
{
  "back": "Zurück",
  "next": "Weiter",
  "submit": "Absenden",
  "required": "{label} ist erforderlich",
  "steps": {
    "Personal Information": "Persönliche Daten"
  },
  "fields": {
    "first_name": "Vorname"
  },
  "options": {
    "employment_status": {
      "Employed full-time": "Vollzeit beschäftigt"
    }
  }
}
```

### Auto-init with Locale

When using declarative auto-init, set `data-wmd-locale` for the locale URL:

```html
<div data-wmd-src="form.wmd" data-wmd-locale="/locales/es.json"></div>
```

### Partial Translations

All locale keys are optional. Only provide what you need to translate — everything else falls back to English defaults. Content keys (steps, fields, options) fall back to the original text from the `.wmd` file.
