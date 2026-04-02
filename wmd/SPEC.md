# WMD — Wizard Markdown

A markdown-based markup language for defining multi-step wizard forms.

## Overview

WMD files (`.wmd`) define wizard forms using a readable, markdown-inspired syntax. A JavaScript library parses WMD and renders an interactive step-by-step wizard that submits answers as JSON.

## File Structure

```
---
frontmatter (YAML-like config)
---

{Step heading}

< Description text

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

Each step is defined by wrapping the step title in curly braces `{}`. The text inside becomes the step label.

```
{Personal Information}
```

## Descriptions

Lines starting with `<` add description text to the current step. Multiple `<` lines are joined into a single paragraph displayed below the step heading.

```
< Please provide your legal name as it appears on your ID.
< All fields marked with * are required.
```

Description text supports inline formatting: **bold**, *italic*, `code`, and [links](url).

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
| `formula`   | Readonly computed   | Value calculated from other fields       |

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
| `format`      | formula          | Display format: `currency` ($) or `percent` (%) |
| `decimals`    | formula          | Decimal places (default: 2)              |

### Hidden Fields

Set hidden field values with `=`:

```
[hidden: source] = website
```

### Formula Fields

Formula fields display a readonly computed value derived from other fields. The value updates automatically when referenced fields change. Use `=` to separate the label from the formula expression:

```
[formula: monthly_payment] Monthly Payment = loan_amount / loan_term
```

With formatting attributes:

```
[formula(format="currency", decimals=2): monthly_cost] Monthly Cost = annual_cost / 12
[formula(format="percent", decimals=1): tax_rate] Effective Tax Rate = taxes / income * 100
```

#### Expression Syntax

| Element | Example | Description |
|---------|---------|-------------|
| Field reference | `loan_amount` | Resolves to the field's current numeric value (0 if empty) |
| Number literal | `12`, `3.14` | Numeric constants |
| Arithmetic | `a + b`, `a - b`, `a * b`, `a / b`, `a % b` | Standard math operators |
| Parentheses | `(a + b) * c` | Grouping for operator precedence |
| Unary minus | `-amount` | Negation |

#### Built-in Functions

| Function | Description | Example |
|----------|-------------|---------|
| `round(x, n)` | Round to `n` decimal places | `round(price * 1.08, 2)` |
| `floor(x)` | Round down | `floor(quantity)` |
| `ceil(x)` | Round up | `ceil(hours)` |
| `abs(x)` | Absolute value | `abs(balance)` |
| `min(a, b, ...)` | Minimum value | `min(income, cap)` |
| `max(a, b, ...)` | Maximum value | `max(total, 0)` |
| `pow(x, n)` | Exponentiation | `pow(1 + rate, years)` |

#### Behavior

- Formula fields are **readonly** — users cannot edit them
- Values are **recomputed on every render** (when any field changes)
- Fields from **any step** can be referenced (including previous steps)
- Non-numeric or empty field references resolve to `0`
- Division by zero returns `0`
- Formula values are included in the submitted JSON as numbers
- Formula fields are **never required** and skip validation

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

## Toggle Sections

Use `?toggle` / `?endtoggle` to create collapsible sections. A clickable label with a horizontal arrow indicator lets users expand or collapse the content:

```
?toggle Additional Details (Optional)
[text: referral_code] Referral Code
[textarea: notes] Additional Notes
?endtoggle
```

To make a toggle open by default, add `(open)`:

```
?toggle(open) Required Documents
- Government-issued photo ID
- Proof of income (pay stub or tax return)
- Proof of address (utility bill or bank statement)
?endtoggle
```

Toggle sections can contain any content: fields, text, lists, code blocks, and even nested conditionals. If validation fails on a field inside a collapsed toggle, the toggle auto-opens to reveal the error.

Toggle labels support i18n via `locale.toggles`:

```json
{
  "toggles": {
    "Additional Details (Optional)": "Detalles Adicionales (Opcional)"
  }
}
```

## Headings Within Steps

Standard markdown headings `#` through `######` render as display headings within a step. They do **not** create wizard steps:

```
{Financial Information}

# Main Section Title
[currency: annual_income] Annual Income *

## Subsection
[currency: savings] Total Savings *

### Minor Heading
Some explanatory text here.

#### Small Heading
Additional details.

##### Fine Print
###### Legal Disclaimer
```

| Syntax | Rendered As | Use Case |
|--------|------------|----------|
| `#` | Large heading (h2) | Major section titles within a step |
| `##` | Medium heading (h3) | Subsections |
| `###` | Small heading (h4) | Minor groupings |
| `####` | Small heading (h5) | Fine-grained labels |
| `#####` | Smaller heading (h6) | Sub-labels |
| `######` | Smallest heading (h6) | Captions, disclaimers |
| `{Title}` | **Wizard step** | Defines a new wizard step |

Heading text supports inline formatting: **bold**, *italic*, `code`, and [links](url).

## Inline Formatting

Standard markdown inline formatting is supported in descriptions (`<`), blockquotes (`>`), text blocks, list items, and field labels (including checkbox labels):

| Syntax | Renders As |
|--------|------------|
| `**bold**` or `__bold__` | **bold** |
| `*italic*` or `_italic_` | *italic* |
| `***bold italic***` or `___bold italic___` | ***bold italic*** |
| `` `inline code` `` | `inline code` |
| `[link text](url)` | clickable link (opens in new tab) |
| `![alt text](url)` | inline image |

### Links

Markdown links use the standard `[text](url)` syntax. All links open in a new browser tab/window with `target="_blank"` and `rel="noopener noreferrer"`.

Links work everywhere inline formatting is supported:

```
< Please read our [Privacy Policy](https://example.com/privacy) before continuing.

- You can review the [full terms](https://example.com/terms) at any time

[checkbox: agree_terms] I agree to the [Terms of Service](https://example.com/terms) *
```

When links appear inside field labels (especially checkbox labels), clicking the link opens the URL without toggling the checkbox or focusing the input.

Link text supports nested formatting: `[**bold link**](url)` renders a bold link.

Example:
```
< Please provide your **legal name** as it appears on your *government-issued ID*.
```

### Images

Markdown images use the standard `![alt text](url)` syntax. Images can be used in two ways:

**Block images** — a standalone line with just the image renders as a full-width figure with an optional caption (from the alt text):

```
![Application process flowchart](https://example.com/flowchart.png)
```

Block images render as a `<figure>` with:
- Responsive sizing (`max-width: 100%`)
- Rounded border
- Caption below the image (from the alt text)

**Inline images** — images within text, lists, or other content render inline at line height:

```
Click the ![save icon](icons/save.png) button to continue.
```

Images are display-only — they do not produce form values in the JSON output.

## Blockquotes

Lines starting with `>` render as styled blockquotes — callout boxes with a blue left border. Unlike descriptions (`<`), blockquotes are display elements that can appear anywhere within a step, between fields.

```
> **Important:** Your application will be reviewed within 2 business days.
> Please ensure all information is accurate before submitting.
```

Consecutive `>` lines are grouped into a single blockquote. Each line becomes a separate paragraph within the blockquote. Blockquote content supports all inline formatting (bold, italic, code, links).

Blockquotes are display-only — they do not produce form values in the JSON output.

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

## Tables

Standard markdown tables are supported. Tables require a header row, a separator row (with optional alignment), and one or more data rows:

```
| Plan     | Price   | Features          |
|----------|:-------:|------------------:|
| Basic    | $9/mo   | 10 projects       |
| Pro      | $29/mo  | Unlimited         |
| Business | $99/mo  | Unlimited + SSO   |
```

**Alignment** is controlled by colons in the separator row:
- `|------|` or `|:-----|` — left-aligned (default)
- `|:----:|` — center-aligned
- `|-----:|` — right-aligned

Cell content supports inline formatting: **bold**, *italic*, `code`, and [links](url).

Tables are display-only — they do not produce form values in the JSON output. The table wrapper scrolls horizontally on narrow screens.

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

{Personal Information}

< Please provide your legal information exactly as it appears on your government-issued ID.

[text(placeholder="John"): first_name] First Name *
[text(placeholder="Doe"): last_name] Last Name *
[date: date_of_birth] Date of Birth *
[ssn: social_security_number] Social Security Number *
[phone: phone_number] Phone Number *
[email: email_address] Email Address *

{Address}

< Your current residential address.

[text: street_address] Street Address *
[text: apt_number] Apt / Suite / Unit
[text: city] City *
[select: state] State *
- Alabama | AL
- Alaska | AK
- Arizona | AZ
[text(pattern="\\d{5}"): zip_code] ZIP Code *

{Employment & Income}

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

{Loan Request}

[currency: loan_amount] Loan Amount *
[number: loan_term_months] Loan Term (months) *
[formula(format="currency"): est_monthly_payment] Estimated Monthly Payment = round(loan_amount / loan_term_months, 2)

{Review & Submit}

< Please review your information before submitting.

> **Note:** By submitting, you agree to a soft credit check.

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
  "loan_amount": 25000,
  "loan_term_months": 36,
  "est_monthly_payment": 694.44,
  "certify_accurate": true,
  "agree_terms": true
}
```

Fields hidden by conditional logic are excluded from the output. Formula fields are included with their computed numeric value.

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
| `headings.{original title}` | `#`-`####` display headings | `headings["Income"] = "Ingresos"` |
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
