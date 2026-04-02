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
