/**
 * WMD Parser — Converts WMD markup into a structured AST.
 */

export function parse(source) {
  const lines = source.split('\n');
  const ast = {
    config: {},
    steps: [],
  };

  let i = 0;

  // Parse frontmatter
  if (lines[i] && lines[i].trim() === '---') {
    i++;
    while (i < lines.length && lines[i].trim() !== '---') {
      const match = lines[i].match(/^([\w.]+)\s*:\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        // Support dotted keys: locale.back, locale.fields.name, locale.options.field.value
        if (key.includes('.')) {
          const parts = key.split('.');
          let obj = ast.config;
          for (let p = 0; p < parts.length - 1; p++) {
            if (!obj[parts[p]] || typeof obj[parts[p]] !== 'object') {
              obj[parts[p]] = {};
            }
            obj = obj[parts[p]];
          }
          obj[parts[parts.length - 1]] = val;
        } else {
          ast.config[key] = val;
        }
      }
      i++;
    }
    i++; // skip closing ---
  }

  let currentStep = null;
  let currentCondition = null;
  let pendingField = null;

  function commitPendingField() {
    if (!pendingField) return;
    const target = currentCondition || currentStep;
    if (target) target.fields.push(pendingField);
    pendingField = null;
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Step heading
    if (/^# /.test(trimmed) && !/^## /.test(trimmed)) {
      commitPendingField();
      currentCondition = null;
      currentStep = {
        title: trimmed.replace(/^# /, ''),
        descriptions: [],
        fields: [],
      };
      ast.steps.push(currentStep);
      i++;
      continue;
    }

    // Section heading (visual grouping within step)
    if (/^## /.test(trimmed)) {
      commitPendingField();
      if (currentStep) {
        const target = currentCondition || currentStep;
        target.fields.push({
          type: '_section',
          label: trimmed.replace(/^## /, ''),
        });
      }
      i++;
      continue;
    }

    // Description
    if (/^> /.test(trimmed)) {
      if (currentStep) {
        currentStep.descriptions.push(trimmed.replace(/^> /, ''));
      }
      i++;
      continue;
    }

    // Fenced code block
    if (/^```/.test(trimmed) && currentStep) {
      commitPendingField();
      const lang = trimmed.slice(3).trim() || '';
      const codeLines = [];
      i++;
      while (i < lines.length && !(/^```\s*$/.test(lines[i].trim()))) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const target = currentCondition || currentStep;
      target.fields.push({
        type: '_code',
        lang,
        code: codeLines.join('\n'),
      });
      continue;
    }

    // Divider
    if (trimmed === '---' && currentStep) {
      commitPendingField();
      const target = currentCondition || currentStep;
      target.fields.push({ type: '_divider' });
      i++;
      continue;
    }

    // Toggle section start
    const toggleMatch = trimmed.match(/^\?toggle(?:\((\w+)\))?\s+(.+)$/);
    if (toggleMatch && currentStep) {
      commitPendingField();
      const toggle = {
        type: '_toggle',
        open: toggleMatch[1] === 'open',
        label: toggleMatch[2],
        fields: [],
      };
      const target = currentCondition || currentStep;
      target.fields.push(toggle);
      // Push toggle as a container context — nest inside current condition if any
      // We use a stack approach: save previous condition, set toggle as current
      toggle._prevCondition = currentCondition;
      currentCondition = toggle;
      i++;
      continue;
    }

    // Toggle section end
    if (/^\?endtoggle/.test(trimmed)) {
      commitPendingField();
      if (currentCondition && currentCondition.type === '_toggle') {
        const prev = currentCondition._prevCondition;
        delete currentCondition._prevCondition;
        currentCondition = prev;
      }
      i++;
      continue;
    }

    // Conditional start
    if (/^\?if\s+/.test(trimmed)) {
      commitPendingField();
      const condMatch = trimmed.match(/^\?if\s+(\w+)\s*(=|!=|>=?|<=?|contains)\s*"([^"]*)"$/);
      if (condMatch && currentStep) {
        currentCondition = {
          type: '_condition',
          field: condMatch[1],
          operator: condMatch[2],
          value: condMatch[3],
          fields: [],
        };
        currentStep.fields.push(currentCondition);
      }
      i++;
      continue;
    }

    // Conditional end
    if (/^\?endif/.test(trimmed)) {
      commitPendingField();
      currentCondition = null;
      i++;
      continue;
    }

    // Field definition
    const fieldMatch = trimmed.match(/^\[(\w+)(?:\(([^)]*)\))?\s*:\s*(\w+)\]\s*(.+)?$/);
    if (fieldMatch) {
      commitPendingField();
      const [, type, attrStr, name, rawLabel] = fieldMatch;
      const required = rawLabel && rawLabel.trim().endsWith('*');
      const label = rawLabel ? rawLabel.trim().replace(/\s*\*$/, '').trim() : name;
      const attrs = parseAttributes(attrStr || '');

      pendingField = { type, name, label, required: !!required, attrs, options: [] };
      i++;
      continue;
    }

    // Hidden field with value
    const hiddenMatch = trimmed.match(/^\[hidden\s*:\s*(\w+)\]\s*=\s*(.+)$/);
    if (hiddenMatch) {
      commitPendingField();
      const target = currentCondition || currentStep;
      if (target) {
        target.fields.push({
          type: 'hidden',
          name: hiddenMatch[1],
          value: hiddenMatch[2].trim(),
          label: '',
          required: false,
          attrs: {},
          options: [],
        });
      }
      i++;
      continue;
    }

    // Option line (for select, radio, checkboxes)
    if (/^- /.test(trimmed) && pendingField) {
      const optText = trimmed.replace(/^- /, '');
      const parts = optText.split('|').map(s => s.trim());
      pendingField.options.push({
        label: parts[0],
        value: parts.length > 1 ? parts[1] : parts[0],
      });
      i++;
      continue;
    }

    // Markdown text lines: unordered list, ordered list, or paragraph text
    if (trimmed && currentStep) {
      // Check if this is a list item or plain text
      const isUl = /^[-*+] /.test(trimmed);
      const olMatch = trimmed.match(/^(\d+)[.)]\s/);
      const isOl = !!olMatch;

      if (isUl || isOl || /[a-zA-Z0-9\\_*`]/.test(trimmed)) {
        commitPendingField();
        const textLines = [];

        // Accumulate consecutive text/list lines
        while (i < lines.length) {
          const t = lines[i].trim();
          if (!t) break; // blank line ends the block
          // Stop if we hit a structural element
          if (/^#{1,2} /.test(t)) break;
          if (/^> /.test(t)) break;
          if (/^```/.test(t)) break;
          if (t === '---') break;
          if (/^\?if\s+/.test(t) || /^\?endif/.test(t)) break;
          if (/^\?toggle/.test(t) || /^\?endtoggle/.test(t)) break;
          if (/^\[\w+[\s(].*:\s*\w+\]/.test(t) || /^\[hidden\s*:/.test(t)) break; // field definition (not markdown link)

          const lineIsUl = /^[-*+] /.test(t);
          const lineOlMatch = t.match(/^(\d+)[.)]\s/);
          const lineIsOl = !!lineOlMatch;

          if (lineIsUl) {
            textLines.push({ kind: 'ul', text: t.replace(/^[-*+] /, '') });
          } else if (lineIsOl) {
            textLines.push({ kind: 'ol', text: t.replace(/^\d+[.)]\s/, '') });
          } else {
            textLines.push({ kind: 'p', text: t });
          }
          i++;
        }

        if (textLines.length) {
          const target = currentCondition || currentStep;
          target.fields.push({ type: '_text', lines: textLines });
        }
        continue;
      }
    }

    // Empty line or unrecognized — skip
    i++;
  }

  commitPendingField();
  return ast;
}

function parseAttributes(str) {
  const attrs = {};
  if (!str) return attrs;

  const regex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4];
  }
  return attrs;
}
