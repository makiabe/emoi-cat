// S1 DAWN — Mikan's bedroom, 06:00 -> 07:10. Global t 0..10.
// Cold blue pre-dawn room warms to gold; sun rises in the window; a golden beam with dust motes
// slides across the room and reaches Mikan's face (5.5); ear twitch (6.2); eyes open (6.8);
// big stretch 7.2-8.6 with yawn at 7.6; hop off the bed at 8.8 and trot off right.
'use strict';

module.exports = ({ t0, t1, C, cat }) => {
  const { Canvas } = C;
  const P = cat.PAL;
  const K = '#2b1d2e';
  const out = [];

  // ------------------------------------------------------------------ geometry
  const GX0 = 20, GY0 = 18, GX1 = 64, GY1 = 56;      // window glass (exclusive end)
  const WALL_Y = 102;                                 // wall/floor line
  const CAT_X = 158, CAT_Y = 69;                      // sleeping sprite top-left (feet row y=96)
  const FACE = [CAT_X + 23, CAT_Y + 20];              // (181, 89)

  // small canvas helper: draw into a layer, outline it, composite onto dst
  const obj = (dst, fn, outline = K) => { const L = new Canvas(C.W, C.H); fn(L); if (outline) L.outline(outline); cat.over(dst, L); return L; };

  // ================================================================== SKY (inside glass)
  const clip = 's1_glass';
  C.def(`<clipPath id="${clip}"><rect x="${GX0}" y="${GY0}" width="${GX1 - GX0}" height="${GY1 - GY0}"/></clipPath>`);
  const gw = GX1 - GX0, gh = GY1 - GY0;
  const skies = [
    [0, [[GY0, '#120f2c'], [40, '#1f1c48'], [GY1, '#2e2a64']]],
    [[1.2, 3.2], [[GY0, '#1b1840'], [32, '#2f2b66'], [44, '#6a3f8a'], [GY1, '#d9607a']]],
    [[3.4, 5.6], [[GY0, '#34357a'], [28, '#7a5aa6'], [40, '#f2857a'], [50, '#ffc48a'], [GY1, '#ffe2a8']]],
    [[6.0, 8.8], [[GY0, '#5fb0ee'], [34, '#8fd3ff'], [48, '#ffe9c8'], [GY1, '#fff3d6']]],
  ];
  let sky = '';
  skies.forEach(([tw, stops], i) => {
    const g = C.ditherGradient(GX0, GY0, gw, gh, stops);
    if (!i) sky += g;
    else sky += `<g opacity="0">${g}${C.tween('opacity', [[tw[0], 0], [tw[1], 1]])}</g>`;
  });
  // stars (twinkle, fade out with the dawn)
  {
    const R = C.rng(7); let st = '';
    for (let i = 0; i < 11; i++) {
      const x = GX0 + 2 + Math.floor(R() * (gw - 4)), y = GY0 + 1 + Math.floor(R() * 22);
      const per = (1.1 + R() * 1.4).toFixed(2);
      st += `<rect x="${x}" y="${y}" width="1" height="1" fill="${i % 3 ? '#cfd6ff' : '#fff6c8'}"><animate attributeName="opacity" values="1;.3;1;1" dur="${per}s" repeatCount="indefinite" calcMode="discrete"/></rect>`;
    }
    // one bigger star (plus shape)
    st += `<path fill="#fff6c8" d="M30 23h1v1h-1zM29 24h3v1h-3zM30 25h1v1h-1z"/>`;
    sky += `<g>${st}${C.tween('opacity', [[0, 1], [2.4, 0.8], [4.2, 0]])}</g>`;
  }
  // moon (thin crescent, top-right of glass), fades
  sky += `<g>${C.artPaths(`
    .##.
    ##..
    #...
    ##..
    .##.`, { '#': '#f4efc4' }, 56, 21)}${C.tween('opacity', [[0, 1], [3, 0.7], [5, 0]])}</g>`;
  // sun: disc + dithered halo, rises behind the town
  {
    const S = new Canvas(24, 24);
    S.circle(12, 12, 11, C.dith(null, '#ffd3a0', 5));
    S.circle(12, 12, 8.5, C.dith('#ffd3a0', '#ffe9b8', 6));
    S.circle(12, 12, 5.6, '#ffcf7a');
    S.circle(12, 12, 4.6, '#fff1a8');
    S.circle(11, 11, 2.2, '#fffbe6');
    C.spriteRaw('s1_sun', S.toSVG(), 24, 24);
    const sunPos = t => [C.lerp(28, 34, C.inv(1.5, 10, t)), C.key(t, [[1.5, 52], [4, 40], [6, 30], [10, 12]], u => u)];
    sky += `<g>${C.move(0, 10, 5, sunPos)}${C.use('s1_sun', 0, 0)}</g>`;
  }
  // birds crossing the sky
  {
    C.sprite('s1_bird0', `
      #...#
      .#.#.`, { '#': '#3a3150' });
    C.sprite('s1_bird1', `
      .....
      ##.##
      ..#..`, { '#': '#3a3150' });
    [[6.6, 9.6, 30, 0], [7.0, 9.8, 26, 0.13]].forEach(([a, b, y, ph], i) => {
      sky += C.act({ t0: a, t1: b, fps: 8,
        pose: t => (Math.floor(t * 8 + i) % 2 ? 's1_bird1' : 's1_bird0'),
        pos: t => [C.lerp(GX0 - 6, GX1 + 2, C.inv(a, b, t)), y + Math.sin(t * 3 + ph * 20) * 1.5 - C.inv(a, b, t) * 5] });
    });
  }
  // distant town + hill silhouettes (night version, day version crossfades in)
  const town = col => {
    const L = new Canvas(C.W, C.H);
    L.ellipse(28, 60, 22, 10, col[0]); L.ellipse(58, 62, 18, 12, col[0]);
    const R = C.rng(3);
    let x = GX0;
    while (x < GX1) {
      const w = 5 + Math.floor(R() * 5), h = 4 + Math.floor(R() * 6);
      L.rect(x, GY1 - h, w, h, col[1]);
      L.poly([[x - 1, GY1 - h], [x + w / 2, GY1 - h - 3], [x + w + 1, GY1 - h]], col[1]);
      if (R() < .45) L.set(x + 2, GY1 - h + 2, col[2]);
      x += w + 1 + Math.floor(R() * 2);
    }
    L.rect(44, GY1 - 17, 1, 17, col[1]); L.rect(42, GY1 - 15, 5, 1, col[1]); // utility pole
    return L.toSVG();
  };
  sky += town(['#2a2550', '#1b1733', '#ffcf7a']);
  sky += `<g opacity="0">${town(['#8a7fb8', '#6a5f9a', '#fff3c0'])}${C.tween('opacity', [[4, 0], [8, 1]])}</g>`;
  out.push(`<g clip-path="url(#${clip})">${sky}</g>`);

  // ================================================================== WALL
  C.def(`<pattern id="s1_wp" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#ead3ae"/>${C.artPaths(`
    ss......ss......
    ss......ss......
    ss..f...ss......
    ss.fcf..ss......
    ss..f...ss......
    ss..l...ss......
    ss......ss......
    ss......ss......
    ss......ss......
    ss......ss......
    ss......ss..f...
    ss......ss.fcf..
    ss......ss..f...
    ss......ss..l...
    ss......ss......
    ss......ss......`, { s: '#e1c69e', f: '#e39a8c', c: '#f7d38a', l: '#9cbf86' })}</pattern>`);
  out.push(`<path fill-rule="evenodd" fill="url(#s1_wp)" d="M0 0h256v${WALL_Y}h-256zM${GX0} ${GY0}v${gh}h${gw}v-${gh}z"/>`);

  // ================================================================== ROOM RASTER
  const R = new Canvas(C.W, C.H);
  // crown moulding
  R.rect(0, 0, 256, 3, '#b07a4f'); R.rect(0, 3, 256, 1, '#6b412c'); R.rect(0, 0, 256, 1, '#d09a68');
  // wainscot rail + baseboard
  R.rect(0, 80, 256, 2, '#c9a27a'); R.rect(0, 82, 256, 1, '#a07a58');
  C.def(`<pattern id="s1_wn" width="12" height="15" patternUnits="userSpaceOnUse"><rect width="12" height="15" fill="#dcbf98"/><rect width="1" height="15" fill="#cfae88"/><rect x="1" width="1" height="15" fill="#e8cfae"/></pattern>`);
  R.rect(0, 97, 256, 5, '#8a5a3c'); R.rect(0, 97, 256, 1, '#b07a4f'); R.rect(0, 101, 256, 1, '#5a3424');
  // floor planks (perspective rows)
  const rows = [102, 106, 111, 117, 124, 132, 144];
  for (let i = 0; i < rows.length - 1; i++) {
    const ya = rows[i], yb = rows[i + 1], seg = 34 + i * 10, off = (i * 23) % seg;
    for (let y = ya; y < yb; y++) for (let x = 0; x < 256; x++) {
      let c = (y === ya) ? '#5a3424' : (y === ya + 1 ? '#b07a4f' : ((i + Math.floor((x + off) / seg)) % 2 ? '#94603f' : '#8a5a3c'));
      if ((x + off) % seg === 0 && y > ya) c = '#5a3424';
      R.set(x, y, c);
    }
  }

  // --- window frame, sill
  obj(R, L => {
    L.rect(15, 13, 54, 48, '#f3e3c8');
    L.rect(GX0, GY0, gw, gh, null);
  });
  for (let y = GY0; y < GY1; y++) for (let x = GX0; x < GX1; x++) R.px[y * 256 + x] = null;
  R.rect(16, 14, 52, 1, '#fff6e6'); R.rect(16, 59, 52, 1, '#d8c2a0'); R.rect(67, 14, 1, 46, '#d8c2a0');
  R.rect(GX0 - 1, GY0 - 1, gw + 2, 1, '#c9b08c'); R.rect(GX0 - 1, GY0 - 1, 1, gh + 1, '#c9b08c');
  // muntins
  obj(R, L => { L.rect(41, GY0, 2, gh, '#f3e3c8'); L.rect(GX0, 36, gw, 2, '#f3e3c8'); }, null);
  R.rect(43, GY0, 1, gh, '#d8c2a0'); R.rect(GX0, 38, gw, 1, '#d8c2a0');
  obj(R, L => { L.rect(11, 60, 62, 4, '#f3e3c8'); L.rect(11, 60, 62, 1, '#fffaf0'); L.rect(12, 63, 60, 1, '#d8c2a0'); });
  // --- curtains (outside the glass)
  const curtain = (L, x0, x1, tieY, side) => {
    for (let y = 10; y < 72; y++) {
      const pinch = y > tieY - 6 && y < tieY + 6 ? 1 - Math.abs(y - tieY) / 6 : 0;
      const a = side < 0 ? x0 : x0 + Math.round(pinch * 3), b = side < 0 ? x1 - Math.round(pinch * 3) : x1;
      for (let x = a; x < b; x++) {
        const f = (x - a) % 4;
        L.set(x, y, f === 0 ? '#b0606a' : f === 1 ? '#d98a8a' : f === 2 ? '#f2b0a8' : '#d98a8a');
      }
      if (y >= 69) for (let x = a; x < b; x++) if ((x + y) % 2) L.set(x, y, '#b0606a');
    }
    L.rect(x0 + (side < 0 ? 1 : 3), tieY - 1, x1 - x0 - 4, 2, '#ffd08c');
  };
  obj(R, L => curtain(L, 5, 19, 44, -1));
  obj(R, L => curtain(L, 65, 79, 44, 1));
  // valance + rod
  obj(R, L => {
    L.rect(4, 9, 77, 2, '#8a5a3c'); L.rect(2, 8, 3, 4, '#ffcf7a'); L.rect(80, 8, 3, 4, '#ffcf7a');
  });
  obj(R, L => {
    for (let x = 6; x < 79; x++) { const h = 5 + (Math.floor((x - 6) / 6) % 2 ? 0 : 1); for (let y = 11; y < 11 + h; y++) L.set(x, y, y === 11 ? '#f2b0a8' : (x % 6 === 0 ? '#b0606a' : '#d98a8a')); }
  });

  // --- plant under the window
  obj(R, L => {
    L.poly([[23, 88], [41, 88], [39, 101], [25, 101]], (x, y) => (y < 91 ? '#e0845a' : x > 35 ? '#a8563a' : '#c96a44'));
    L.rect(22, 87, 20, 2, '#e8946a');
  });
  obj(R, L => {
    const leaf = (cx, cy, rx, ry, a) => {
      for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1) continue;
        const xx = cx + x * Math.cos(a) - y * Math.sin(a), yy = cy + x * Math.sin(a) + y * Math.cos(a);
        L.set(xx, yy, y < 0 ? '#7cc46a' : y === 0 ? '#3f7d4a' : '#5fae5a');
      }
    };
    leaf(26, 80, 7, 2.5, -2.2); leaf(38, 79, 7, 2.5, -0.9); leaf(32, 73, 7, 2.6, -1.57);
    leaf(24, 84, 6, 2, -2.8); leaf(40, 84, 6, 2, -0.3); leaf(28, 70, 5, 2, -2.0); leaf(36, 69, 5, 2, -1.1);
  });

  // --- bookshelf
  obj(R, L => {
    L.rect(84, 42, 34, 60, '#8a5a3c');
    L.rect(86, 44, 30, 56, '#5a3424');
    [58, 72, 86].forEach(y => { L.rect(86, y, 30, 2, '#b07a4f'); L.rect(86, y + 2, 30, 1, '#6b412c'); });
    L.rect(84, 42, 34, 1, '#b07a4f'); L.rect(84, 42, 1, 60, '#b07a4f');
  });
  {
    const Rb = C.rng(11), cols = ['#c24a5a', '#3f7d4a', '#5a78c8', '#e8b04a', '#9a4a9a', '#f7a8a0', '#5fae5a', '#e2607a', '#6fb7c0'];
    [[44, 58], [60, 72], [74, 86]].forEach(([ya, yb], si) => {
      let x = 87;
      while (x < 114) {
        const w = 2 + Math.floor(Rb() * 3), h = (yb - ya) - 3 - Math.floor(Rb() * 5);
        if (si === 1 && x > 104) break;
        const c = cols[Math.floor(Rb() * cols.length)];
        const lean = si === 2 && x > 106 && x < 110;
        R.rect(x, yb - h, w, h, c); R.rect(x, yb - h, w, 1, '#fff3e0');
        if (h > 7) R.rect(x, yb - h + 3, w, 1, '#ffcf7a');
        R.rect(x + w - 1, yb - h + 1, 1, h - 1, K);
        x += w + (lean ? 2 : 0);
      }
    });
    // small fish-bowl globe on middle shelf, cat figurine on top
    obj(R, L => { L.circle(110, 67, 4, '#8fd3ff'); L.rect(108, 70, 5, 2, '#b07a4f'); });
    R.set(108, 65, '#fff'); R.set(111, 67, '#f2a14a'); R.set(112, 67, '#f2a14a');
    obj(R, L => { // maneki-ish figurine on top
      L.rect(90, 35, 6, 7, '#fff3e0'); L.rect(90, 33, 1, 2, '#fff3e0'); L.rect(95, 33, 1, 2, '#fff3e0');
    });
    R.set(91, 37, K); R.set(94, 37, K); R.set(92, 39, '#e2607a');
    obj(R, L => { // small pot plant on top
      L.rect(105, 37, 8, 5, '#c96a44'); L.circle(107, 33, 3, '#5fae5a'); L.circle(111, 32, 3, '#3f7d4a'); L.circle(109, 30, 2.5, '#7cc46a');
    });
  }

  // --- framed picture above the bed (fish!)
  obj(R, L => {
    L.rect(152, 22, 26, 18, '#b07a4f'); L.rect(154, 24, 22, 14, '#8fd3ff');
    L.rect(154, 34, 22, 4, '#5fb0ee');
  });
  obj(R, L => { L.ellipse(165, 30, 5, 2.6, '#f2657a'); L.poly([[169, 30], [173, 27], [173, 33]], '#f2657a'); });
  R.set(162, 29, K); R.set(166, 30, '#ff9a5a');
  R.set(158, 26, '#fff'); R.set(159, 25, '#fff');

  // --- nightstand + alarm clock + lamp
  obj(R, L => {
    L.rect(228, 82, 26, 3, '#b07a4f'); L.rect(229, 85, 24, 17, '#8a5a3c');
    L.rect(231, 88, 20, 5, '#9a6848'); L.rect(231, 95, 20, 5, '#9a6848');
    L.rect(229, 102, 3, 3, '#6b412c'); L.rect(250, 102, 3, 3, '#6b412c');
  });
  R.rect(240, 90, 2, 1, '#ffcf7a'); R.rect(240, 97, 2, 1, '#ffcf7a');
  obj(R, L => { // alarm clock
    L.circle(237, 75, 5, '#e2607a'); L.circle(233, 69, 2, '#ffcf7a'); L.circle(241, 69, 2, '#ffcf7a');
    L.rect(233, 80, 2, 2, K); L.rect(239, 80, 2, 2, K);
  });
  R.circle(237, 75, 3.4, '#fff3e0'); R.rect(237, 72, 1, 3, K); R.rect(237, 75, 1, 3, K); R.set(237, 75, '#e2607a');
  obj(R, L => { // lamp
    L.poly([[245, 60], [252, 60], [255, 70], [242, 70]], '#ffd3a0'); L.rect(248, 70, 2, 10, '#b07a4f'); L.rect(245, 80, 8, 2, '#b07a4f');
  });

  // --- rug
  obj(R, L => {
    L.ellipse(172, 128, 66, 11, '#c24a5a');
    L.ellipse(172, 128, 61, 8.5, (x, y) => (((y === 122 || y === 134) && x % 8 < 4) ? '#ffd3a0' : '#f7a8a0'));
    L.ellipse(172, 128, 40, 5, '#c24a5a');
    L.ellipse(172, 128, 36, 3.6, (x, y) => (y === 128 ? '#ffd3a0' : '#e8847e'));
  }, '#7a2a3a');

  // --- slippers & toy mouse
  obj(R, L => { L.ellipse(80, 127, 6, 2.2, '#8fb8e0'); L.ellipse(88, 131, 6, 2.2, '#8fb8e0'); });
  R.rect(78, 126, 4, 1, '#fff3e0'); R.rect(86, 130, 4, 1, '#fff3e0');
  obj(R, L => { L.ellipse(128, 134, 3.5, 2, '#b9a6d6'); L.circle(125, 132, 1, '#b9a6d6'); });
  R.set(126, 134, K); R.line(132, 134, 136, 136, '#e2607a');

  // --- BED
  // under-bed shadow
  for (let y = 112; y < 121; y++) for (let x = 124; x < 226; x++) if ((x + y) % 2 === 0 || y > 113) R.set(x, y, y < 118 ? '#3a2420' : ((x + y) % 2 ? '#5a3424' : R.get(x, y)));
  obj(R, L => { // headboard
    L.rect(212, 66, 12, 52, '#8a5a3c'); L.ellipse(218, 66, 6, 5, '#8a5a3c');
    L.rect(214, 70, 8, 30, '#6b412c'); L.rect(214, 70, 8, 1, '#5a3424');
    L.rect(212, 64, 1, 54, '#b07a4f');
    L.circle(218, 60, 2, '#b07a4f');
  });
  obj(R, L => { // footboard
    L.rect(124, 86, 8, 32, '#8a5a3c'); L.circle(128, 84, 3, '#b07a4f'); L.rect(124, 86, 1, 32, '#b07a4f');
  });
  obj(R, L => { // frame rail + mattress
    L.rect(132, 106, 80, 7, '#8a5a3c'); L.rect(132, 106, 80, 1, '#b07a4f');
    L.rect(132, 96, 80, 10, '#f3ead8');
  });
  obj(R, L => { // pillow
    L.ellipse(200, 90, 11, 6, (x, y) => (y > 92 ? '#e6d8c4' : y < 88 ? '#fffdf6' : '#f8f0e2'));
  });
  R.set(193, 87, '#e6d8c4'); R.set(207, 87, '#e6d8c4'); R.line(194, 91, 205, 91, '#efe3d0');
  obj(R, L => { // quilt: top surface + front drape with patchwork
    const qc = ['#f7a8a0', '#ffd3a0', '#9ab8e0', '#fff3e0', '#c9e0a0', '#f2b0c8'];
    for (let y = 93; y < 112; y++) {
      const wave = y > 108 ? Math.round(Math.sin(y) * 0) : 0;
      for (let x = 131; x < 206 + wave; x++) {
        let c;
        if (y < 97) c = y === 93 ? '#fff3e0' : (Math.floor(x / 8) % 2 ? '#f8d8c0' : '#f7c4b0');
        else {
          const bx = Math.floor((x - 131) / 7), by = Math.floor((y - 97) / 5);
          c = qc[(bx * 2 + by * 3 + (bx >> 1)) % qc.length];
          if ((x - 131) % 7 === 0 || (y - 97) % 5 === 0) c = '#e6cdb6';
          if (y === 97) c = '#c9887c';
        }
        if (y >= 110 && (x % 5 === 0)) continue; // scalloped hem
        L.set(x, y, c);
      }
    }
    // folded-back top edge near pillow
    L.rect(186, 93, 20, 4, '#fff3e0');
  });
  R.rect(186, 96, 20, 1, '#e6cdb6');
  out.push(`<rect x="0" y="83" width="256" height="15" fill="url(#s1_wn)"/>` + R.toSVG());

  // ================================================================== MIKAN
  const cache = {};
  let nid = 0;
  const spr = (params, post) => {
    const k = JSON.stringify(params) + (post ? post.name + (params._pk || '') : '');
    if (cache[k]) return cache[k];
    const id = `s1_c${nid++}`;
    const cv = cat.drawCat(params);
    if (post) post(cv, params);
    C.spriteRaw(id, cv.toSVG(), cat.CW, cat.CH);
    return (cache[k] = id);
  };
  // single right-ear flick: copy the right ear region from a tilted head
  const earFlick = (cv, p) => {
    const B = cat.drawCat({ ...p, headTilt: p._flick });
    const hx = 23 + (p.headDX || 0), hy = 20 + (p.headDY || 0);
    for (let y = hy - 11; y <= hy - 3; y++) for (let x = hx + 1; x < hx + 10; x++) cv.set(x, y, B.get(x, y));
  };
  // "lit" variant: sun on the face -> warm highlights on the head
  const sunlit = cv => { return;
    for (let y = 0; y < cv.h; y++) for (let x = 14; x < cv.w; x++) {
      const c = cv.get(x, y);
      if (c === P.o && (x + y) % 2 === 0) cv.set(x, y, P.h);
      else if (c === P.d && (x + y) % 3 === 0) cv.set(x, y, P.o);
    }
  };
  // tail-tip flick while dreaming (tail drawn under the body)
  const tailFlick = (cv, p) => {
    const T = new Canvas(cat.CW, cat.CH);
    cat.thick(T, p._tail === 1 ? [[6, 24], [3, 22], [3, 19]] : [[6, 24], [2, 23], [1, 20]], 1.3, P.o);
    T.outline(K); cat.over(T, cv);
    for (let i = 0; i < cv.px.length; i++) cv.px[i] = T.px[i];
  };
  const sleepId = (t) => {
    const breath = Math.floor(t / 0.85) % 2;
    const p = { pose: 'sleep', eyes: 'closed', mouth: 'none', breath };
    const fl = [[2.6, 1], [2.75, 2], [2.9, 1], [3.05, 0], [4.9, 1], [5.05, 0]];
    const f = C.pick(t, [[0, 0], ...fl]);
    if (t < 5.5 && f) return spr({ ...p, breath: 0, _tail: f }, tailFlick);
    if (t < 5.5) return spr(p);
    // beam on face: scrunch (head nudge), ear flicks at 6.2
    const q = { ...p, breath: t < 5.6 ? breath : 0 };
    if (t >= 5.6 && t < 6.0) q.headDY = 1;              // nuzzle deeper, away from the light
    if (t >= 6.2 && t < 6.3) { q._flick = 2; q._pk = 'a'; return spr(q, function flick(cv, pp) { earFlick(cv, pp); sunlit(cv); }); }
    if (t >= 6.3 && t < 6.38) { q._flick = -1; q._pk = 'b'; return spr(q, function flick(cv, pp) { earFlick(cv, pp); sunlit(cv); }); }
    if (t >= 6.45 && t < 6.53) { q._flick = 2; q._pk = 'a'; return spr(q, function flick(cv, pp) { earFlick(cv, pp); sunlit(cv); }); }
    if (t >= 6.65) { q.eyes = 'half'; q.breath = 0; }
    if (t >= 6.8) { q.eyes = 'open'; q.headDY = -1; }
    if (t >= 6.98 && t < 7.06) q.eyes = 'closed';          // blink
    return spr(q, sunlit);
  };
  const L = (t, pts) => C.key(t, pts, u => u);
  const catPose = t => {
    if (t < 7.2) return sleepId(t);
    if (t < 7.36) return spr({ pose: 'loaf', eyes: 'half', mouth: 'cat', tail: 20 }, sunlit);
    if (t < 8.6) {
      const yawn = t >= 7.6 && t < 8.15;
      const quiver = t > 8.15 ? Math.floor(t * 10) % 2 : 0;
      return spr({ pose: 'stretch', eyes: yawn ? 'closed' : (t < 8.3 ? 'happy' : 'open'), mouth: yawn ? (t < 7.7 || t > 8.05 ? 'open' : 'yawn') : 'cat',
        tail: 70 + quiver * 8, curl: -30 - quiver * 10, headDY: yawn ? -1 : 0 }, sunlit);
    }
    if (t < 8.72) return spr({ pose: 'walk', step: 0, eyes: 'open', tail: 100, curl: -40 }, sunlit);
    if (t < 8.8) return spr({ pose: 'crouch', step: 0, eyes: 'look', tail: 110 }, sunlit);
    if (t < 9.16) return spr({ pose: 'leap', eyes: 'wide', tail: 30 });
    if (t < 9.26) return spr({ pose: 'crouch', step: 0, eyes: 'happy', tail: 120 });
    return spr({ pose: 'walk', step: Math.floor((t - 9.26) * 12) % 4, eyes: 'happy', tail: 105, curl: -60 });
  };
  const catPos = t => {
    if (t < 7.2) return [CAT_X, CAT_Y];
    if (t < 7.36) return [CAT_X - 1, CAT_Y];
    if (t < 8.6) return [CAT_X - 2, CAT_Y];
    if (t < 8.8) return [CAT_X, CAT_Y];
    if (t < 9.16) { const u = C.inv(8.8, 9.16, t); return [C.lerp(CAT_X + 2, 186, u), C.lerp(CAT_Y - 6, 103, u) + C.hop(u, 16)]; }
    if (t < 9.26) return [186, 103];
    return [L(t, [[9.26, 188], [10, 280]]), 103 + (Math.floor((t - 9.26) * 12) % 2 ? -1 : 0)];
  };
  out.push(C.act({ t0: 0, t1: 10, fps: 24, pose: catPose, pos: catPos }));

  // ================================================================== TINT (night blue -> dawn -> warm)
  const tintD = `M0 0h256v144h-256zM${GX0} ${GY0}v${gh}h${gw}v-${gh}z`;
  out.push(`<path d="${tintD}" fill-rule="evenodd" fill="#3c4494" style="mix-blend-mode:multiply">${C.tween('fill', [[0, '#3c4494'], [2.2, '#4a4c9e'], [4.0, '#8a6aac'], [5.5, '#e09a98'], [7.0, '#ffcc9c'], [10, '#ffe0b4']])}</path>`);

  // ================================================================== SUNBEAM
  // patch centre px slides across the room; lands on floor, climbs the bed front, crosses the quilt to the face at 5.5
  const beamPx = t => C.key(t, [[1.0, 56], [5.5, FACE[0]], [10, 204]], u => u < 1 ? u : 1);
  const beamPy = px => C.key(px, [[0, 124], [112, 122], [136, 103], [150, 101], [300, 101]], u => u);
  const hull = pts => {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };
  const inPoly = (poly, x, y) => {
    let ins = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  const PW = 17, PH = 6; // patch half-size
  const beamPoly = (t, shrink = 0) => {
    const px = beamPx(t), py = beamPy(px);
    return hull([[GX0 + shrink, GY0 + shrink], [GX1 - shrink, GY0 + shrink], [GX0 + shrink, GY1 - shrink], [GX1 - shrink, GY1 - shrink],
      [px - PW + shrink, py - PH + shrink / 3], [px + PW - shrink, py - PH + shrink / 3], [px - PW + shrink, py + PH - shrink / 3], [px + PW - shrink, py + PH - shrink / 3]]);
  };
  // rasterise polygon into a compact staircase path (row spans), excluding the glass itself
  const polyPath = poly => {
    const ys = poly.map(p => p[1]);
    const spans = [];
    for (let y = Math.max(GY0, Math.floor(Math.min(...ys))); y <= Math.ceil(Math.max(...ys)); y++) {
      const yc = y + .5, xs = [];
      for (let i = 0; i < poly.length; i++) {
        const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      if (xs.length < 2) continue;
      let a = Math.round(Math.min(...xs)), b = Math.round(Math.max(...xs));
      if (y >= GY0 - 1 && y < GY1 + 1) a = Math.max(a, GX1 + 1);
      if (b > a) spans.push([y, a, b]);
    }
    let d = '', i = 0;
    while (i < spans.length) {
      let j = i; while (j + 1 < spans.length && spans[j + 1][0] === spans[j][0] + 1 && spans[j + 1][1] < spans[j][2] && spans[j + 1][2] > spans[j][1]) j++;
      const [y0, a0, b0] = spans[i];
      d += `M${a0} ${y0}h${b0 - a0}`;
      for (let k = i + 1; k <= j; k++) d += `v1h${spans[k][2] - spans[k - 1][2]}`;
      d += `v1h${spans[j][1] - spans[j][2]}`;
      for (let k = j - 1; k >= i; k--) d += `v-1h${spans[k][1] - spans[k + 1][1]}`;
      d += 'z'; i = j + 1;
    }
    return d.replace(/h0/g, '');
  };
  const BF = 6;
  const bt = [...C.sample(1.0, 5.5, BF, t => t).map(q => q[0]), ...C.sample(5.5, 10, 2, t => t).map(q => q[0]).slice(1)];
  const outerSt = bt.map(t => [t, polyPath(beamPoly(t))]);
  const innerSt = bt.map(t => [t, polyPath(beamPoly(t, 7))]);
  // dithered fringe pattern (single colour, transparent holes)
  C.def(`<pattern id="s1_chk" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#ffcf7a"/><rect x="1" y="1" width="1" height="1" fill="#ffcf7a"/></pattern>`);
  let beam = '';
  beam += `<path fill="url(#s1_chk)" d="${outerSt[0][1]}">${C.steps('d', outerSt)}</path>`;
  beam += `<path fill="#ffcf7a" d="${innerSt[0][1]}">${C.steps('d', innerSt)}</path>`;
  out.push(`<g opacity="0" style="mix-blend-mode:screen">${beam}${C.tween('opacity', [[1.0, 0], [3.0, 0.16], [5.5, 0.36], [8, 0.4], [10, 0.4]])}</g>`);
  // light patch (with window-cross shadow) where the beam lands
  {
    const S = new Canvas(PW * 2, PH * 2);
    S.rect(0, 0, PW * 2, PH * 2, C.dith(null, '#ffe9b8', 10));
    S.rect(2, 1, PW * 2 - 4, PH * 2 - 2, '#ffe9b8');
    S.rect(PW - 1, 0, 2, PH * 2, null); S.rect(0, PH - 1, PW * 2, 1, null);
    C.spriteRaw('s1_patch', S.toSVG(), PW * 2, PH * 2);
    const pp = t => { const px = beamPx(t); return [px - PW, beamPy(px) - PH]; };
    out.push(`<g opacity="0" style="mix-blend-mode:screen">${C.move(1.0, 10, BF, pp)}${C.use('s1_patch', 0, 0)}${C.tween('opacity', [[1.2, 0], [3.0, 0.3], [5.5, 0.5], [6.5, 0.42], [10, 0.45]])}</g>`);
  }
  // dust motes: drift slowly, visible only inside the beam
  {
    const Rm = C.rng(21);
    C.sprite('s1_mote', '#', { '#': '#fffbe6' });
    C.sprite('s1_mote2', `
      .#.
      #w#
      .#.`, { '#': '#ffcf7a', w: '#fffbe6' });
    let motes = '';
    for (let i = 0; i < 30; i++) {
      const x0 = 70 + Rm() * 140, y0 = 40 + Rm() * 70, ph = Rm() * 6.28, sp = 0.5 + Rm() * 0.6, big = i % 5 === 0;
      const mp = t => [x0 + Math.sin(t * sp + ph) * 6 + (t - 5) * 2.2, y0 + Math.sin(t * sp * 1.3 + ph * 2) * 4 - (t - 5) * 1.2];
      const on = t => {
        if (t < 2.2) return null;
        const [x, y] = mp(t);
        if (!inPoly(beamPoly(t, 3), x, y)) return null;
        if (t < 4.3 && y < 82 && x < 200) return null; // keep title area calm
        const tw = Math.floor(t * 4 + i * 1.7) % 7;
        if (tw === 0) return null;
        return big && tw < 3 ? 's1_mote2' : 's1_mote';
      };
      motes += C.act({ t0: 2.2, t1: 10, fps: 6, pose: on, pos: t => { const [x, y] = mp(t); return big ? [x - 1, y - 1] : [x, y]; } });
    }
    out.push(`<g style="mix-blend-mode:screen">${motes}</g>`);
  }

  // ================================================================== Zzz
  {
    const zs = [
      [3, `###\n.#.\n###`],
      [4, `####\n..#.\n.#..\n####`],
      [5, `#####\n...#.\n..#..\n.#...\n#####`],
    ];
    zs.forEach(([n, a], i) => {
      const cv = new Canvas(n + 2, n + 2);
      cv.art(a.split('\n'), { '#': '#eef0ff' }, 1, 1); cv.outline('#2a2550');
      C.spriteRaw(`s1_z${i}`, cv.toSVG(), n + 2, n + 2);
    });
    let zz = '';
    for (let k = 0; k < 7; k++) {
      const a = 0.4 + k * 0.85, b = a + 2.4;
      if (b > 6.4) break;
      zz += C.act({ t0: a, t1: b, fps: 8,
        pose: t => { const u = C.inv(a, b, t); return u < 0.3 ? 's1_z0' : u < 0.65 ? 's1_z1' : 's1_z2'; },
        pos: t => { const u = C.inv(a, b, t); return [FACE[0] + 4 + u * 20 + Math.sin(u * 7 + k) * 2, FACE[1] - 10 - u * 28]; } });
    }
    out.push(zz);
  }

  return out.join('\n');
};
