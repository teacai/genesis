/**
 * WMD Chart Renderer — Generates SVG line and bar charts from chart AST nodes.
 * No external dependencies.
 *
 * Supports two modes:
 *   x=range + y[]=formula(x)  — standard (independent variable on x-axis)
 *   y=range + x[]=formula(y)  — swapped  (independent variable on y-axis)
 */

import { evaluateFormula } from './formula.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * Render a chart AST node into an SVG element.
 * @param {object} node - Chart AST node (_chart type)
 * @param {object} fieldValues - Current wizard field values (for formula references)
 * @returns {SVGSVGElement}
 */
export function renderChart(node, fieldValues = {}) {
  const rangeAxis = node.rangeAxis || 'x';
  const rangeDef = rangeAxis === 'x' ? node.x : node.y;

  // Generate independent-variable values from range
  const rangeValues = [];
  if (rangeDef) {
    for (let v = rangeDef.start; v <= rangeDef.end + rangeDef.step * 0.001; v += rangeDef.step) {
      rangeValues.push(Number(v.toFixed(10)));
    }
  }
  if (!rangeValues.length) return svgEl('svg', {});

  // Evaluate each series formula — variable name matches the range axis
  const varName = rangeAxis; // 'x' or 'y'
  const seriesData = node.series.map((s, idx) => ({
    label: s.label,
    color: COLORS[idx % COLORS.length],
    values: rangeValues.map(v => evaluateFormula(s.formula, { ...fieldValues, [varName]: v })),
  }));

  // Determine axis bounds
  // rangeValues go on the range axis; formula results go on the other axis
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

  // Scale helpers (always map data value → pixel)
  const sxContinuous = (val) => PAD.left + ((val - xMin) / (xMax - xMin || 1)) * cw;
  const syContinuous = (val) => PAD.top + ch - ((val - yMin) / (yMax - yMin || 1)) * ch;

  // For bar charts, the range axis uses index-based positioning
  const sxBar = (_val, idx) => PAD.left + (idx + 0.5) * (cw / rangeValues.length);
  const syBar = (_val, idx) => PAD.top + ch - (idx + 0.5) * (ch / rangeValues.length);

  // Build SVG
  const root = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wmd-chart-svg' });

  if (node.title) {
    root.appendChild(svgText(W / 2, 26, node.title, 'wmd-chart-title', 'middle'));
  }

  // Y-axis grid + labels
  if (rangeAxis === 'y' && isBar) {
    // Range on y-axis with bars: use range values as labels
    const step = Math.max(1, Math.ceil(rangeValues.length / 12));
    for (let idx = 0; idx < rangeValues.length; idx += step) {
      const y = syBar(rangeValues[idx], idx);
      root.appendChild(svgEl('line', { x1: PAD.left, y1: y, x2: W - PAD.right, y2: y, class: 'wmd-chart-grid' }));
      root.appendChild(svgText(PAD.left - 10, y + 4, formatTick(rangeValues[idx]), 'wmd-chart-axis-label', 'end'));
    }
  } else {
    const yTicks = rangeAxis === 'y' ? niceScaleFromRange(rangeValues) : niceScale(yMin, yMax, 6);
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
      root.appendChild(svgText(x, PAD.top + ch + 20, formatTick(rangeValues[idx]), 'wmd-chart-axis-label', 'middle'));
    }
  } else {
    const xTicks = rangeAxis === 'x' ? niceScaleFromRange(rangeValues) : niceScale(xMin, xMax, 8);
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
    if (rangeAxis === 'x') {
      drawBarsX(root, rangeValues, seriesData, sxBar, syContinuous, PAD, cw, ch);
    } else {
      drawBarsY(root, rangeValues, seriesData, sxContinuous, syBar, PAD, cw, ch);
    }
  } else {
    drawLines(root, rangeValues, seriesData, rangeAxis, sxContinuous, syContinuous);
  }

  if (hasLegend) drawLegend(root, seriesData, W, H);

  return root;
}

/**
 * Draw line series.
 * rangeAxis='x': points are (rangeVal, formulaVal)
 * rangeAxis='y': points are (formulaVal, rangeVal)
 */
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

/** Vertical bars: range on x-axis, formula values on y-axis. */
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

/** Horizontal bars: range on y-axis, formula values on x-axis. */
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

/** Pick a subset of range values as ticks (for the range axis). */
function niceScaleFromRange(values) {
  const maxTicks = 12;
  if (values.length <= maxTicks) return values;
  const step = Math.max(1, Math.ceil(values.length / maxTicks));
  const ticks = [];
  for (let i = 0; i < values.length; i += step) ticks.push(values[i]);
  return ticks;
}

function formatTick(val) {
  if (Number.isInteger(val)) return String(val);
  const s = val.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return s || '0';
}

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
