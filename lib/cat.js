// Parametric pixel-art cat rig ("Mikan", an orange tabby with white chest).
// drawCat(params) rasterises the cat into a 36x28 Canvas (facing RIGHT, feet on row 27).
// catSprite(id, params) registers it as a sprite usable with core.use()/core.act().
'use strict';
const C = require('./core');
const { Canvas } = C;

const PAL = {
  k: '#2b1d2e',   // outline
  o: '#f2a14a',   // fur
  d: '#cf6e2e',   // stripes / shade
  h: '#ffd08c',   // fur highlight
  w: '#fff3e0',   // white fur
  s: '#e6cdb6',   // white shade
  p: '#f59aaa',   // pink (ears, blush, paw pads)
  n: '#e2607a',   // nose / mouth inside
  e: '#ffffff',   // eye shine
  g: '#96d65a',   // eye iris (used in 'wide' eyes)
};
const CW = 36, CH = 28;

// composite src canvas over dst
function over(dst, src, ox = 0, oy = 0) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c) dst.set(x + ox, y + oy, c); }
  return dst;
}
// tabby fur shader: stripes + lower shade + top highlight, relative to a part centre
const fur = (cx, cy, ry, stripes = true) => (x, y) => {
  if (y > cy + ry * 0.55) return PAL.d;
  if (stripes && (x % 4 === 0) && y < cy + ry * 0.3 && y > cy - ry * 0.9) return PAL.d;
  if (y < cy - ry * 0.7) return PAL.h;
  return PAL.o;
};
// thick curve (tail) from list of points
function thick(cv, pts, rad, col) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2) + 1;
    for (let j = 0; j <= n; j++) { const u = j / n; cv.circle(ax + (bx - ax) * u, ay + (by - ay) * u, rad, col); }
  }
}
// tail polyline from base, pointing in direction `ang` (deg, 0=left,90=up), curling by `curl`
function tailPts(bx, by, ang, curl, len = 11) {
  const pts = []; let a = ang * Math.PI / 180, x = bx, y = by;
  for (let i = 0; i <= 5; i++) { pts.push([x, y]); x -= Math.cos(a) * len / 5; y -= Math.sin(a) * len / 5; a += curl * Math.PI / 180 / 5; }
  return pts;
}

// ---- head (front facing) ----
function drawHead(cv, hx, hy, p) {
  const L = new Canvas(CW, CH);
  const tilt = p.headTilt || 0; // ear tilt pixels
  // ears
  L.poly([[hx - 6, hy - 2], [hx - 5 + tilt, hy - 9], [hx - 1, hy - 4]], PAL.o);
  L.poly([[hx + 1, hy - 4], [hx + 5 + tilt, hy - 9], [hx + 7, hy - 2]], PAL.o);
  // head
  L.ellipse(hx + .5, hy + .5, 6.6, 5.4, (x, y) => (y > hy + 3 ? PAL.d : y < hy - 3 ? PAL.h : PAL.o));
  L.outline(PAL.k);
  // inner ears
  L.set(hx - 4 + tilt, hy - 6, PAL.p); L.set(hx - 4 + tilt, hy - 5, PAL.p); L.set(hx - 3, hy - 5, PAL.p);
  L.set(hx + 4 + tilt, hy - 6, PAL.p); L.set(hx + 4 + tilt, hy - 5, PAL.p); L.set(hx + 3, hy - 5, PAL.p);
  // forehead tabby "M"
  [[-2, -4], [-2, -3], [0, -5], [0, -4], [2, -4], [2, -3]].forEach(([dx, dy]) => L.set(hx + dx, hy + dy, PAL.d));
  // muzzle
  L.ellipse(hx + .5, hy + 3, 3.2, 2, PAL.w);
  // eyes
  const ex = [hx - 3, hx + 2], ey = hy;
  const eyes = p.eyes || 'open';
  ex.forEach((x, i) => {
    if (eyes === 'open') { L.rect(x, ey - 1, 2, 2, PAL.k); L.set(x + (i ? 0 : 1), ey - 1, PAL.e); }
    else if (eyes === 'wide') { L.rect(x, ey - 2, 2, 3, PAL.k); L.set(x + (i ? 0 : 1), ey - 2, PAL.e); L.set(x + (i ? 1 : 0), ey, PAL.g); }
    else if (eyes === 'half') { L.rect(x, ey, 2, 1, PAL.k); L.set(x + (i ? 0 : 1), ey - 1, PAL.k); }
    else if (eyes === 'closed') { L.rect(x, ey, 2, 1, PAL.k); }
    else if (eyes === 'look') { L.rect(x + 1, ey - 1, 1, 2, PAL.k); } // glancing right
  });
  if (eyes === 'happy') { // ^ ^
    ex.forEach(x => { L.set(x, ey, PAL.k); L.set(x + 1, ey - 1, PAL.k); L.set(x + 2, ey, PAL.k); L.set(x + 1, ey, PAL.o); });
  }
  // blush
  L.set(hx - 5, hy + 2, PAL.p); L.set(hx + 6, hy + 2, PAL.p);
  // nose + mouth
  L.set(hx, hy + 2, PAL.n); L.set(hx + 1, hy + 2, PAL.n);
  const m = p.mouth || 'cat';
  if (m === 'cat') { L.set(hx - 1, hy + 4, PAL.k); L.set(hx, hy + 3, PAL.k); L.set(hx + 1, hy + 3, PAL.k); L.set(hx + 2, hy + 4, PAL.k); }
  else if (m === 'open') { L.rect(hx - 1, hy + 3, 4, 2, PAL.k); L.rect(hx, hy + 4, 2, 1, PAL.n); }
  else if (m === 'yawn') { L.rect(hx - 1, hy + 3, 4, 3, PAL.k); L.rect(hx, hy + 4, 2, 2, PAL.n); }
  else if (m === 'tongue') { L.set(hx, hy + 3, PAL.k); L.set(hx + 1, hy + 3, PAL.k); L.set(hx, hy + 4, PAL.n); L.set(hx + 1, hy + 4, PAL.n); }
  over(cv, L);
}

// ---- main ----
// params: pose ('sit'|'walk'|'loaf'|'sleep'|'stretch'|'crouch'|'leap'|'eat'|'sitback'),
//   eyes ('open'|'wide'|'half'|'closed'|'happy'|'look'), mouth ('cat'|'open'|'yawn'|'tongue'|'none'),
//   tail (angle deg, 0=left, 90=up), curl (deg), step (walk frame 0..3), breath (0|1), headDX, headDY, paw (raise front paw 0..3)
function drawCat(p = {}) {
  const pose = p.pose || 'sit';
  const cv = new Canvas(CW, CH);
  const B = new Canvas(CW, CH); // body layer
  const Lg = new Canvas(CW, CH); // front legs layer
  const Tl = new Canvas(CW, CH); // tail layer
  const br = p.breath ? 1 : 0;
  let head = null;

  if (pose === 'sit' || pose === 'sitback') {
    thick(Tl, tailPts(8, 25, p.tail ?? 10, p.curl ?? 100, 12), 1.3, PAL.o);
    B.ellipse(14, 19 - br * .5, 7.5, 7.5 + br * .5, fur(14, 19, 7.5));
    B.ellipse(12, 23, 7.5, 4.6, fur(12, 23, 4.6, false));
    B.ellipse(19.5, 18, 3.6, 5.5, PAL.w);
    // front legs
    const raise = p.paw || 0;
    Lg.rect(17, 19, 3, 8, PAL.w); Lg.rect(21, 19 - raise, 3, 8 - raise, PAL.w);
    head = [21, 10 + (p.headDY || 0)];
  } else if (pose === 'walk' || pose === 'crouch') {
    const s = p.step || 0; // 0..3
    const sw = [0, 1.5, 0, -1.5][s], lift = [0, 1, 0, 1][s];
    const low = pose === 'crouch' ? 3 : 0;
    thick(Tl, tailPts(6, 16 + low, p.tail ?? 110, p.curl ?? -50, 12), 1.3, PAL.o);
    // far legs (darker)
    const FL = new Canvas(CW, CH);
    FL.rect(8 - sw, 20, 3, 7 - (s === 3 ? 1 : 0), PAL.d); FL.rect(21 + sw, 20, 3, 7 - (s === 1 ? 1 : 0), PAL.d);
    FL.outline(PAL.k); over(cv, FL);
    B.ellipse(15, 18 + low * .7, 10, 5.2 - low * .2, fur(15, 18, 5.2));
    B.ellipse(21, 20 + low * .5, 3.5, 3, PAL.w);
    Lg.rect(10 + sw, 21, 3, 6 - lift, PAL.o); Lg.rect(10 + sw, 25 - lift, 3, 2, PAL.w);
    Lg.rect(19 - sw, 21, 3, 6 - (1 - lift), PAL.w);
    head = [25, 12 + low + (p.headDY || 0)];
  } else if (pose === 'loaf') {
    thick(Tl, tailPts(6, 25, p.tail ?? 20, p.curl ?? 40, 10), 1.3, PAL.o);
    B.ellipse(15, 21 - br * .5, 11, 6 + br * .5, fur(15, 21, 6));
    B.ellipse(22, 24, 3.5, 2.5, PAL.w);
    Lg.rect(20, 25, 4, 2, PAL.w);
    head = [22, 15 + (p.headDY || 0)];
  } else if (pose === 'sleep') { // curled donut, head resting right
    thick(Tl, [[5, 24], [10, 27], [18, 27], [25, 26]], 1.3, PAL.o);
    B.ellipse(15, 21 - br * .5, 12, 6.5 + br * .5, fur(15, 21, 6.5));
    head = [23, 20 + (p.headDY || 0)];
  } else if (pose === 'stretch') { // front down, butt up
    thick(Tl, tailPts(5, 12, p.tail ?? 70, p.curl ?? -30, 12), 1.3, PAL.o);
    B.poly([[4, 12], [12, 10], [26, 19], [26, 25], [16, 24], [5, 20]], fur(15, 17, 7));
    B.ellipse(8, 15, 5, 5, fur(8, 15, 5));
    B.rect(5, 18, 3, 9, PAL.o); B.rect(9, 18, 3, 9, PAL.d);
    Lg.rect(22, 24, 12, 3, PAL.w);
    head = [25, 19 + (p.headDY || 0)];
  } else if (pose === 'leap') { // flying pounce, body stretched
    thick(Tl, tailPts(4, 14, p.tail ?? 10, p.curl ?? -20, 12), 1.3, PAL.o);
    B.ellipse(15, 15, 11, 4.6, fur(15, 15, 4.6));
    B.rect(1, 16, 6, 3, PAL.o);
    Lg.rect(24, 13, 8, 3, PAL.w); Lg.rect(22, 17, 8, 3, PAL.w);
    head = [26, 10 + (p.headDY || 0)];
  } else if (pose === 'eat') { // crouched, head down to bowl
    thick(Tl, tailPts(6, 20, p.tail ?? 100, p.curl ?? -50, 12), 1.3, PAL.o);
    B.ellipse(14, 20, 9, 6, fur(14, 20, 6));
    B.rect(8, 22, 3, 5, PAL.o);
    Lg.rect(19, 22, 3, 5, PAL.w); Lg.rect(22, 22, 3, 5, PAL.w);
    head = [26, 19 + (p.headDY || 0)];
  }

  Tl.outline(PAL.k); over(cv, Tl);
  B.outline(PAL.k); over(cv, B);
  // paw toes
  Lg.outline(PAL.k); over(cv, Lg);
  if (head) drawHead(cv, head[0] + (p.headDX || 0), head[1], p);
  return cv;
}

const catSprite = (id, params) => C.spriteRaw(id, drawCat(params).toSVG(), CW, CH);

module.exports = { PAL, drawCat, catSprite, over, fur, thick, tailPts, CW, CH };
