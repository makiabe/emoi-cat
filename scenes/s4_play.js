// S4 PLAY — living room, golden afternoon (global 29–39).
// Yarn ball rolls in -> crouch + butt wiggle -> POUNCE -> tangled tumble -> cardboard box -> dive in -> peek -> "!" pop.
'use strict';
module.exports = ({ t0, t1, C, cat }) => {
  const { Canvas } = C;
  const P = cat.PAL, K = P.k;
  const G = 128;          // ground row (first row below feet)
  const CY = G - 28;      // cat sprite top when standing on ground
  const fl = Math.floor, rr = Math.round;
  const out = [];
  const add = s => out.push(s);
  const has = id => !!C.size(id);
  // compact raster -> SVG: 1px-wide horizontal strokes (much smaller than filled rects)
  const svg = (cv, ox = 0, oy = 0) => {
    const by = {};
    for (let y = 0; y < cv.h; y++) {
      let x = 0;
      while (x < cv.w) {
        const c = cv.px[y * cv.w + x];
        if (!c) { x++; continue; }
        let n = 1; while (x + n < cv.w && cv.px[y * cv.w + x + n] === c) n++;
        const b = by[c] || (by[c] = { d: '', y: -1, x: 0 });
        b.d += b.y === y ? `m${x - b.x} 0h${n}` : `M${x + ox} ${y + oy + .5}h${n}`;
        b.y = y; b.x = x + n; x += n;
      }
    }
    return Object.entries(by).map(([c, b]) => `<path stroke="${c}" d="${b.d}"/>`).join('');
  };
  const reg = (id, cv) => { if (!has(id)) C.spriteRaw(id, svg(cv), cv.w, cv.h); return id; };
  const lazy = (id, fn) => (has(id) ? id : reg(id, fn()));
  const art = (id, rows, map) => (has(id) ? id : C.sprite(id, rows, map));

  // ------------------------------------------------------------------ palette
  const WALL = '#f1cc90', WALL2 = '#e7bd80', WALLD = '#d49d62';
  const WOOD = '#8a5a3c', WOODD = '#6b412c', WOODL = '#b07a4f', WOODH = '#cf9a64';
  const YARN = '#d9485f', YARND = '#a3304b', YARNL = '#f58a96';
  const CB = '#d6a062', CBS = '#b98249', CBD = '#8e5b33', CBH = '#ecc27f', CBIN = '#5c3624', CBIN2 = '#7a4a2e';
  const TEAL = '#4f8a86', TEALD = '#3b6b6c', TEALL = '#6fa8a0', TEALH = '#8cc2b4';
  const LIGHT = '#ffe9b8';

  // ------------------------------------------------------------------ local cat head (port of the rig's head, + extra eyes)
  function head(cv, hx, hy, p = {}) {
    const L = new Canvas(cv.w, cv.h);
    const tilt = p.headTilt || 0;
    L.poly([[hx - 6, hy - 2], [hx - 5 + tilt, hy - 9], [hx - 1, hy - 4]], P.o);
    L.poly([[hx + 1, hy - 4], [hx + 5 + tilt, hy - 9], [hx + 7, hy - 2]], P.o);
    L.ellipse(hx + .5, hy + .5, 6.6, 5.4, (x, y) => (y > hy + 3 ? P.d : y < hy - 3 ? P.h : P.o));
    L.outline(K);
    L.set(hx - 4 + tilt, hy - 6, P.p); L.set(hx - 4 + tilt, hy - 5, P.p); L.set(hx - 3, hy - 5, P.p);
    L.set(hx + 4 + tilt, hy - 6, P.p); L.set(hx + 4 + tilt, hy - 5, P.p); L.set(hx + 3, hy - 5, P.p);
    [[-2, -4], [-2, -3], [0, -5], [0, -4], [2, -4], [2, -3]].forEach(([dx, dy]) => L.set(hx + dx, hy + dy, P.d));
    L.ellipse(hx + .5, hy + 3, 3.2, 2, P.w);
    const ex = [hx - 3, hx + 2], ey = hy, e = p.eyes || 'open';
    ex.forEach((x, i) => {
      if (e === 'open') { L.rect(x, ey - 1, 2, 2, K); L.set(x + (i ? 0 : 1), ey - 1, P.e); }
      else if (e === 'closed') L.rect(x, ey, 2, 1, K);
      else if (e === 'squeeze') { if (i === 0) { L.set(x, ey - 1, K); L.set(x + 1, ey, K); L.set(x, ey + 1, K); } else { L.set(x + 1, ey - 1, K); L.set(x, ey, K); L.set(x + 1, ey + 1, K); } }
      else if (e === 'happy') { L.set(x, ey, K); L.set(x + 1, ey - 1, K); L.set(x + 2, ey, K); }
    });
    L.set(hx - 5, hy + 2, P.p); L.set(hx + 6, hy + 2, P.p);
    L.set(hx, hy + 2, P.n); L.set(hx + 1, hy + 2, P.n);
    const m = p.mouth || 'cat';
    if (m === 'cat') { L.set(hx - 1, hy + 4, K); L.set(hx, hy + 3, K); L.set(hx + 1, hy + 3, K); L.set(hx + 2, hy + 4, K); }
    else if (m === 'open') { L.rect(hx - 1, hy + 3, 4, 2, K); L.rect(hx, hy + 4, 2, 1, P.n); }
    cat.over(cv, L);
  }

  // ------------------------------------------------------------------ cat sprites (lazy, deduped)
  const keyOf = o => Object.keys(o).sort().map(k => k.slice(0, 2) + String(o[k]).replace(/[^a-z0-9]/gi, 'm')).join('');
  const cs = (params, post, tag = '') => lazy('s4_c' + keyOf(params) + tag, () => { const cv = cat.drawCat(params); if (post) post(cv); return cv; });
  // raise the rear (columns x<13) by n px — butt wiggle
  const rearUp = n => cv => {
    for (let k = 0; k < n; k++) for (let y = 0; y < 20; y++) for (let x = 0; x < 13; x++) cv.px[y * cv.w + x] = cv.get(x, y + 1);
  };
  // hunting stalk: columns sheared so the rear rises by `rear` and the front/head sinks by `front`
  const stalk = (rear, front) => cv => {
    const src = cv.px.slice(), w = cv.w, get = (x, y) => (y >= 0 && y < cv.h ? src[y * w + x] : null);
    for (let x = 0; x < w; x++) {
      const dy = rr(C.lerp(-rear, front, C.clamp((x - 5) / 12)));
      if (dy < 0) for (let y = 0; y < 21; y++) cv.px[y * w + x] = y - dy < 21 ? get(x, y - dy) : get(x, 20);
      else if (dy > 0) for (let y = 20 + dy; y >= 0; y--) { const c = get(x, y - dy); if (y <= 20 || c) cv.px[y * w + x] = c; }
    }
  };
  // dizzy X eyes + yarn strands draped over a sitting cat
  const dazedPost = w => cv => {
    const hx = 21 + w, ey = 10;
    [hx - 3, hx + 2].forEach(x => { cv.set(x, ey, P.o); cv.set(x + 1, ey, P.o); });
    [[hx - 4, 0], [hx + 2, 0]].forEach(([x]) => { [[0, -1], [2, -1], [1, 0], [0, 1], [2, 1]].forEach(([dx, dy]) => cv.set(x + dx, ey + dy, K)); });
    cv.line(4, 16, 17, 25, YARN); cv.line(7, 26, 19, 16, YARN); cv.line(15, 18, 26, 18, YARN);
    cv.line(hx - 6, 3, hx - 7, 7, YARN); cv.set(hx - 8, 8, YARN);
    cv.line(1, 21, 4, 27, YARN);
  };

  // tangled furball (cat + yarn), 36x36, 4 rotations
  const rot90 = cv => { const o = new Canvas(cv.h, cv.w); for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) { const c = cv.get(x, y); if (c) o.set(cv.h - 1 - y, x, c); } return o; };
  function tangleBase() {
    const cv = new Canvas(36, 36);
    const Lm = new Canvas(36, 36);
    Lm.rect(27, 19, 6, 3, P.w); Lm.rect(25, 26, 3, 6, P.w);
    Lm.rect(2, 23, 7, 3, P.o); Lm.rect(2, 23, 2, 3, P.w);
    Lm.rect(10, 29, 3, 5, P.o); Lm.rect(10, 32, 3, 2, P.w);
    cat.thick(Lm, [[9, 15], [4, 13], [2, 8], [5, 4]], 1.3, P.o);
    Lm.outline(K); cat.over(cv, Lm);
    const B = new Canvas(36, 36);
    B.circle(17, 22, 10, cat.fur(17, 22, 10));
    B.ellipse(20, 25, 4, 4, P.w);
    B.outline(K); cat.over(cv, B);
    head(cv, 21, 12, { eyes: 'squeeze', mouth: 'open' });
    cv.line(6, 17, 23, 32, YARN); cv.line(8, 30, 30, 23, YARN); cv.line(12, 12, 7, 25, YARN);
    cv.line(27, 17, 31, 26, YARN);
    const Y = new Canvas(36, 36);
    Y.circle(28.5, 28.5, 4, (x, y) => ((x + y) % 3 === 0 ? YARND : YARN)); Y.outline(K); cat.over(cv, Y);
    return cv;
  }
  const TAN = [];
  { let cv = tangleBase(); for (let i = 0; i < 4; i++) { TAN.push(reg('s4_tan' + i, cv)); cv = rot90(cv); } }

  // ------------------------------------------------------------------ yarn ball + string
  const BALL = [0, 1, 2, 3].map(f => {
    const cv = new Canvas(13, 13);
    cv.circle(6.5, 6.5, 5.5, (x, y) => {
      const u = x + 0.14 * (y - 6.5) * (y - 6.5);
      if (((fl(u) + f) % 4 + 4) % 4 === 0) return YARND;
      if (x + y < 8) return YARNL;
      if (x + y > 16) return YARND;
      return YARN;
    });
    cv.outline(K); cv.set(4, 3, '#ffd0d6');
    return reg('s4_ball' + f, cv);
  });
  const STR = [0, 1, 2].map(ph => {
    const cv = new Canvas(150, 6); let py = null;
    for (let x = 0; x < 150; x++) {
      const y = 3 + rr(1.2 * Math.sin((x + ph * 5) / 5) * Math.min(1, x / 12));
      cv.set(x, y, x % 7 === 3 ? YARND : YARN);
      if (py !== null && py !== y) cv.set(x, py, YARN);
      py = y;
    }
    return reg('s4_str' + ph, cv);
  });

  // ------------------------------------------------------------------ cardboard box (params: squash/tilt), back + front layers
  const BOX = { OX: 16, OY: 14, W: 76, H: 52 };
  function boxCv({ sx = 1, sy = 1, rot = 0 }) {
    const a = rot * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), pv = [22, 34];
    const T = ([x, y]) => { const dx = (x - pv[0]) * sx, dy = (y - pv[1]) * sy; return [pv[0] + dx * ca - dy * sa + BOX.OX, pv[1] + dx * sa + dy * ca + BOX.OY]; };
    const poly = (cv, pts, c) => cv.poly(pts.map(T), c);
    const px = (cv, x, y, c) => { const [X, Y] = T([x + .5, y + .5]); cv.set(X - .5, Y - .5, c); };
    const ln = (cv, a0, b0, c) => { const A = T(a0), B = T(b0); cv.line(A[0] - .5, A[1] - .5, B[0] - .5, B[1] - .5, c); };
    const back = new Canvas(BOX.W, BOX.H), front = new Canvas(BOX.W, BOX.H);
    // back: back flap (inner face), left flap, interior
    poly(back, [[5, 5], [44, 5], [46, -2], [7, -2]], CBS);
    poly(back, [[0, 10], [4, 5], [-4, 1], [-9, 6]], CB);
    poly(back, [[0, 10], [4, 5], [44, 5], [40, 10]], CBIN);
    poly(back, [[3, 6], [44, 6], [44, 8], [2, 8]], CBIN2);
    back.outline(K);
    ln(back, [6, -1], [43, -1], CBH);
    // front: face, side, right flap
    poly(front, [[0, 10], [40, 10], [40, 34], [0, 34]], CB);
    poly(front, [[40, 10], [44, 5], [44, 29], [40, 34]], CBS);
    poly(front, [[40, 10], [44, 5], [53, 4], [50, 10]], CBH);
    poly(front, [[0, 31], [40, 31], [40, 34], [0, 34]], CBS);
    front.outline(K);
    ln(front, [0, 10], [39, 10], CBH);
    ln(front, [40, 11], [40, 33], CBD);
    poly(front, [[17, 10], [23, 10], [23, 16], [17, 16]], '#f0d9a4');
    px(front, 17, 16, CB); px(front, 20, 16, CB);
    // mikan logo + label
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = x * x + y * y; if (d <= 11) px(front, 8 + x, 23 + y, d > 7 ? '#c2552a' : (x + y < -2 ? '#ffb45a' : '#f28a2e')); }
    px(front, 8, 18, '#3f7d4a'); px(front, 9, 18, '#5fae5a'); px(front, 10, 17, '#5fae5a');
    const word = 'MIKAN'; let cx = 15;
    for (const ch of word) { const g = C.FONT[ch]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') px(front, cx + i, 21 + j, '#8e4a2a'); cx += 4; }
    ln(front, [15, 27], [33, 27], CBS);
    return { back, front };
  }
  const BOXV = { n: {}, sq: { sx: 1.12, sy: .8 }, st: { sx: .94, sy: 1.08 }, l: { rot: -4 }, r: { rot: 4 }, l2: { rot: -2 }, r2: { rot: 2 }, sl: { rot: -7 } };
  const boxId = (v, layer) => { const id = `s4_b${layer}_${v}`; if (!has(id)) { const b = boxCv(BOXV[v]); reg('s4_bb_' + v, b.back); reg('s4_bf_' + v, b.front); } return id; };

  // ------------------------------------------------------------------ fx sprites
  const STAR = art('s4_star', `
    ..k..
    .kyk.
    kyyyk
    .kyk.
    ..k..`, { k: '#c9772e', y: '#ffe066' });
  const DROP = art('s4_drop', `
    .k.
    kbk
    kbk
    bwb
    kbk
    .k.`, { k: '#3d6fa8', b: '#8fd3ff', w: '#ffffff' });
  const HEART = art('s4_heart', `
    .kk.kk.
    kppkppk
    kpwpppk
    kpppppk
    .kpppk.
    ..kpk..
    ...k...`, { k: K, p: '#f26d8a', w: '#ffd0d6' });
  const PAWS = art('s4_paws', `
    .kkk..kkk.
    kwwwkkwwwk
    kwkwkkwkwk
    kwwwkkwwwk`, { k: K, w: P.w });
  const ML = [0, 1].map(f => art('s4_ml' + f, f ? `
    ....wwwwwwww
    ............
    ..........
    wwwwwwwwwwww
    ............
    ......wwwwww` : `
    ..wwwwwwwwww
    ............
    ......
    ..wwwwwwwwww
    ............
    wwwwwwwwww`, { w: '#fff3e0' }));
  const BURST = art('s4_burst', `
    ....y.....y....
    .y...y...y...y.
    ..y..........y.
    ...............
    yy.....w.....yy
    ......www......
    .....wwwww.....
    ......www......
    yy.....w.....yy
    ...............
    ..y.........y..
    .y...y...y...y.
    ....y.....y....`, { y: '#ffe066', w: '#ffffff' });
  // tumble fx frames: stars + sweat drops scattered around the furball (56x48, centre 28,24)
  const TFX = [0, 1, 2, 3].map(f => {
    let m = '';
    const R = C.rng(11 + f * 7);
    for (let i = 0; i < 3; i++) {
      const a = (f * 0.9 + i * 2.1) + R() * .6, rad = 20 + R() * 4;
      const x = rr(28 + Math.cos(a) * rad * 1.1 - 2), y = rr(20 + Math.sin(a) * rad * .8 - 2);
      m += C.use(i === 2 ? DROP : STAR, x, y);
    }
    return C.spriteRaw('s4_tfx' + f, m, 56, 48);
  });
  // dizzy stars orbit (26x12, centre 13,6)
  const DZ = [0, 1, 2, 3, 4, 5].map(f => {
    let m = '';
    for (let i = 0; i < 3; i++) { const a = f / 6 * Math.PI * 2 + i * Math.PI * 2 / 3; m += C.use(STAR, rr(13 + Math.cos(a) * 9 - 2), rr(4 + Math.sin(a) * 3 - 2)); }
    return C.spriteRaw('s4_dz' + f, m, 26, 12);
  });
  const SPK = [0, 1].map(f => art('s4_spk' + f, f ? `
    ...w.......
    ..www......
    ...w.....w.
    .........w.
    .......wwwww
    .........w.
    .........w.` : `
    ...w.......
    ...w.......
    .wwwww.....
    ...w.....w.
    ...w....www
    .........w.
    ...........`, { w: '#ffffff' }));
  // dust puffs (bottom aligned, 14x9)
  const DUST = [0, 1, 2].map(f => {
    const cv = new Canvas(14, 9);
    const pts = [[[5, 6, 2.2], [9, 7, 1.5]], [[4, 5, 3], [9, 6, 2.4], [12, 7, 1.2]], [[3, 4, 2.5], [8, 5, 2], [12, 6, 1.4]]][f];
    pts.forEach(([x, y, r]) => cv.circle(x, y, r, (xx, yy) => (f === 2 && (xx + yy) % 2 ? null : yy > y + r * .3 ? '#e7cfa6' : '#fbf0d8')));
    return reg('s4_dust' + f, cv);
  });
  const BUB = [0, 1].map(f => {
    const cv = new Canvas(17, 19);
    if (f === 0) { cv.ellipse(8.5, 9, 5, 5.5, '#ffffff'); cv.outline(K); cv.rect(8, 6, 2, 4, '#e84a5f'); cv.rect(8, 11, 2, 2, '#e84a5f'); }
    else {
      cv.ellipse(8.5, 8, 7.5, 7.5, '#ffffff'); cv.poly([[2, 12], [6, 14], [0, 18]], '#ffffff'); cv.outline(K);
      cv.rect(7, 3, 3, 7, '#e84a5f'); cv.rect(7, 11, 3, 2, '#e84a5f'); cv.set(7, 3, '#ff8a9a'); cv.set(7, 4, '#ff8a9a');
    }
    return reg('s4_bub' + f, cv);
  });
  const TICK = art('s4_tick', `
    k.......
    .k......
    ........
    ....k...
    k....k..
    .k......
    ........
    kk......`, { k: K });
  const TAILP = [-1, 0, 1].map((c, i) => {
    const cv = new Canvas(12, 16);
    cat.thick(cv, [[6, 15], [6, 10], [6 + c, 6], [6 + c * 3, 3]], 1.3, P.o);
    cv.set(6, 9, P.d); cv.set(5, 9, P.d); cv.set(6 + c, 5, P.d);
    cv.outline(K);
    return reg('s4_tp' + i, cv);
  });
  const SH = [26, 16].map((w, i) => { const cv = new Canvas(w, 3); cv.ellipse(w / 2, 1.5, w / 2, 1.5, '#4a2a22'); return reg('s4_sh' + i, cv); });

  // ================================================================== BACKGROUND
  let bg = '';
  bg += `<rect width="256" height="96" fill="${WALL}"/>`;
  for (let x = 6; x < 256; x += 12) bg += `<rect x="${x}" y="4" width="1" height="86" fill="${WALL2}"/>`;
  bg += C.ditherGradient(0, 4, 256, 26, [[4, WALLD], [30, WALL]]);
  bg += `<rect width="256" height="3" fill="#b98552"/><rect y="3" width="256" height="1" fill="${WOOD}"/>`;
  // window: sky + view (clipped)
  const WX0 = 17, WY0 = 17, WX1 = 82, WY1 = 74;
  C.def(`<clipPath id="s4_winclip"><rect x="${WX0}" y="${WY0}" width="${WX1 - WX0}" height="${WY1 - WY0}"/></clipPath>`);
  let view = C.ditherGradient(WX0, WY0, WX1 - WX0, WY1 - WY0, [[17, '#79c2ee'], [46, '#b9e1f2'], [74, '#ffe0a0']]);
  {
    const v = new Canvas(256, 144);
    v.circle(26, 25, 9, (x, y) => ((x + y) % 2 ? '#fff4cc' : null)); v.circle(26, 25, 6, '#fff6d8'); v.circle(26, 25, 4, '#ffffff');
    // hazy town
    [[17, 60, 10, 14], [27, 56, 9, 18], [36, 62, 12, 12], [48, 58, 8, 16], [56, 63, 11, 11], [67, 55, 9, 19], [76, 61, 8, 13]].forEach(([x, y, w, h], i) => {
      v.rect(x, y, w, h, i % 2 ? '#d8b0a0' : '#cfa596');
      v.poly([[x - 1, y + 1], [x + w / 2, y - 3], [x + w + 1, y + 1]], i % 2 ? '#b77f78' : '#a8706e');
      if (i % 3 === 0) v.rect(x + 2, y + 5, 2, 2, '#fff0c8');
    });
    v.rect(60, 36, 1, 38, '#8a6a64'); v.rect(57, 38, 7, 1, '#8a6a64');
    v.line(17, 44, 60, 40, '#8a6a64'); v.line(60, 40, 82, 46, '#8a6a64');
    // tree
    v.circle(24, 68, 9, (x, y) => ((x * 3 + y) % 7 === 0 ? '#8cc36a' : y < 64 ? '#6fb05e' : '#4f8f5a'));
    v.circle(76, 70, 8, (x, y) => ((x * 3 + y) % 7 === 0 ? '#8cc36a' : y < 66 ? '#6fb05e' : '#4f8f5a'));
    view += svg(v);
  }
  const cloud = (x, y, s) => { const c = new Canvas(30, 10); c.ellipse(9, 6, 8 * s, 3.5, '#ffffff'); c.ellipse(17, 4.5, 7 * s, 4, '#ffffff'); c.ellipse(21, 7, 8 * s, 2.5, '#eef6fb'); return svg(c, x, y); };
  view += `<g>${C.move(t0, t1, 2, t => [rr((t - t0) * 1.4), 0])}${cloud(30, 20, 1)}${cloud(-6, 32, .8)}</g>`;
  bg += `<g clip-path="url(#s4_winclip)">${view}</g>`;
  {
    const f = new Canvas(256, 144);
    f.rect(14, 14, 71, 3, WOOD); f.rect(14, 74, 71, 2, WOOD); f.rect(14, 14, 3, 62, WOOD); f.rect(82, 14, 3, 62, WOOD);
    f.rect(48, 17, 2, 57, WOOD); f.rect(17, 44, 65, 2, WOOD);
    f.rect(15, 15, 69, 1, WOODL); f.rect(49, 17, 1, 57, WOODL);
    // glass glints
    [[21, 50], [53, 21], [55, 50]].forEach(([x, y]) => { f.line(x, y + 6, x + 6, y, '#ffffff'); f.line(x + 3, y + 7, x + 7, y + 3, '#e8f6ff'); });
    // sill
    f.rect(10, 76, 79, 4, WOODL); f.rect(10, 76, 79, 1, WOODH); f.rect(10, 80, 79, 1, WOODD);
    f.rect(12, 81, 75, 1, WALLD);
    // curtain rod
    f.rect(2, 9, 94, 2, WOODD); f.rect(1, 8, 3, 4, WOOD); f.rect(94, 8, 3, 4, WOOD);
    // picture of Mikan above the sofa
    const PX = 206, PY = 20;
    f.line(PX + 12, PY - 5, PX + 4, PY, '#8a6a5a'); f.line(PX + 12, PY - 5, PX + 20, PY, '#8a6a5a'); f.set(PX + 12, PY - 6, '#6b412c');
    f.rect(PX, PY, 25, 26, WOOD); f.rect(PX, PY, 25, 1, WOODH); f.rect(PX + 2, PY + 2, 21, 22, '#fff3e0');
    f.rect(PX + 3, PY + 3, 19, 20, '#9fd6f2'); f.rect(PX + 3, PY + 17, 19, 6, '#a8d48a');
    f.rect(PX, PY + 25, 25, 1, WOODD);
    f.rect(PX + 25, PY + 1, 1, 26, WALLD); f.rect(PX + 1, PY + 26, 25, 1, WALLD);
    head(f, PX + 12, PY + 14, { eyes: 'happy', mouth: 'cat' });
    // small ♥ corner doodle
    f.set(PX + 19, PY + 5, '#f26d8a'); f.set(PX + 21, PY + 5, '#f26d8a'); f.rect(PX + 19, PY + 6, 3, 1, '#f26d8a'); f.set(PX + 20, PY + 7, '#f26d8a');
    // baseboard
    f.rect(0, 90, 256, 6, WOOD); f.rect(0, 90, 256, 1, WOODL);
    bg += svg(f);
  }
  // TV board + retro TV + plant
  {
    const t = new Canvas(256, 144);
    t.rect(94, 80, 56, 18, WOOD); t.rect(94, 80, 56, 2, WOODL); t.rect(94, 80, 56, 1, WOODH);
    t.rect(96, 84, 25, 11, WOODD); t.rect(123, 84, 25, 11, WOODD); t.rect(97, 85, 23, 9, WOOD); t.rect(124, 85, 23, 9, WOOD);
    t.rect(107, 88, 3, 1, '#e8cf98'); t.rect(134, 88, 3, 1, '#e8cf98');
    t.rect(96, 98, 3, 2, WOODD); t.rect(145, 98, 3, 2, WOODD);
    // TV
    t.rect(103, 55, 36, 25, '#e0cfa9'); t.rect(103, 55, 36, 1, '#f3e6c6'); t.rect(103, 79, 36, 1, '#b9a47c');
    t.rect(106, 58, 24, 18, '#2f3b46'); t.rect(107, 59, 22, 16, '#3b4a57');
    t.line(109, 72, 121, 60, '#556a78'); t.line(111, 73, 124, 60, '#4a5c69'); t.line(118, 73, 128, 63, '#4a5c69');
    t.rect(132, 59, 4, 4, '#b9a47c'); t.rect(133, 60, 2, 2, '#5c4a3a'); t.rect(132, 65, 4, 4, '#b9a47c'); t.rect(133, 66, 2, 2, '#5c4a3a');
    for (let y = 71; y < 77; y += 2) t.rect(132, y, 4, 1, '#b9a47c');
    t.rect(105, 80, 4, 1, '#5c4a3a'); t.rect(133, 80, 4, 1, '#5c4a3a');
    t.line(118, 55, 111, 42, '#5c4a3a'); t.line(122, 55, 131, 44, '#5c4a3a'); t.rect(116, 53, 8, 2, '#5c4a3a');
    t.set(111, 41, '#e84a5f'); t.set(131, 43, '#e84a5f');
    // pothos on the board
    t.rect(140, 72, 8, 8, '#c2552a'); t.rect(140, 72, 8, 1, '#e07a44'); t.rect(141, 79, 6, 1, '#8e3a1f');
    [[141, 70], [144, 68], [147, 70], [139, 74], [149, 75], [150, 80], [151, 84], [138, 78]].forEach(([x, y], i) => { t.rect(x, y, 3, 2, i % 2 ? '#5fae5a' : '#3f7d4a'); t.set(x, y, '#8cc36a'); });
    // books
    t.rect(96, 72, 3, 8, '#5f7fb0'); t.rect(99, 73, 3, 7, '#e8b04a'); t.rect(102, 75, 2, 5, '#c2552a');
    t.outline(K);
    bg += svg(t);
  }
  // sofa (continues off the right edge)
  {
    const s = new Canvas(256, 144);
    s.ellipse(172, 76, 7, 7, TEAL); s.rect(165, 76, 14, 24, TEAL);
    s.rect(176, 58, 82, 28, TEAL); s.rect(176, 58, 82, 3, TEALL); s.rect(176, 58, 82, 1, TEALH);
    s.rect(178, 82, 80, 7, TEALL); s.rect(178, 82, 80, 1, TEALH);
    s.rect(178, 89, 80, 8, TEAL); s.rect(178, 96, 80, 3, TEALD);
    s.rect(165, 94, 14, 5, TEALD); s.rect(166, 70, 12, 2, TEALL); s.rect(166, 70, 12, 1, TEALH);
    s.rect(168, 99, 3, 3, WOODD); s.rect(182, 99, 3, 3, WOODD); s.rect(250, 99, 3, 3, WOODD);
    s.outline(K);
    s.rect(217, 82, 1, 15, TEALD); s.rect(178, 81, 80, 1, TEALD);
    [[196, 68], [216, 68], [236, 68]].forEach(([x, y]) => { s.set(x, y, TEALD); s.set(x + 1, y + 1, TEALD); });
    // mustard pillow
    const pl = new Canvas(256, 144);
    pl.poly([[181, 72], [192, 62], [203, 70], [194, 82]], (x, y) => (x + y > 270 ? '#c98a2a' : '#e8b04a'));
    pl.outline(K); pl.set(192, 71, '#c98a2a'); pl.set(193, 72, '#c98a2a');
    cat.over(s, pl);
    // shadow under the sofa
    s.rect(164, 100, 92, 2, '#7a4a30');
    bg += svg(s);
  }
  // floor planks
  {
    const f = new Canvas(256, 48);
    const ys = [0, 3, 7, 12, 18, 25, 33, 42, 48];
    const R = C.rng(7);
    for (let i = 0; i < ys.length - 1; i++) {
      const a = ys[i], h = ys[i + 1] - ys[i];
      f.rect(0, a, 256, h, i % 2 ? '#b27849' : '#bb8251');
      f.rect(0, a, 256, 1, '#8f5c3a');
      let x = fl(R() * 30);
      while (x < 256) { f.rect(x, a + 1, 1, h - 1, '#8f5c3a'); f.rect(x + 1, a + 1, 1, h - 1, '#c9925e'); x += 34 + fl(R() * 30); }
    }
    f.rect(0, 0, 256, 2, '#7a4a30');
    bg += svg(f, 0, 96);
  }
  // rug (dusty blue, cream border)
  {
    const g = new Canvas(256, 144);
    const trap = (i) => [[24 + i * 3, 105 + i], [232 - i * 3, 105 + i], [250 - i * 3, 139 - i], [6 + i * 3, 139 - i]];
    g.poly(trap(0), '#efe0c0');
    g.poly(trap(2), '#c05a4a');
    g.poly(trap(3), '#efe0c0');
    g.poly(trap(4), (x, y) => ((y % 6 === 2 && (x + (y % 12 === 2 ? 0 : 6)) % 12 === 0) ? '#e8d8b0' : ((y % 6 === 3 || y % 6 === 1) && (x + (y % 12 < 6 ? 0 : 6)) % 12 === 0) ? '#6a8398' : '#7f9bb0'));
    for (let x = 8; x < 250; x += 3) g.set(x, 139, '#e3cfa8');
    g.rect(8, 140, 242, 1, '#7a4a30');
    bg += svg(g);
  }
  add(`<rect width="256" height="144" fill="${WALL}"/>` + bg);

  // curtains (gentle sway)
  const curtain = (id, x, sw, flipC) => lazy(id, () => {
    const cv = new Canvas(18, 80);
    const pts = flipC
      ? [[1, 0], [15, 0], [14, 44], [15 + sw, 78], [4 + sw, 78], [8, 46]]
      : [[1, 0], [15, 0], [9, 46], [12 + sw, 78], [1 + sw, 78], [2, 44]];
    cv.poly(pts, (xx, yy) => ((xx + (yy > 46 ? sw : 0)) % 4 === 0 ? '#c8664f' : (xx + (yy > 46 ? sw : 0)) % 4 === 1 ? '#f7a58a' : '#e98a6a'));
    cv.outline(K);
    const ty = 45; for (let xx = 0; xx < 18; xx++) if (cv.get(xx, ty) && cv.get(xx, ty) !== K) { cv.set(xx, ty, '#ffcf7a'); cv.set(xx, ty + 1, '#c98a2a'); }
    return cv;
  });
  add(C.flipbook([curtain('s4_cl0', 0, 0, false), curtain('s4_cl1', 0, 1, false)], 0.7, 3, 10));
  add(C.flipbook([curtain('s4_cr0', 0, 0, true), curtain('s4_cr1', 0, -1, true)], 0.7, 80, 10));

  // hanging lamp (sways after impacts)
  const LAMP = [-1, 0, 1].map((dx, i) => {
    const cv = new Canvas(24, 40);
    cv.line(12, 0, 12 + dx, 26, '#3a2a2a');
    const L = new Canvas(24, 40);
    L.ellipse(12 + dx, 32, 9, 6, (x, y) => (y > 32 ? null : x < 9 + dx ? '#5fae5a' : '#3f7d4a'));
    L.rect(9 + dx, 25, 6, 2, '#2e5a3a');
    L.outline(K);
    cat.over(cv, L);
    cv.rect(4 + dx, 33, 17, 1, '#2e5a3a'); cv.rect(10 + dx, 34, 5, 2, '#ffe9b8'); cv.set(10 + dx, 34, '#ffffff');
    return reg('s4_lamp' + i, cv);
  });
  const lampK = [[t0, 1], [33.05, 2], [33.15, 0], [33.3, 1], [35.6, 2], [35.72, 0], [35.85, 2], [36.0, 0], [36.15, 1], [37.5, 0], [37.62, 2], [37.75, 1]];
  add(C.act({ t0, t1, fps: 12, pose: t => LAMP[C.pick(t, lampK)], pos: () => [158, 0] }));

  // low table in front of the sofa: tea + a bowl of mikans
  {
    const tb = new Canvas(256, 144);
    tb.rect(142, 95, 48, 3, WOODL); tb.rect(142, 95, 48, 1, WOODH); tb.rect(142, 98, 48, 2, WOOD);
    tb.rect(145, 100, 3, 9, WOODD); tb.rect(184, 100, 3, 9, WOODD);
    [[151, 89], [155, 88], [159, 89]].forEach(([x, y]) => { tb.circle(x + .5, y + .5, 2.4, '#f28a2e'); tb.set(x - 1, y - 1, '#ffb45a'); });
    tb.poly([[148, 91], [163, 91], [161, 95], [150, 95]], '#3d3a78'); tb.rect(148, 91, 15, 1, '#5a58a0'); tb.rect(152, 93, 7, 1, '#e8cf98');
    tb.rect(175, 89, 5, 6, '#7aa0b8'); tb.rect(175, 89, 5, 1, '#a8c8da'); tb.rect(176, 91, 3, 1, '#5a7e98');
    tb.outline(K);
    tb.set(155, 85, '#3f7d4a'); tb.set(156, 85, '#5fae5a'); tb.set(159, 86, '#5fae5a');
    add(svg(tb));
    const steam = [0, 1, 2].map(f => {
      const cv = new Canvas(6, 9);
      [[2, 8], [3, 7], [3, 6], [2, 5], [2, 4], [3, 3], [3, 2], [2, 1]].forEach(([x, y], i) => { if ((i + f) % 3) cv.set(x + (f === 1 && y < 5 ? 1 : 0), y, '#fff8ec'); });
      return reg('s4_steam' + f, cv);
    });
    add(`<g opacity=".8">${C.flipbook(steam, 4, 174, 79)}</g>`);
  }

  // ================================================================== LIGHT (window -> floor)
  {
    const lp = new Canvas(256, 144);
    const proj = (wx, wy) => [wx + 8 + (73 - wy) * 1.1, 97 + (73 - wy) * 0.8];
    [[18, 47, 17, 43], [51, 81, 17, 43], [18, 47, 46, 73], [51, 81, 46, 73]].forEach(([x0, x1, y0, y1]) => {
      lp.poly([proj(x0, y1), proj(x1, y1), proj(x1, y0), proj(x0, y0)], LIGHT);
    });
    add(`<g opacity=".38">${C.tween('opacity', [[t0, .34], [t1, .48]])}${svg(lp)}</g>`);
    const beam = new Canvas(256, 144);
    beam.poly([[18, 17], [81, 17], [150, 141], [87, 141], [26, 97], [18, 73]], '#fff4c8');
    add(`<g opacity=".12">${C.tween('opacity', [[t0, .1], [t1, .16]])}${svg(beam)}</g>`);
    // dust motes drifting in the beam
    const R = C.rng(44);
    for (let i = 0; i < 12; i++) {
      const bx = 34 + R() * 70, by = 28 + R() * 80, ph = R() * 6, sp = .6 + R() * .6;
      const clampIn = (x, y) => [x + (y - 17) * 0.55 * (bx > 60 ? .6 : .3), y];
      const tw = C.sample(t0, t1, 3, t => (Math.sin(t * 2 + ph) > -.3 ? 1 : 0.3));
      add(`<g>${C.move(t0, t1, 3, t => clampIn(bx + Math.sin(t * .7 + ph) * 3, by - ((t - t0) * sp * 2 + ph * 3) % 60))}<rect width="1" height="1" fill="#fffbe8">${C.steps('opacity', tw)}</rect></g>`);
    }
  }

  // ================================================================== CHOREOGRAPHY
  const tailSw = t => [10, 22, 34, 22][fl(t * 4) % 4];
  const BX = 202, BY = G - 34;
  const PEEK = [[35.6, 110], [36.2, 110], [36.21, 104], [36.3, 98], [36.52, 98], [36.62, 92], [37.28, 92], [37.4, 98], [37.49, 98], [37.5, 88], [37.55, 81], [37.64, 84], [38.18, 84], [38.3, 92], [38.5, 92], [38.6, 98]];
  const PEYES = [[35.6, 'open'], [36.66, 'closed'], [36.74, 'open'], [36.84, 'look'], [37.08, 'lookL'], [37.3, 'open'], [37.5, 'wide'], [38.18, 'happy'], [38.62, 'open'], [38.76, 'closed'], [38.84, 'open']];
  function catS(t) {
    const S = (params, x, y, o = {}) => ({ id: cs(params, o.post, o.tag || ''), x, y, f: !!o.f, sh: o.sh });
    if (t < 29.95) { const f = fl(t * 5) % 2; return S({ pose: 'sit', paw: 2 + f, mouth: 'tongue', eyes: 'closed', headDY: 1, tail: f ? 14 : 26 }, 28, CY, { sh: 0 }); }
    if (t < 30.3) return S({ pose: 'sit', eyes: (t > 30.05 && t < 30.14) ? 'closed' : 'open', tail: tailSw(t) }, 28, CY, { sh: 0 });
    if (t < 30.62) return S({ pose: 'sit', eyes: 'look', headTilt: 1, tail: 40 }, 28, CY, { sh: 0 });
    if (t < 31.0) return S({ pose: 'sit', eyes: 'wide', mouth: 'none', tail: 85, curl: 30, headDY: t > 30.82 ? 1 : 0 }, 28, CY, { sh: 0 });
    if (t < 32.2) {
      const i = fl((t - 31) * (t < 31.7 ? 7 : 12)) % 4, n = [0, 1, 2, 1][i];
      return S({ pose: 'crouch', eyes: 'wide', mouth: 'none', tail: [35, 55, 75, 55][i], curl: [-40, 0, 40, 0][i] }, 28, CY, { post: stalk(n + 1, 2), tag: 'k' + n, sh: 0 });
    }
    if (t < 32.4) return S({ pose: 'crouch', eyes: 'wide', mouth: 'none', tail: 25, curl: -10 }, 27, CY, { post: stalk(3, 3), tag: 'k9', sh: 0 });
    if (t < 33.0) { const u = C.inv(32.4, 33.0, t); return S({ pose: 'leap', eyes: 'wide', mouth: 'open', tail: u < .5 ? 5 : 25, curl: -20 }, rr(C.lerp(28, 122, u)), rr(107 + C.hop(u, 30)), { sh: 1 }); }
    if (t < 33.2) return S({ pose: 'eat', eyes: 'happy', tail: 95, curl: 40 }, 124, CY, { sh: 0 });
    if (t < 34.4) {
      const u = C.inv(33.2, 34.4, t), f = fl((t - 33.2) * 10) % 4;
      return { id: TAN[f], x: rr(C.lerp(126, 160, C.easeOut(u))), y: G - 34 - rr(Math.abs(Math.sin(u * Math.PI * 3)) * 3), f: false, sh: 0 };
    }
    if (t < 35.0) { const w = [0, 1, 0, -1][fl(t * 5) % 4]; return S({ pose: 'sit', eyes: 'closed', mouth: 'none', tail: 10, headDX: w }, 162, CY, { post: dazedPost(w), tag: 'dz' + w, sh: 0 }); }
    if (t < 35.25) return S({ pose: 'sit', eyes: 'wide', mouth: 'none', tail: 85, curl: 30, headDY: -1 }, 162, CY, { sh: 0 });
    if (t < 35.36) return S({ pose: 'crouch', eyes: 'wide', mouth: 'none', tail: 40, curl: -10 }, 163, CY, { post: rearUp(1), tag: 'r1', sh: 0 });
    if (t < 35.6) {
      const u = C.inv(35.36, 35.6, t), x = rr(C.lerp(164, 206, u));
      if (u < .5) return S({ pose: 'leap', eyes: 'wide', mouth: 'none', tail: 20, curl: 20 }, x, rr(C.lerp(107, 108, u) + C.hop(u, 34)), { sh: 1 });
      return S({ pose: 'loaf', eyes: 'happy', tail: 60, curl: 40 }, x - 3, rr(C.lerp(100, 101, u) + C.hop(u, 34)), { sh: 1 });
    }
    const y = rr(C.key(t, PEEK, u => u));
    if (y >= 104) return { id: null, x: 0, y: 0 };
    const eyes = C.pick(t, PEYES), flip = eyes === 'lookL', pop = t >= 37.5 && t < 38.18;
    return S({ pose: 'sit', eyes: flip ? 'look' : eyes, mouth: pop ? 'open' : 'cat', tail: 10, headTilt: (t > 38.7 && t < 38.82) ? 1 : 0 }, BX + (flip ? 10 : 4), y, { f: flip });
  }

  // yarn ball
  function ballS(t) {
    if (t < 30.2) return null;
    if (t < 31.0) { const u = C.inv(30.2, 31.0, t), x = C.lerp(258, 150, C.easeOut(u)); return { x, y: G - 13 + (u < .3 ? rr(C.hop(u / .3, 4)) : 0) }; }
    if (t < 31.8) return { x: 150, y: G - 13 };
    if (t < 33.2) return { x: t < 31.9 ? 152 : 154, y: G - 13 + (t >= 33.0 && fl(t * 24) % 2 ? 1 : 0) };
    if (t < 34.4) return null;
    if (t < 34.7) { const u = C.inv(34.4, 34.7, t); return { x: C.lerp(174, 140, u), y: G - 13 + rr(C.hop(u, 10)) }; }
    return { x: 140, y: G - 13 };
  }
  const ballF = b => ((fl((258 - b.x) / 3) % 4) + 4) % 4;
  // string (left end follows ball / furball)
  add(C.act({
    t0, t1, fps: 12,
    pose: t => { const b = ballS(t); if (!b && !(t >= 33.2 && t < 34.4)) return null; if (t < 31.0) return STR[fl(t * 10) % 3]; if (t >= 31.8 && t < 31.95) return STR[1 + fl(t * 20) % 2]; if (t >= 33.2 && t < 34.7) return STR[fl(t * 8) % 3]; return STR[0]; },
    pos: t => { if (t >= 33.2 && t < 34.4) { const c = catS(t); return [c.x + 18, G - 6]; } const b = ballS(t) || { x: 0 }; return [rr(b.x) + 9, G - 6]; },
  }));
  add(C.act({ t0, t1, fps: 12, pose: t => { const b = ballS(t); return b ? BALL[ballF(b)] : null; }, pos: t => { const b = ballS(t) || { x: 0, y: 0 }; return [rr(b.x), b.y]; } }));

  // cat shadow
  add(`<g opacity=".28">${C.act({
    t0, t1, fps: 12,
    pose: t => { if (t >= 35.6) return null; const c = catS(t); return c.sh === undefined ? null : SH[c.sh]; },
    pos: t => { const c = catS(t); return c.sh === 1 ? [c.x + 10, G - 2] : [c.x + (t >= 33.2 && t < 34.4 ? 5 : 3), G - 2]; },
  })}</g>`);

  // box: states
  const boxX = t => (t < 35.0 ? rr(C.lerp(266, BX, C.easeOut(C.inv(34.7, 35.0, t)))) : BX);
  const BOXK = [[34.7, 'sl'], [34.98, 'r2'], [35.06, 'l2'], [35.14, 'n'], [35.6, 'sq'], [35.7, 'st'], [35.8, 'n'], [35.9, 'r'], [36.0, 'l2'], [36.1, 'n'],
    [36.21, 'r2'], [36.3, 'l2'], [36.38, 'n'], [36.84, 'r2'], [36.92, 'n'], [37.08, 'l2'], [37.16, 'n'], [37.5, 'st'], [37.58, 'r'], [37.66, 'l'], [37.74, 'r2'], [37.82, 'n'],
    [38.3, 'sq'], [38.38, 'n'], [38.6, 'l2'], [38.68, 'r2'], [38.76, 'n']];
  const boxV = t => (t < 34.7 ? null : C.pick(t, BOXK));
  const boxPos = t => [boxX(t) - BOX.OX, BY - BOX.OY];
  add(C.act({ t0, t1, fps: 12, pose: t => { const v = boxV(t); return v ? boxId(v, 'b') : null; }, pos: boxPos }));
  add(`<g opacity=".28">${C.act({ t0, t1, fps: 12, pose: t => (t < 34.7 ? null : SH[0]), pos: t => [boxX(t) + 9, G - 2] })}<g transform="translate(-9 0)"></g></g>`);
  // the cat
  add(C.act({ t0, t1, fps: 12, pose: t => catS(t).id, pos: t => { const c = catS(t); return [c.x, c.y]; }, flip: t => catS(t).f }));
  // tail tip poking out after the dive
  add(C.act({ t0: 35.84, t1: 36.18, fps: 12, pose: t => TAILP[[1, 0, 1, 2][fl((t - 35.84) * 12) % 4]], pos: t => [BX + 13, BY + (t < 35.92 || t > 36.1 ? 0 : -6)] }));
  add(C.act({ t0, t1, fps: 12, pose: t => { const v = boxV(t); return v ? boxId(v, 'f') : null; }, pos: boxPos }));
  add(C.act({ t0: 37.5, t1: 38.18, fps: 12, pose: () => PAWS, pos: t => [BX + 21, BY + 7 + (t < 37.55 ? 1 : 0)] }));

  // ================================================================== FX
  const fx = (a, b, pose, pos) => add(C.act({ t0: a, t1: b, fps: 12, pose, pos }));
  // yarn arrives: cat perks (tiny sparkle)
  fx(30.62, 30.9, t => SPK[fl(t * 12) % 2], () => [46, 96]);
  // motion lines during the pounce
  fx(32.42, 33.0, t => ML[fl(t * 12) % 2], t => { const c = catS(t); return [c.x - 13, c.y + 8]; });
  // takeoff dust
  fx(32.4, 32.72, t => DUST[Math.min(2, fl((t - 32.4) * 10))], t => [22 - fl((t - 32.4) * 20), G - 9]);
  // impact on the yarn
  fx(33.0, 33.2, t => (fl(t * 16) % 2 ? BURST : null) || BURST, () => [150, 104]);
  // tumble stars + sweat
  fx(33.2, 34.4, t => TFX[fl(t * 8) % 4], t => { const c = catS(t); return [c.x - 10, c.y - 6]; });
  fx(33.3, 34.4, t => DUST[fl(t * 10) % 3], t => { const c = catS(t); return [c.x - 4, G - 9]; });
  // dizzy orbit
  fx(34.4, 35.0, t => DZ[fl(t * 10) % 6], () => [162 + 21 - 13, CY - 7]);
  // snap out of it: box!
  fx(35.0, 35.25, t => SPK[fl(t * 12) % 2], () => [190, 96]);
  // box slides in, stops
  fx(34.98, 35.3, t => DUST[Math.min(2, fl((t - 34.98) * 10))], t => [BX - 14 - fl((t - 34.98) * 12), G - 9]);
  // THUD dust both sides
  fx(35.6, 36.0, t => DUST[Math.min(2, fl((t - 35.6) * 8))], t => [BX - 16 - fl((t - 35.6) * 20), G - 9]);
  add(`<g transform="translate(${2 * BX + 44} 0) scale(-1 1)">${C.act({ t0: 35.6, t1: 36.0, fps: 12, pose: t => DUST[Math.min(2, fl((t - 35.6) * 8))], pos: t => [BX - 16 - fl((t - 35.6) * 20), G - 9] })}</g>`);
  // "!" pop
  fx(37.5, 38.18, t => BUB[t < 37.58 ? 0 : 1], t => (t < 37.58 ? [236, 64] : [234, 57]));
  fx(37.5, 37.8, t => (fl(t * 12) % 2 ? TICK : null), () => [210, 80]);
  // happy heart floats up from the box
  fx(38.25, 38.9, () => HEART, t => [240 + [0, 1, 0, -1][fl(t * 8) % 4], rr(88 - (t - 38.25) * 22)]);

  // warm afternoon grade (deepens slowly toward 16:30)
  add(`<rect width="256" height="144" fill="#ff9a3a" opacity="0">${C.tween('opacity', [[t0, .03], [t1, .09]])}</rect>`);
  return out.join('');
};
