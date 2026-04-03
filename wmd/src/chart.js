/**
 * WMD Chart Renderer — Generates SVG line and bar charts from chart AST nodes.
 * No external dependencies.
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
  // Generate x data points from range
  const xValues = [];
  if (node.x) {
    for (let v = node.x.start; v <= node.x.end + node.x.step * 0.001; v += node.x.step) {
      xValues.push(Number(v.toFixed(10)));
    }
  }
  if (!xValues.length) return svg('svg', {});

  // Evaluate each series formula for every x value
  const seriesData = node.series.map((s, idx) => ({
    label: s.label,
    color: COLORS[idx % COLORS.length],
    values: xValues.map(x => evaluateFormula(s.formula, { ...fieldValues, x })),
  }));

  // Determine axis bounds
  const allY = seriesData.flatMap(s => s.values);
  let yMin = Math.min(...allY);
  let yMax = Math.max(...allY);
  let xMin = xValues[0];
  let xMax = xValues[xValues.length - 1];

  if (node.ystart === '0' || node.ystart === 0) yMin = Math.min(0, yMin);
  if (node.xstart === '0' || node.xstart === 0) xMin = Math.min(0, xMin);

  // Pad y range slightly so lines don't touch edges
  const yRange = yMax - yMin || 1;
  yMax += yRange * 0.06;
  if (node.ystart === 'min') yMin -= yRange * 0.06;

  // Layout
  const W = 600, H = 400;
  const hasLegend = seriesData.length > 0 && seriesData.some(s => s.label);
  const PAD = { top: node.title ? 50 : 25, right: 25, bottom: hasLegend ? 70 : 50, left: 60 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  // Scale helpers
  const isBar = node.chartType === 'bar';
  const sx = isBar
    ? (_val, idx) => PAD.left + (idx + 0.5) * (cw / xValues.length)
    : (val) => PAD.left + ((val - xMin) / (xMax - xMin || 1)) * cw;
  const sy = (val) => PAD.top + ch - ((val - yMin) / (yMax - yMin || 1)) * ch;

  // Build SVG
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wmd-chart-svg' });

  // Title
  if (node.title) {
    root.appendChild(svgText(W / 2, 26, node.title, 'wmd-chart-title', 'middle'));
  }

  // Y-axis grid lines + labels
  const yTicks = niceScale(yMin, yMax, 6);
  for (const tick of yTicks) {
    const y = sy(tick);
    root.appendChild(svg('line', { x1: PAD.left, y1: y, x2: W - PAD.right, y2: y, class: 'wmd-chart-grid' }));
    root.appendChild(svgText(PAD.left - 10, y + 4, formatTick(tick), 'wmd-chart-axis-label', 'end'));
  }

  // X-axis ticks + labels
  const maxXLabels = isBar ? 20 : 12;
  const xStep = Math.max(1, Math.ceil(xValues.length / maxXLabels));
  for (let idx = 0; idx < xValues.length; idx += xStep) {
    const x = sx(xValues[idx], idx);
    root.appendChild(svg('line', { x1: x, y1: PAD.top + ch, x2: x, y2: PAD.top + ch + 5, class: 'wmd-chart-tick' }));
    root.appendChild(svgText(x, PAD.top + ch + 20, formatTick(xValues[idx]), 'wmd-chart-axis-label', 'middle'));
  }

  // Axes
  root.appendChild(svg('line', { x1: PAD.left, y1: PAD.top, x2: PAD.left, y2: PAD.top + ch, class: 'wmd-chart-axis' }));
  root.appendChild(svg('line', { x1: PAD.left, y1: PAD.top + ch, x2: W - PAD.right, y2: PAD.top + ch, class: 'wmd-chart-axis' }));

  // Zero line if it's within the range
  if (yMin < 0 && yMax > 0) {
    root.appendChild(svg('line', {
      x1: PAD.left, y1: sy(0), x2: W - PAD.right, y2: sy(0),
      class: 'wmd-chart-zero',
    }));
  }

  // Draw data
  if (isBar) {
    drawBars(root, xValues, seriesData, sx, sy, PAD, cw, ch);
  } else {
    drawLines(root, xValues, seriesData, sx, sy);
  }

  // Legend
  if (hasLegend) {
    drawLegend(root, seriesData, W, H);
  }

  return root;
}

function drawLines(root, xValues, seriesData, sx, sy) {
  for (const s of seriesData) {
    const points = xValues.map((x, i) => `${sx(x, i).toFixed(2)},${sy(s.values[i]).toFixed(2)}`).join(' ');
    root.appendChild(svg('polyline', {
      points,
      fill: 'none',
      stroke: s.color,
      'stroke-width': 2.5,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }));
  }
}

function drawBars(root, xValues, seriesData, sx, sy, PAD, cw, ch) {
  const n = xValues.length;
  const numSeries = seriesData.length;
  const groupWidth = (cw / n) * 0.7;
  const barWidth = groupWidth / numSeries;
  const baselineY = PAD.top + ch;

  for (let sIdx = 0; sIdx < numSeries; sIdx++) {
    const s = seriesData[sIdx];
    for (let i = 0; i < n; i++) {
      const cx = sx(xValues[i], i);
      const barX = cx - groupWidth / 2 + sIdx * barWidth;
      const barY = sy(s.values[i]);
      const barH = baselineY - barY;
      if (barH > 0) {
        root.appendChild(svg('rect', {
          x: barX, y: barY,
          width: Math.max(barWidth - 1, 1), height: barH,
          fill: s.color, rx: 2,
        }));
      }
    }
  }
}

function drawLegend(root, seriesData, W, H) {
  // Measure total width to center the legend
  const items = seriesData.map(s => ({ label: s.label, color: s.color, width: 18 + s.label.length * 7 }));
  const gap = 22;
  const totalWidth = items.reduce((sum, it) => sum + it.width, 0) + (items.length - 1) * gap;
  let x = (W - totalWidth) / 2;
  const y = H - 18;

  for (const item of items) {
    root.appendChild(svg('rect', { x, y: y - 9, width: 12, height: 12, rx: 2, fill: item.color }));
    root.appendChild(svgText(x + 18, y + 2, item.label, 'wmd-chart-legend-label'));
    x += item.width + gap;
  }
}

/** Generate nice axis tick values. */
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

function formatTick(val) {
  if (Number.isInteger(val)) return String(val);
  const s = val.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return s || '0';
}

// SVG element helpers
function svg(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function svgText(x, y, content, className, anchor) {
  const el = svg('text', { x, y, class: className });
  if (anchor) el.setAttribute('text-anchor', anchor);
  el.textContent = content;
  return el;
}
