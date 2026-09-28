// Pixel-art SVG animation engine. Everything is on a single global 60s timeline.
// Canvas is W x H "pixels" (SVG user units); final SVG is scaled up with crispEdges.
'use strict';

const T = 60;           // total loop length (seconds)
const W = 256, H = 144; // pixel canvas

// ---------- math helpers ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const inv = (a, b, v) => clamp((v - a) / (b - a)); // 0..1 progress of v in [a,b]
const ease = u => u * u * (3 - 2 * u);             // smoothstep
const easeOut = u => 1 - (1 - u) * (1 - u);
const easeIn = u => u * u;
const hop = (u, h) => -4 * h * u * (1 - u);         // parabola 0 -> -h -> 0
const r = Math.round;
const kt = t => +(clamp(t, 0, T) / T).toFixed(5);
// piecewise keyframes: key(t, [[t0,v0],[t1,v1],...], easeFn) -> interpolated number
function key(t, pts, fn = ease) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [ta, va] = pts[i - 1], [tb, vb] = pts[i];
      return lerp(va, vb, fn(inv(ta, tb, t)));
    }
  }
  return pts[pts.length - 1][1];
}
// pick discrete value: pick(t, [[t0,'a'],[t1,'b']]) -> last entry whose time <= t
function pick(t, pts) {
  let v = pts[0][1];
  for (const [tt, vv] of pts) if (t >= tt) v = vv;
  return v;
}
// deterministic RNG
function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- defs registry ----------
let DEFS = [];
const SIZES = {};   // sprite id -> [w,h]
let uid = 0;
const newId = (p = 'x') => `${p}${(uid++).toString(36)}`;
function def(markup) { DEFS.push(markup); }
function resetDefs() { DEFS = []; }
function getDefs() { return DEFS.join('\n'); }

// ---------- pixel rendering ----------
// rows: array of strings OR a multi-line string. map: char -> color. '.' and ' ' are transparent.
function parseArt(art) {
  if (Array.isArray(art)) return art;
  const lines = art.replace(/\r/g, '').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const ind = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(ind).replace(/\s+$/, ''));
}
function artPaths(rows, map, ox = 0, oy = 0) {
  rows = parseArt(rows);
  const by = {};
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x], col = map[ch];
      if (!col || ch === '.' || ch === ' ') { x++; continue; }
      let n = 1;
      while (x + n < row.length && row[x + n] === ch) n++;
      (by[col] = by[col] || []).push(`M${x + ox} ${y + oy}h${n}v1h-${n}z`);
      x += n;
    }
  });
  return Object.entries(by).map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
}
// register an ASCII sprite as <g id=...> in defs. returns id.
function sprite(id, art, map) {
  const rows = parseArt(art);
  SIZES[id] = [Math.max(...rows.map(r => r.length)), rows.length];
  def(`<g id="${id}">${artPaths(rows, map)}</g>`);
  return id;
}
// register raw markup (e.g. Canvas.toSVG()) as a sprite
function spriteRaw(id, markup, w, h) {
  SIZES[id] = [w, h];
  def(`<g id="${id}">${markup}</g>`);
  return id;
}
// place a sprite. flip mirrors horizontally inside its own box.
function use(id, x = 0, y = 0, flip = false, extra = '') {
  if (!flip) return `<use href="#${id}" x="${x}" y="${y}"${extra}/>`;
  const w = (SIZES[id] || [0])[0];
  return `<use href="#${id}" transform="translate(${x + w} ${y}) scale(-1 1)"${extra}/>`;
}
const size = id => SIZES[id];

// ---------- raster canvas (procedural pixel art) ----------
class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); }
  set(x, y, c) { x = r(x); y = r(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c; }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.px[y * this.w + x] : null; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const col = typeof c === 'function' ? c(x + i, y + j) : c; if (col) this.set(x + i, y + j, col); } return this; }
  // c may be a color or a function (x,y)->color|null (for dithering/shading)
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) { const col = typeof c === 'function' ? c(x, y) : c; if (col) this.set(x, y, col); }
      }
    return this;
  }
  circle(cx, cy, rad, c) { return this.ellipse(cx, cy, rad, rad, c); }
  line(x0, y0, x1, y1, c) {
    x0 = r(x0); y0 = r(y0); x1 = r(x1); y1 = r(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    return this;
  }
  poly(pts, c) { // filled polygon, even-odd scanline
    const ys = pts.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const yc = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) { const col = typeof c === 'function' ? c(x, y) : c; if (col) this.set(x, y, col); }
    }
    return this;
  }
  art(rows, map, ox = 0, oy = 0) { parseArt(rows).forEach((row, y) => [...row].forEach((ch, x) => { if (map[ch] && ch !== '.' && ch !== ' ') this.set(ox + x, oy + y, map[ch]); })); return this; }
  // add a 1px outline around all filled pixels (4-neighbourhood)
  outline(c) {
    const add = [];
    for (let y = -1; y <= this.h; y++) for (let x = -1; x <= this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1)) add.push([x, y]);
    }
    add.forEach(([x, y]) => this.set(x, y, c));
    return this;
  }
  toSVG(ox = 0, oy = 0) {
    const by = {};
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const c = this.px[y * this.w + x];
        if (!c) { x++; continue; }
        let n = 1; while (x + n < this.w && this.px[y * this.w + x + n] === c) n++;
        (by[c] = by[c] || []).push(`M${x + ox} ${y + oy}h${n}v1h-${n}z`);
        x += n;
      }
    }
    return Object.entries(by).map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
  }
}

// ---------- dithering (4x4 ordered Bayer) ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
// fill function for Canvas: mixes c1->c2 by level 0..16 using Bayer matrix
const dith = (c1, c2, level) => (x, y) => (bayer(x, y) < level ? c2 : c1);
const DPAT = {};
// SVG pattern fill mixing two colors at level 0..16 -> returns 'url(#id)'
function ditherFill(c1, c2, level) {
  level = clamp(r(level), 0, 16);
  if (level === 0) return c1; if (level === 16) return c2;
  const k = `${c1}|${c2}|${level}`;
  if (!DPAT[k]) {
    const id = newId('dp'); DPAT[k] = id;
    let d = '';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (bayer(x, y) < level) d += `M${x} ${y}h1v1h-1z`;
    def(`<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${c1}"/><path fill="${c2}" d="${d}"/></pattern>`);
  }
  return `url(#${DPAT[k]})`;
}
// vertical dithered gradient as markup, color stops [[y,color],...] (absolute y), in rect x,y,w,h
function ditherGradient(x, y, w, h, stops) {
  const rows = [];
  for (let j = 0; j < h; j++) {
    const yy = y + j;
    let i = 0; while (i < stops.length - 2 && yy >= stops[i + 1][0]) i++;
    const [ya, ca] = stops[i], [yb, cb] = stops[Math.min(i + 1, stops.length - 1)];
    const u = yb === ya ? 0 : clamp((yy - ya) / (yb - ya));
    rows.push(ditherFill(ca, cb, u * 16));
  }
  let out = '', j = 0;
  while (j < h) { let n = 1; while (j + n < h && rows[j + n] === rows[j]) n++; out += `<rect x="${x}" y="${y + j}" width="${w}" height="${n}" fill="${rows[j]}"/>`; j += n; }
  return out;
}

// ---------- timeline animation (global 60s clock) ----------
const ANIM = `dur="${T}s" repeatCount="indefinite"`;
// discrete step animation. st: [[t, value], ...] sorted by t. value holds until next step.
// tag='animateTransform' with attr='translate'|'rotate'|'scale' animates transform.
function steps(attr, st, tag = 'animate') {
  st = st.filter(s => s[0] < T);
  if (!st.length) return '';
  if (st[0][0] > 0) st = [[0, st[0][1]], ...st];
  const v = [], k = [];
  for (const [t, val] of st) {
    if (v.length && v[v.length - 1] === String(val)) continue;
    if (k.length && kt(t) === k[k.length - 1]) { v[v.length - 1] = String(val); continue; }
    v.push(String(val)); k.push(kt(t));
  }
  const type = tag === 'animateTransform' ? ` type="${attr}"` : '';
  const an = tag === 'animateTransform' ? 'transform' : attr;
  if (v.length === 1) { v.push(v[0]); k.push(1); }
  return `<${tag} attributeName="${an}"${type} calcMode="discrete" values="${v.join(';')}" keyTimes="${k.join(';')}" ${ANIM}/>`;
}
// put inside an element: visible (opacity 1) only during [t0,t1). Element should start with opacity="0".
function show(t0, t1) {
  const st = [];
  if (t0 > 0) st.push([0, 0]);
  st.push([t0, 1]);
  if (t1 < T) st.push([t1, 0]);
  return steps('opacity', st);
}
// linear (smooth) animation of any attribute over global time. pts: [[t,value],...]
function tween(attr, pts) {
  if (pts[0][0] > 0) pts = [[0, pts[0][1]], ...pts];
  if (pts[pts.length - 1][0] < T) pts = [...pts, [T, pts[pts.length - 1][1]]];
  return `<animate attributeName="${attr}" values="${pts.map(p => p[1]).join(';')}" keyTimes="${pts.map(p => kt(p[0])).join(';')}" ${ANIM}/>`;
}
// sample a function of time into [[t, value]] steps (pixel-snapped "stop motion")
function sample(t0, t1, fps, fn) {
  const n = Math.max(1, Math.round((t1 - t0) * fps)), out = [];
  for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; out.push([t, fn(t)]); }
  return out;
}
// discrete translate animation: fn(t) -> [x,y]  (put inside a <g>)
function move(t0, t1, fps, fn) {
  return steps('translate', sample(t0, t1, fps, t => fn(t).map(r).join(' ')), 'animateTransform');
}
// local looping frame animation (independent of timeline): frame i of n, period seconds
function loopFrame(i, n, period) {
  const v = [...Array(n)].map((_, j) => (j === i ? 1 : 0));
  return `<animate attributeName="opacity" calcMode="discrete" values="${v.join(';')}" keyTimes="${v.map((_, j) => +(j / n).toFixed(4)).join(';')}" dur="${period}s" repeatCount="indefinite"/>`;
}
// flipbook of sprite ids looping forever at fps, placed at x,y
function flipbook(ids, fps, x = 0, y = 0, flip = false) {
  return ids.map((id, i) => `<g opacity="${i ? 0 : 1}">${use(id, x, y, flip)}${loopFrame(i, ids.length, ids.length / fps)}</g>`).join('');
}
// THE ACTOR: choreograph a sprite over [t0,t1).
//   pose(t) -> sprite id (or null = hidden), pos(t) -> [x,y] top-left, flip(t) -> bool (mirror)
// Sampled at fps; outputs one moving group with one <use> per distinct pose variant.
function act({ t0, t1, fps = 12, pose, pos = () => [0, 0], flip = () => false }) {
  const s = sample(t0, t1, fps, t => ({ id: pose(t), p: pos(t).map(r), f: !!flip(t) }));
  s[s.length - 1][1].id = null; // hidden from t1 on
  const variants = [...new Set(s.filter(q => q[1].id).map(q => q[1].id + (q[1].f ? '|f' : '')))];
  const mv = steps('translate', s.map(([t, q]) => [t, q.p.join(' ')]), 'animateTransform');
  const uses = variants.map(v => {
    const [id, f] = v.split('|');
    const st = s.map(([t, q]) => [t, q.id && (q.id + (q.f ? '|f' : '')) === v ? 1 : 0]);
    if (t0 > 0) st.unshift([0, 0]);
    return `<g opacity="0">${use(id, 0, 0, f === 'f')}${steps('opacity', st)}</g>`;
  });
  return `<g>${mv}${uses.join('')}</g>`;
}

// ---------- pixel font (3x5) ----------
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ':': '000010000010000', '.': '000000000000010', '!': '010010010000010', '?': '110001010000010',
  "'": '010010000000000', '-': '000000111000000', ' ': '000000000000000', '♥': '000101111111010', '/': '001001010100100',
  '~': '000000011110000', ',': '000000000010100', '*': '000101010101000',
};
// pixel text markup at x,y with color c, scale s
function text(str, x, y, c, s = 1) {
  let d = '', cx = x;
  for (const ch of str.toUpperCase()) {
    const g = FONT[ch] || FONT['?'];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') d += `M${cx + i * s} ${y + j * s}h${s}v${s}h-${s}z`;
    cx += 4 * s;
  }
  return `<path fill="${c}" d="${d}"/>`;
}
const textWidth = (str, s = 1) => str.length * 4 * s - s;

module.exports = {
  T, W, H, clamp, lerp, inv, ease, easeIn, easeOut, hop, key, pick, rng, r,
  def, resetDefs, getDefs, newId, parseArt, artPaths, sprite, spriteRaw, use, size,
  Canvas, bayer, dith, ditherFill, ditherGradient,
  steps, show, tween, sample, move, loopFrame, flipbook, act, ANIM,
  text, textWidth, FONT,
};
