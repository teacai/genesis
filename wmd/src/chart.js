/**
 * WMD Chart Renderer — Generates SVG line and bar charts from chart AST nodes.
 * No external dependencies.
 *
 * Supports two modes:
 *   x=range + y[]=formula(x)  — standard (independent variable on x-axis)
 *   y=range + x[]=formula(y)  — swapped  (independent variable on y-axis)
 *
 * Range types:
 *   range(start, end, step)                — numeric
 *   range(date1, date2, 'days'|'months'|'years') — date
 */

import { evaluateFormula } from './formula.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Render a chart AST node into an SVG element.
 */
export function renderChart(node, fieldValues = {}) {
  const rangeAxis = node.rangeAxis || 'x';
  const rangeDef = rangeAxis === 'x' ? node.x : node.y;

  // Generate range points: { values: number[], labels: string[] }
  const range = generateRange(rangeDef, fieldValues);
  if (!range.values.length) return svgEl('svg', {});

  const { values: rangeValues, labels: rangeLabels } = range;

  // Evaluate each series formula — variable name matches the range axis
  const varName = rangeAxis;
  const seriesData = node.series.map((s, idx) => ({
    label: s.label,
    color: COLORS[idx % COLORS.length],
    values: rangeValues.map(v => evaluateFormula(s.formula, { ...fieldValues, [varName]: v })),
  }));

  // Determine axis bounds
  const computedVals = seriesData.flatMap(s => s.values);

  let xMin, xMax, yMin, yMax;
  if (rangeAxis === 'x') {
    xMin = rangeValues[0];
    xMax = rangeValues[rangeValues.length - 1];
    yMin = Math.min(...computedVals);
    yMax = Math.max(...computedVals);
  } else {
    yMin = rangeValues[0];
    yMax = rangeValues[rangeValues.length - 1];
    xMin = Math.min(...computedVals);
    xMax = Math.max(...computedVals);
  }

  if (node.xstart === '0' || node.xstart === 0) xMin = Math.min(0, xMin);
  if (node.ystart === '0' || node.ystart === 0) yMin = Math.min(0, yMin);

  // Pad computed axis so lines don't touch edges
  if (rangeAxis === 'x') {
    const yRange = yMax - yMin || 1;
    yMax += yRange * 0.06;
    if (node.ystart === 'min') yMin -= yRange * 0.06;
  } else {
    const xRange = xMax - xMin || 1;
    xMax += xRange * 0.06;
    if (node.xstart === 'min') xMin -= xRange * 0.06;
  }

  // Layout
  const W = 600, H = 400;
  const hasLegend = seriesData.some(s => s.label);
  const PAD = { top: node.title ? 50 : 25, right: 25, bottom: hasLegend ? 70 : 50, left: 60 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const isBar = node.chartType === 'bar';

  // Scale helpers
  const sxContinuous = (val) => PAD.left + ((val - xMin) / (xMax - xMin || 1)) * cw;
  const syContinuous = (val) => PAD.top + ch - ((val - yMin) / (yMax - yMin || 1)) * ch;
  const sxBar = (_val, idx) => PAD.left + (idx + 0.5) * (cw / rangeValues.length);
  const syBar = (_val, idx) => PAD.top + ch - (idx + 0.5) * (ch / rangeValues.length);

  // Build SVG
  const root = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wmd-chart-svg' });

  if (node.title) {
    root.appendChild(svgText(W / 2, 26, node.title, 'wmd-chart-title', 'middle'));
  }

  // Y-axis grid + labels
  if (rangeAxis === 'y' && isBar) {
    const step = Math.max(1, Math.ceil(rangeValues.length / 12));
    for (let idx = 0; idx < rangeValues.length; idx += step) {
      const y = syBar(rangeValues[idx], idx);
      root.appendChild(svgEl('line', { x1: PAD.left, y1: y, x2: W - PAD.right, y2: y, class: 'wmd-chart-grid' }));
      root.appendChild(svgText(PAD.left - 10, y + 4, rangeLabels[idx], 'wmd-chart-axis-label', 'end'));
    }
  } else if (rangeAxis === 'y') {
    const ticks = pickRangeTicks(rangeValues, rangeLabels, 12);
    for (const { value, label } of ticks) {
      const y = syContinuous(value);
      root.appendChild(svgEl('line', { x1: PAD.left, y1: y, x2: W - PAD.right, y2: y, class: 'wmd-chart-grid' }));
      root.appendChild(svgText(PAD.left - 10, y + 4, label, 'wmd-chart-axis-label', 'end'));
    }
  } else {
    const yTicks = niceScale(yMin, yMax, 6);
    for (const tick of yTicks) {
      const y = syContinuous(tick);
      root.appendChild(svgEl('line', { x1: PAD.left, y1: y, x2: W - PAD.right, y2: y, class: 'wmd-chart-grid' }));
      root.appendChild(svgText(PAD.left - 10, y + 4, formatTick(tick), 'wmd-chart-axis-label', 'end'));
    }
  }

  // X-axis ticks + labels
  if (rangeAxis === 'x' && isBar) {
    const step = Math.max(1, Math.ceil(rangeValues.length / 20));
    for (let idx = 0; idx < rangeValues.length; idx += step) {
      const x = sxBar(rangeValues[idx], idx);
      root.appendChild(svgEl('line', { x1: x, y1: PAD.top + ch, x2: x, y2: PAD.top + ch + 5, class: 'wmd-chart-tick' }));
      root.appendChild(svgText(x, PAD.top + ch + 20, rangeLabels[idx], 'wmd-chart-axis-label', 'middle'));
    }
  } else if (rangeAxis === 'x') {
    const ticks = pickRangeTicks(rangeValues, rangeLabels, 12);
    for (const { value, label } of ticks) {
      const x = sxContinuous(value);
      root.appendChild(svgEl('line', { x1: x, y1: PAD.top + ch, x2: x, y2: PAD.top + ch + 5, class: 'wmd-chart-tick' }));
      root.appendChild(svgText(x, PAD.top + ch + 20, label, 'wmd-chart-axis-label', 'middle'));
    }
  } else {
    const xTicks = niceScale(xMin, xMax, 8);
    const maxLabels = 12;
    const tickStep = Math.max(1, Math.ceil(xTicks.length / maxLabels));
    for (let ti = 0; ti < xTicks.length; ti += tickStep) {
      const tick = xTicks[ti];
      const x = sxContinuous(tick);
      root.appendChild(svgEl('line', { x1: x, y1: PAD.top + ch, x2: x, y2: PAD.top + ch + 5, class: 'wmd-chart-tick' }));
      root.appendChild(svgText(x, PAD.top + ch + 20, formatTick(tick), 'wmd-chart-axis-label', 'middle'));
    }
  }

  // Axes
  root.appendChild(svgEl('line', { x1: PAD.left, y1: PAD.top, x2: PAD.left, y2: PAD.top + ch, class: 'wmd-chart-axis' }));
  root.appendChild(svgEl('line', { x1: PAD.left, y1: PAD.top + ch, x2: W - PAD.right, y2: PAD.top + ch, class: 'wmd-chart-axis' }));

  // Zero lines
  if (yMin < 0 && yMax > 0) {
    root.appendChild(svgEl('line', { x1: PAD.left, y1: syContinuous(0), x2: W - PAD.right, y2: syContinuous(0), class: 'wmd-chart-zero' }));
  }
  if (xMin < 0 && xMax > 0) {
    root.appendChild(svgEl('line', { x1: sxContinuous(0), y1: PAD.top, x2: sxContinuous(0), y2: PAD.top + ch, class: 'wmd-chart-zero' }));
  }

  // Draw data
  if (isBar) {
    if (rangeAxis === 'x') drawBarsX(root, rangeValues, seriesData, sxBar, syContinuous, PAD, cw, ch);
    else drawBarsY(root, rangeValues, seriesData, sxContinuous, syBar, PAD, cw, ch);
  } else {
    drawLines(root, rangeValues, seriesData, rangeAxis, sxContinuous, syContinuous);
  }

  if (hasLegend) drawLegend(root, seriesData, W, H);

  return root;
}

// ── Range generation ────────────────────────────────────────────────

/**
 * Generate range values and labels from a range definition.
 * Returns { values: number[], labels: string[] }.
 * For numeric ranges, values are the actual numbers.
 * For date ranges, values are 0-based indexes (period offsets from start).
 */
function generateRange(def, fieldValues) {
  if (!def) return { values: [], labels: [] };

  if (def.type === 'date') {
    return generateDateRange(def, fieldValues);
  }

  if (def.type === 'array') {
    const values = def.values;
    return { values, labels: values.map(formatTick) };
  }

  // Numeric range
  const values = [];
  for (let v = def.start; v <= def.end + def.step * 0.001; v += def.step) {
    values.push(Number(v.toFixed(10)));
  }
  return { values, labels: values.map(formatTick) };
}

function generateDateRange(def, fieldValues) {
  const startStr = resolveDate(def.start, fieldValues);
  const endStr = resolveDate(def.end, fieldValues);
  if (!startStr || !endStr) return { values: [], labels: [] };

  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end || start > end) return { values: [], labels: [] };

  const values = [];
  const labels = [];
  const current = new Date(start);
  let index = 0;

  // Safety cap to prevent infinite loops
  const maxPoints = 5000;

  while (current <= end && index < maxPoints) {
    values.push(index);
    labels.push(formatDateLabel(current, def.step));

    if (def.step === 'days') current.setDate(current.getDate() + 1);
    else if (def.step === 'months') current.setMonth(current.getMonth() + 1);
    else if (def.step === 'years') current.setFullYear(current.getFullYear() + 1);
    index++;
  }

  return { values, labels };
}

/** Resolve a date argument: could be literal date string or a field name. */
function resolveDate(value, fieldValues) {
  const stripped = value.replace(/^['"]|['"]$/g, '');
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(stripped)) return stripped;
  const fieldVal = fieldValues[stripped];
  if (fieldVal && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(fieldVal))) return String(fieldVal);
  return null;
}

/** Parse a date string (YYYY, YYYY-MM, or YYYY-MM-DD) into a Date object. */
function parseDate(str) {
  const parts = str.split('-').map(Number);
  if (parts.length === 1) return new Date(parts[0], 0, 1);
  if (parts.length === 2) return new Date(parts[0], parts[1] - 1, 1);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/** Format a date for axis labels based on the step granularity. */
function formatDateLabel(date, step) {
  if (step === 'years') return String(date.getFullYear());
  if (step === 'months') return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  // days
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// ── Drawing helpers ─────────────────────────────────────────────────

function drawLines(root, rangeValues, seriesData, rangeAxis, sx, sy) {
  for (const s of seriesData) {
    const points = rangeValues.map((rv, i) => {
      const px = rangeAxis === 'x' ? sx(rv) : sx(s.values[i]);
      const py = rangeAxis === 'x' ? sy(s.values[i]) : sy(rv);
      return `${px.toFixed(2)},${py.toFixed(2)}`;
    }).join(' ');
    root.appendChild(svgEl('polyline', {
      points,
      fill: 'none',
      stroke: s.color,
      'stroke-width': 2.5,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }));
  }
}

function drawBarsX(root, rangeValues, seriesData, sx, sy, PAD, cw, ch) {
  const n = rangeValues.length;
  const numSeries = seriesData.length;
  const groupWidth = (cw / n) * 0.7;
  const barWidth = groupWidth / numSeries;
  const baselineY = PAD.top + ch;

  for (let sIdx = 0; sIdx < numSeries; sIdx++) {
    const s = seriesData[sIdx];
    for (let i = 0; i < n; i++) {
      const cx = sx(rangeValues[i], i);
      const barX = cx - groupWidth / 2 + sIdx * barWidth;
      const barY = sy(s.values[i]);
      const barH = baselineY - barY;
      if (barH > 0) {
        root.appendChild(svgEl('rect', {
          x: barX, y: barY,
          width: Math.max(barWidth - 1, 1), height: barH,
          fill: s.color, rx: 2,
        }));
      }
    }
  }
}

function drawBarsY(root, rangeValues, seriesData, sx, sy, PAD, cw, ch) {
  const n = rangeValues.length;
  const numSeries = seriesData.length;
  const groupHeight = (ch / n) * 0.7;
  const barHeight = groupHeight / numSeries;
  const baselineX = PAD.left;

  for (let sIdx = 0; sIdx < numSeries; sIdx++) {
    const s = seriesData[sIdx];
    for (let i = 0; i < n; i++) {
      const cy = sy(rangeValues[i], i);
      const barY = cy - groupHeight / 2 + sIdx * barHeight;
      const barX = sx(s.values[i]);
      const barW = barX - baselineX;
      if (barW > 0) {
        root.appendChild(svgEl('rect', {
          x: baselineX, y: barY,
          width: barW, height: Math.max(barHeight - 1, 1),
          fill: s.color, rx: 2,
        }));
      }
    }
  }
}

function drawLegend(root, seriesData, W, H) {
  const items = seriesData.map(s => ({ label: s.label, color: s.color, width: 18 + s.label.length * 7 }));
  const gap = 22;
  const totalWidth = items.reduce((sum, it) => sum + it.width, 0) + (items.length - 1) * gap;
  let x = (W - totalWidth) / 2;
  const y = H - 18;

  for (const item of items) {
    root.appendChild(svgEl('rect', { x, y: y - 9, width: 12, height: 12, rx: 2, fill: item.color }));
    root.appendChild(svgText(x + 18, y + 2, item.label, 'wmd-chart-legend-label'));
    x += item.width + gap;
  }
}

// ── Axis tick helpers ───────────────────────────────────────────────

/** Generate nice axis tick values from a computed data range. */
function niceScale(min, max, targetTicks) {
  const range = max - min || 1;
  const rawStep = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = norm <= 1.5 ? mag : norm <= 3.5 ? 2 * mag : norm <= 7.5 ? 5 * mag : 10 * mag;

  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + step * 0.001; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

/** Pick evenly-spaced ticks from range values with their labels. */
function pickRangeTicks(values, labels, maxTicks) {
  if (values.length <= maxTicks) {
    return values.map((v, i) => ({ value: v, label: labels[i] }));
  }
  const step = Math.max(1, Math.ceil(values.length / maxTicks));
  const ticks = [];
  for (let i = 0; i < values.length; i += step) {
    ticks.push({ value: values[i], label: labels[i] });
  }
  return ticks;
}

function formatTick(val) {
  if (Number.isInteger(val)) return String(val);
  const s = val.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return s || '0';
}

// ── SVG helpers ─────────────────────────────────────────────────────

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function svgText(x, y, content, className, anchor) {
  const el = svgEl('text', { x, y, class: className });
  if (anchor) el.setAttribute('text-anchor', anchor);
  el.textContent = content;
  return el;
}
