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
      const match = lines[i].match(/^(\w+)\s*:\s*(.+)$/);
      if (match) {
        ast.config[match[1].trim()] = match[2].trim();
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

    // Divider
    if (trimmed === '---' && currentStep) {
      commitPendingField();
      const target = currentCondition || currentStep;
      target.fields.push({ type: '_divider' });
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
