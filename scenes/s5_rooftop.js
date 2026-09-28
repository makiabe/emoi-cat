// S5 ROOFTOP — sunset over a Japanese town. Global 39..49s.
// Cues: 40.0-43.0 walk ridge · 41.5 crows (caw 41.8, 42.3) · 43.5 sit & watch ·
//       45.2/45.8/46.4/47.0 windows light · 47.5 first star.
'use strict';

module.exports = ({ t0, t1, C, cat }) => {
  const P = 's5_';
  const { Canvas, key, clamp } = C;
  const out = [];
  const lin = u => u;
  const RIDGE = 112; // top row of the roof ridge (cat feet row)

  // parallax drift group (camera slowly pans right -> world moves left)
  const drift = (speed, fps = 6) => C.move(t0, t1, fps, t => [-(t - t0) * speed, 0]);
  const layer = (markup, speed, extra = '') => `<g>${speed ? drift(speed) : ''}${markup}${extra}</g>`;
  // transparent-background dither pattern -> use as a Canvas "color" so runs merge (small markup)
  const DP = {};
  const dpat = (col, level) => {
    const k = col + level;
    if (!DP[k]) {
      const id = P + 'dp' + Object.keys(DP).length; DP[k] = `url(#${id})`;
      let d = ''; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (C.bayer(x, y) < level) d += `M${x} ${y}h1v1h-1z`;
      C.def(`<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><path fill="${col}" d="${d}"/></pattern>`);
    }
    return DP[k];
  };
  const fadeIn = (markup, pts) => `<g opacity="${pts[0][1]}">${C.tween('opacity', pts)}${markup}</g>`;

  // ================= SKY =================
  const SKY_H = 118;
  const skyGold = C.ditherGradient(0, 0, 256, SKY_H, [[0, '#b8586a'], [20, '#d8685e'], [42, '#f07e56'], [62, '#ff985a'], [80, '#ffb066'], [96, '#ffc474'], [110, '#ffd890']]);
  const skyMag = C.ditherGradient(0, 0, 256, SKY_H, [[0, '#3d3a78'], [18, '#5e3f86'], [38, '#9a4a9a'], [58, '#d0587e'], [76, '#f2657a'], [90, '#ff9a5a'], [106, '#ffcf7a']]);
  const skyInd = C.ditherGradient(0, 0, 256, SKY_H, [[0, '#1b1733'], [24, '#2a2550'], [46, '#3d3a78'], [66, '#62408a'], [82, '#9a4a9a'], [96, '#e0607a'], [110, '#ff9a5a']]);
  out.push(`<rect width="256" height="144" fill="#1b1733"/>`);
  out.push(skyGold);
  out.push(fadeIn(skyMag, [[41.2, 0], [45.2, 1]]));
  out.push(fadeIn(skyInd, [[45.0, 0], [48.9, 1]]));

  // ================= STARS =================
  // first star (cue 47.5) twinkles; a few faint ones follow
  C.sprite(P + 'st0', `
    ...
    .w.
    ...`, { w: '#ffe9b8' });
  C.sprite(P + 'st1', `
    .y.
    ywy
    .y.`, { w: '#ffffff', y: '#ffe9b8' });
  C.sprite(P + 'st2', `
    ..y..
    ..y..
    yywyy
    ..y..
    ..y..`, { w: '#ffffff', y: '#ffe9b8' });
  C.sprite(P + 'st3', `
    ..y..
    .ooo.
    yowoy
    .ooo.
    ..y..`, { w: '#ffffff', y: '#ffcf7a', o: '#ffe9b8' });
  const starSeq = [[47.5, 'st0'], [47.58, 'st1'], [47.66, 'st3'], [47.78, 'st2'], [47.9, 'st1'], [48.15, 'st2'], [48.3, 'st1'], [48.5, 'st0'], [48.58, 'st1'], [48.7, 'st2'], [48.85, 'st1']];
  const starPose = t => (t < 47.5 ? null : P + C.pick(t, starSeq));
  const starMarkup = [];
  starMarkup.push(C.act({ t0, t1, fps: 25, pose: starPose, pos: t => ['st0', 'st1'].includes(C.pick(t, starSeq)) ? [57, 15] : [56, 14] }));
  // faint secondary stars
  [[22, 30, 48.1], [96, 8, 48.35], [180, 24, 48.6], [134, 34, 48.75]].forEach(([x, y, ts]) => {
    starMarkup.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#ffe9b8" opacity="0">${C.tween('opacity', [[ts, 0], [ts + 0.3, 0.9], [t1, 0.9]])}${C.steps('visibility', [[0, 'hidden'], [ts, 'visible'], [t1, 'hidden']])}</rect>`);
  });

  // ================= SUN =================
  function sunCanvas(cTop, cMid, cBot, halo1, halo2) {
    const S = 48, cv = new Canvas(S * 2, S * 2), cx = S, cy = S, R = 20;
    cv.circle(cx, cy, 36, dpat(halo2, 2));
    cv.circle(cx, cy, 30, dpat(halo1, 4));
    cv.circle(cx, cy, 26, dpat(halo1, 8));
    const gaps = new Set([-5, 0, 4, 5, 9, 10, 13, 14, 15, 18, 19, 20]);
    cv.circle(cx, cy, R, (x, y) => {
      const dy = y - cy;
      if (gaps.has(dy)) return 'CUT';
      const u = (dy + R) / (2 * R);
      if (u < 0.45) return C.ditherFill(cTop, cMid, clamp(u / 0.45) * 16);
      return C.ditherFill(cMid, cBot, clamp((u - 0.45) / 0.55) * 16);
    });
    // scanline cuts: make them fully transparent (show sky through)
    for (let i = 0; i < cv.px.length; i++) if (cv.px[i] === 'CUT') cv.px[i] = null;
    // tiny bright highlight arc top-left
    for (let a = 200; a < 250; a += 6) { const rr = R - 3, x = cx + Math.cos(a * Math.PI / 180) * rr, y = cy + Math.sin(a * Math.PI / 180) * rr; cv.set(x, y, '#ffffff'); }
    return cv;
  }
  C.spriteRaw(P + 'sunA', sunCanvas('#fffbe6', '#ffe890', '#ffa050', '#ffe0a0', '#ffd890').toSVG(), 96, 96);
  C.spriteRaw(P + 'sunB', sunCanvas('#fff0c8', '#ffb068', '#f0506a', '#ffb0a0', '#f7a8a0').toSVG(), 96, 96);
  const SUNX = 152;
  const sunY = t => key(t, [[t0, 34], [t1, 100]], u => u * (0.85 + 0.15 * u));
  const sunMove = C.move(t0, t1, 7, t => [SUNX - 48, sunY(t) - 48]);
  // soft dithered god-rays fanning up from the sun (fade as it sinks)
  const rays = new Canvas(240, 120), RX = 120, RY = 100;
  [[-150, 7], [-128, 5], [-104, 6], [-76, 5], [-52, 7], [-30, 5]].forEach(([a, wdeg]) => {
    const A = (a - wdeg / 2) * Math.PI / 180, B2 = (a + wdeg / 2) * Math.PI / 180, L = 130;
    rays.poly([[RX, RY], [RX + Math.cos(A) * L, RY + Math.sin(A) * L], [RX + Math.cos(B2) * L, RY + Math.sin(B2) * L]], (x, y) => (Math.hypot(x - RX, y - RY) < 34 ? null : Math.hypot(x - RX, y - RY) < 70 ? dpat('#ffe6b0', 3) : dpat('#ffe6b0', 1)));
  });
  out.push(`<g>${C.move(t0, t1, 7, t => [SUNX - RX, sunY(t) - RY])}${fadeIn(rays.toSVG(), [[t0, 0.9], [42.5, 0.7], [45.5, 0]])}</g>`);
  out.push(`<g>${sunMove}${C.use(P + 'sunA')}${fadeIn(C.use(P + 'sunB'), [[43.5, 0], [47.5, 1]])}</g>`);

  // ================= CLOUDS =================
  function cloudCanvas(w, h, blobs, pal) {
    const cv = new Canvas(w, h);
    const mask = new Canvas(w, h);
    blobs.forEach(([x, y, rx, ry]) => mask.ellipse(x, y, rx, ry, '#000'));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!mask.get(x, y)) continue;
      const below = mask.get(x, y + 1), below2 = mask.get(x, y + 2), above = mask.get(x, y - 1);
      let c = pal.mid;
      if (!below) c = pal.edge;
      else if (!below2) c = pal.under;
      else if (!above) c = pal.top;
      else if (y < h * 0.45) c = C.dith(pal.mid, pal.top, 8)(x, y);
      cv.set(x, y, c);
    }
    return cv;
  }
  const CL_A = { top: '#c8687e', mid: '#e27e7e', under: '#ffb896', edge: '#ffe6b0' };
  const CL_B = { top: '#4a3a78', mid: '#6a4088', under: '#c8587e', edge: '#ff9a7a' };
  const clouds = [
    { x: 8, y: 26, w: 70, h: 10, blobs: [[14, 6, 12, 3], [30, 5, 16, 4], [50, 6, 14, 3.2], [62, 7, 7, 2]], sp: 1.4 },
    { x: 170, y: 18, w: 60, h: 9, blobs: [[12, 5, 10, 3], [28, 4, 14, 3.5], [45, 6, 12, 2.6]], sp: 1.8 },
    { x: 92, y: 44, w: 52, h: 7, blobs: [[10, 4, 9, 2], [26, 3, 14, 2.6], [42, 4, 9, 2]], sp: 2.4 },
    { x: 196, y: 58, w: 64, h: 6, blobs: [[14, 3, 13, 2], [36, 3, 18, 2.2], [56, 3, 8, 1.6]], sp: 2.8 },
    { x: -6, y: 60, w: 50, h: 6, blobs: [[12, 3, 12, 1.8], [30, 3, 16, 2.2]], sp: 2.8 },
  ];
  clouds.forEach((c, i) => {
    C.spriteRaw(P + 'clA' + i, cloudCanvas(c.w, c.h, c.blobs, CL_A).toSVG(), c.w, c.h);
    C.spriteRaw(P + 'clB' + i, cloudCanvas(c.w, c.h, c.blobs, CL_B).toSVG(), c.w, c.h);
    out.push(`<g>${C.move(t0, t1, 4, t => [c.x - (t - t0) * c.sp, c.y])}${C.use(P + 'clA' + i)}${fadeIn(C.use(P + 'clB' + i), [[43, 0], [47.5, 1]])}</g>`);
  });

  // ================= MOUNTAINS =================
  const mt = new Canvas(270, 50); // placed at y=62
  const MY = 58;
  for (let x = 0; x < 270; x++) {
    const hFar = 20 + 6 * Math.sin(x * 0.021 + 1) + 4 * Math.sin(x * 0.057 + 2) + 1.5 * Math.sin(x * 0.13);
    const hNear = 29 + 4 * Math.sin(x * 0.034 + 4) + 2.5 * Math.sin(x * 0.09 + 1) + 1.2 * Math.sin(x * 0.21);
    for (let y = Math.round(hFar); y < 50; y++) mt.set(x, y, y < hFar + 1 ? '#f0a08a' : '#d87e84');
    for (let y = Math.round(hNear); y < 50; y++) mt.set(x, y, y < hNear + 1 ? '#c86e80' : y < hNear + 6 ? '#ac5a7c' : '#9a4a74');
  }
  // tiny pagoda on the far hill
  const pg = (px, py) => {
    const col = '#9a4a74';
    mt.rect(px, py, 1, 3, col);
    [[5, 3], [4, 7], [3, 11], [2, 15]].forEach(([hw, dy]) => { mt.rect(px - hw, py + dy, hw * 2 + 1, 1, col); mt.rect(px - hw + 1, py + dy + 1, hw * 2 - 1, 3, col); });
  };
  pg(52, 10);
  out.push(layer(mt.toSVG(0, MY), 0.3, ''));

  // ================= FAR TOWN =================
  const rt = C.rng(55);
  const town = new Canvas(272, 40); // placed y=72
  const TY = 72;
  const townLights = [];
  let x = 0;
  while (x < 272) {
    const w = 6 + Math.floor(rt() * 12), top = 6 + Math.floor(rt() * 10);
    const col = '#7a3a64';
    town.rect(x, top, w, 40 - top, col);
    if (rt() < 0.4) town.poly([[x - 1, top], [x + w / 2, top - 4], [x + w + 1, top]], col); // pitched roof
    if (rt() < 0.3) { town.rect(x + 2, top - 3, 1, 3, col); } // antenna / chimney
    town.rect(x, top, w, 1, '#a24e6e'); // lit top edge
    for (let wy = top + 3; wy < 13; wy += 3) for (let wx = x + 2; wx < x + w - 1; wx += 3) {
      if (rt() < 0.5) { town.set(wx, wy, '#5c2a52'); if (rt() < 0.25) townLights.push([wx, wy]); }
    }
    x += w + (rt() < 0.3 ? 2 : 0);
  }
  town.rect(0, 15, 272, 25, '#6a3260'); // solid base, no sky gaps
  // elevated rail line
  town.rect(0, 13, 272, 2, '#4a2248');
  town.rect(0, 13, 272, 1, '#8a4264');
  for (let px = 3; px < 272; px += 14) town.rect(px, 15, 2, 25, '#5c2a52');
  for (let px = 0; px < 272; px += 22) { town.rect(px, 4, 1, 9, '#4a2248'); town.rect(px - 2, 5, 5, 1, '#4a2248'); }
  town.rect(0, 6, 272, 1, '#5c2a52'); // catenary wire
  out.push(layer(town.toSVG(0, TY), 0.6));

  // overlay 1: dusk falls on the distance
  out.push(`<rect width="256" height="144" fill="#2a2550" opacity="0">${C.tween('opacity', [[42.5, 0], [t1, 0.55]])}</rect>`);

  // far town lights popping on after the cue windows
  let tl = '';
  townLights.slice(0, 26).forEach(([lx, ly], i) => {
    const ts = 46.0 + (i * 0.37) % 3;
    tl += `<rect x="${lx}" y="${ly + TY}" width="1" height="1" fill="#ffcf7a" opacity="0">${C.steps('opacity', [[0, 0], [ts, 1], [t1, 0]])}</rect>`;
  });
  out.push(layer(tl, 0.6));

  // distant train on the elevated line (lit windows), right -> left
  const tr = new Canvas(78, 6);
  for (let car = 0; car < 3; car++) {
    const cx0 = car * 26;
    tr.rect(cx0, 1, 25, 5, '#3a2048');
    if (car === 0) { tr.set(cx0, 1, null); tr.set(cx0, 2, null); }
    for (let wx = cx0 + 2; wx < cx0 + 24; wx += 3) tr.rect(wx, 2, 2, 1, '#ffd98a');
    tr.rect(cx0 + 10, 0, 4, 1, '#3a2048');
  }
  C.spriteRaw(P + 'train', tr.toSVG(), 78, 6);
  out.push(C.act({ t0, t1, fps: 12, pose: t => (t < 44 ? null : P + 'train'), pos: t => [262 - (t - 44) * 34 - (t - t0) * 0.6, TY + 7] }));

  // ================= NEAR HOUSES + POLES =================
  const NW = 272;
  const nh = new Canvas(NW, 80); // placed y=40
  const NY = 40;
  const ROOF = '#2e2040', ROOF2 = '#271a38', WALL = '#44304e', WALL2 = '#3a2846', RIM = '#c05a7a';
  const houses = [
    { x: 2, w: 44, roof: 52, wall: 60, wins: [[10, 64], [28, 64]] },
    { x: 52, w: 38, roof: 46, wall: 55, wins: [[8, 59], [22, 59]] },
    { x: 100, w: 34, roof: 60, wall: 65, wins: [[20, 67]] },
    { x: 140, w: 48, roof: 49, wall: 57, wins: [[10, 61], [30, 61]] },
    { x: 194, w: 36, roof: 53, wall: 61, wins: [[8, 64], [22, 64]] },
    { x: 236, w: 36, roof: 47, wall: 56, wins: [[12, 60]] },
  ];
  // persimmon tree between houses
  const tree = (tx, ty) => {
    nh.rect(tx - 1, ty + 8, 2, 30, '#231634'); nh.line(tx, ty + 14, tx + 5, ty + 8, '#231634'); nh.line(tx, ty + 16, tx - 5, ty + 9, '#231634');
    [[0, 4, 9, 6], [-6, 7, 6, 4.5], [6, 7, 6, 4.5], [0, 9, 8, 4]].forEach(([dx, dy, rx, ryy]) => nh.ellipse(tx + dx, ty + dy, rx, ryy, (px, py) => (py < ty + dy - ryy + 1.5 ? '#6a3a5e' : '#3a2448')));
    [[-4, 6], [3, 9], [7, 5], [-8, 9], [1, 3]].forEach(([dx, dy]) => { nh.set(tx + dx, ty + dy, '#e8783a'); nh.set(tx + dx, ty + dy - 1, '#ffa050'); });
  };
  tree(190, 36);
  houses.forEach(h => {
    // wall
    nh.rect(h.x, h.wall, h.w, 80 - h.wall, (px, py) => ((px - h.x) % 6 === 0 ? WALL2 : WALL));
    // hip roof (kawara), eaves overhang
    const e = 3;
    nh.poly([[h.x - e, h.wall + 1], [h.x + 7, h.roof], [h.x + h.w - 7, h.roof], [h.x + h.w + e, h.wall + 1]], (px, py) => ((py - h.roof) % 2 ? ROOF2 : ROOF));
    nh.rect(h.x + 7, h.roof - 1, h.w - 14, 2, '#231634'); // ridge
    nh.rect(h.x + 6, h.roof - 2, h.w - 12, 1, RIM);       // sunset rim on ridge
    nh.rect(h.x - e, h.wall + 1, h.w + e * 2, 1, '#1e1430'); // eave shadow
    // ridge end ornaments
    nh.rect(h.x + 5, h.roof - 3, 2, 2, '#231634'); nh.rect(h.x + h.w - 7, h.roof - 3, 2, 2, '#231634');
    nh.set(h.x + 5, h.roof - 4, RIM); nh.set(h.x + h.w - 6, h.roof - 4, RIM);
    // dark windows (frames + panes)
    h.wins.forEach(([wx, wy]) => {
      nh.rect(h.x + wx - 1, wy - 1, 8, 7, '#241834');
      nh.rect(h.x + wx, wy, 6, 5, '#503a62');
      nh.rect(h.x + wx + 3, wy, 1, 5, '#241834');
      nh.set(h.x + wx, wy, '#6a4a78');
    });
  });
  // TV antennas
  [[70, 46], [160, 49]].forEach(([ax, ay]) => {
    nh.rect(ax, ay - 12, 1, 12, '#231634');
    nh.rect(ax - 4, ay - 11, 9, 1, '#231634'); nh.rect(ax - 3, ay - 8, 7, 1, '#231634'); nh.rect(ax - 2, ay - 5, 5, 1, '#231634');
  });
  // utility poles
  const poles = [[34, 2], [214, 0]];
  poles.forEach(([px, py]) => {
    nh.rect(px, py, 2, 80 - py, '#1e1430');
    nh.rect(px - 7, py + 3, 16, 1, '#1e1430');
    nh.rect(px - 5, py + 8, 12, 1, '#1e1430');
    [-6, -2, 3, 7].forEach(dx => nh.set(px + dx, py + 2, '#8a6a8a'));
    nh.rect(px + 2, py + 14, 4, 6, '#2a1c3a'); nh.rect(px + 2, py + 14, 4, 1, RIM); // transformer
    for (let yy = py + 24; yy < 76; yy += 5) nh.set(px + 2, yy, '#2a1c3a'); // step bolts
    nh.set(px, py, RIM); nh.set(px + 1, py, RIM);
  });
  // drooping wires between poles and out to the edges
  const wire = (x0, y0, x1, y1, sag) => {
    for (let wx = Math.min(x0, x1); wx <= Math.max(x0, x1); wx++) {
      const u = (wx - x0) / (x1 - x0);
      nh.set(wx, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u), '#1e1430');
    }
  };
  [[-6, 2, 9], [3, 2, 11], [-4, 7, 14]].forEach(([dx, dy, sag]) => {
    wire(poles[0][0] + dx, poles[0][1] + dy, poles[1][0] + dx, poles[1][1] + dy, sag);
    wire(-40, poles[0][1] + dy + 6, poles[0][0] + dx, poles[0][1] + dy, sag * 0.4);
    wire(poles[1][0] + dx, poles[1][1] + dy, NW + 20, poles[1][1] + dy + 8, sag * 0.5);
  });
  out.push(layer(nh.toSVG(0, NY), 1.0));

  // ================= FOREGROUND ROOF (kawara) =================
  const FW = 272, FH = 144 - RIDGE;
  const fr = new Canvas(FW, FH);
  // ridge cap: rim-lit top, round cover tiles, stacked noshi tiles
  for (let xx = 0; xx < FW; xx++) {
    const seam = xx % 12 === 0, seam2 = xx % 12 === 11;
    fr.set(xx, 0, '#ffc8a0');
    fr.set(xx, 1, seam ? '#a05a78' : '#e08a86');
    fr.set(xx, 2, seam ? '#2a2040' : seam2 ? '#7a5070' : '#5a4468');
    fr.set(xx, 3, seam ? '#2a2040' : '#443656');
    fr.set(xx, 4, '#241a32');
    fr.set(xx, 5, '#4a3a5c');
    fr.set(xx, 6, '#2e2440');
    fr.set(xx, 7, '#140e1e');
  }
  let tileMarkup = '';
  // tile rows as SVG patterns (tiny markup): rows grow taller toward the viewer
  const TILE = ['#171122', '#221a30', '#2c2440', '#3a2f4e', '#4a3b5e', '#3a2f4e', '#2c2440', '#221a30'];
  let ry = 8;
  [5, 6, 7, 8, 9].forEach((rh, i) => {
    const tc = new Canvas(8, rh);
    for (let yy = 0; yy < rh; yy++) for (let k = 0; k < 8; k++) {
      let c = TILE[k];
      if (yy === 0) c = k >= 3 && k <= 5 ? '#241a32' : '#120c1a';           // shadow under previous lip
      else if (yy === rh - 1) c = k >= 3 && k <= 5 ? '#5e4870' : '#140e1e'; // rounded tile end
      else if (yy === rh - 2 && k === 4) c = '#57466a';
      tc.set(k, yy, c);
    }
    const pid = P + 'tr' + i;
    C.def(`<pattern id="${pid}" width="8" height="${rh}" patternUnits="userSpaceOnUse" x="${(i % 2) * 4}" y="${RIDGE + ry}">${tc.toSVG()}</pattern>`);
    tileMarkup += `<rect x="0" y="${RIDGE + ry}" width="${FW}" height="${Math.min(rh, FH - ry)}" fill="url(#${pid})"/>`;
    ry += rh;
  });
  // warm sky/sun reflection on the tile crests (fades as the sun goes)
  const refl = new Canvas(FW, FH);
  ry = 8;
  [5, 6, 7, 8, 9].forEach((rh, i) => {
    for (let xx = 0; xx < FW; xx++) {
      if ((xx + (i % 2) * 4) % 8 !== 4) continue;
      const d = Math.abs(xx - SUNX) / 70 + i * 0.12;
      if (d > 1) continue;
      for (let yy = ry + 1; yy < ry + rh - 1 && yy < FH; yy++) refl.set(xx, yy, d < 0.4 ? '#6e4c6c' : '#584464');
      if (ry + rh - 1 < FH) refl.set(xx, ry + rh - 1, d < 0.4 ? '#d08a86' : '#8a6480');
      if (d < 0.3 && ry + rh - 1 < FH) { refl.set(xx - 1, ry + rh - 1, '#8a6480'); refl.set(xx + 1, ry + rh - 1, '#8a6480'); }
    }
    ry += rh;
  });
  tileMarkup += fadeIn(refl.toSVG(0, RIDGE), [[t0, 1], [44, 1], [48, 0.15]]);
  out.push(`<g>${drift(1.2)}${fr.toSVG(0, RIDGE)}${tileMarkup}__CAT__</g>`);

  // ================= MIKAN =================
  // sunset relight: palette swap + rim light on edges facing the sun
  const K = cat.PAL.k;
  function relight(cv, map, rims, rimOutline) {
    const src = cv, dst = new Canvas(cv.w, cv.h);
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
      const c = src.get(x, y); if (!c) continue;
      let nc = map[c] || c;
      if (c === K) {
        for (const [dx, dy] of rims) if (!src.get(x + dx, y + dy) && rimOutline) nc = rimOutline;
      } else {
        for (const [dx, dy, col] of rims) if (src.get(x + dx, y + dy) === K && !src.get(x + 2 * dx, y + 2 * dy)) nc = col;
      }
      dst.set(x, y, nc);
    }
    return dst;
  }
  const PL = cat.PAL;
  const WALK_MAP = { [PL.o]: '#e68a48', [PL.d]: '#b0563a', [PL.h]: '#f7ac62', [PL.w]: '#f5d2b8', [PL.s]: '#d0a09a' };
  const WALK_RIM = [[1, 0, '#ffe9b8'], [0, -1, '#ffd08c']];
  const walkSprite = (id, p) => C.spriteRaw(id, relight(cat.drawCat(p), WALK_MAP, WALK_RIM, '#7a3434').toSVG(), 36, 28);

  // back view sitting cat (seen from behind, slightly from the side), facing into the scene
  function drawBack({ tail = 0, earT = 0, headUp = 0, noHead = false }) {
    const cv = new Canvas(36, 28);
    const Tl = new Canvas(36, 28), B = new Canvas(36, 28), Hd = new Canvas(36, 28);
    const cx = 15;
    // tail lies along the ridge to the right, tip curls up and swishes
    const tipA = [[0, 0], [1, -1], [1, -2], [0, -3], [-1, -2]][tail];
    cat.thick(Tl, [[cx + 5, 25.5], [cx + 10, 26], [cx + 14, 25.5], [cx + 17 + tipA[0], 23.5 + tipA[1] * 0.6], [cx + 18 + tipA[0], 20.5 + tipA[1]]], 1.25, 'o');
    // haunches + body (pear)
    B.ellipse(cx, 22.5, 9.2, 5, 'o');
    B.ellipse(cx, 17, 7, 7.6, 'o');
    // head
    const hy = 7.5 - headUp, hx = cx + 1;
    if (!noHead) Hd.ellipse(hx, hy, 6.2, 5, 'o');
    if (!noHead) Hd.poly([[hx - 6, hy - 1], [hx - 5 + earT, hy - 8], [hx - 1.5, hy - 4]], 'o');
    if (!noHead) Hd.poly([[hx + 1.5, hy - 4], [hx + 5.5, hy - 8], [hx + 6.5, hy - 1]], 'o');
    Tl.outline(K); cat.over(cv, Tl);
    B.outline(K); cat.over(cv, B);
    Hd.outline(K); cat.over(cv, Hd);
    // shading & tabby stripes
    for (let y = 0; y < 28; y++) for (let x = 0; x < 36; x++) {
      if (cv.get(x, y) !== 'o') continue;
      let c = PL.o;
      const inHead = Hd.get(x, y) === 'o' && y < hy + 5;
      if (inHead) {
        if (y < hy - 2 && (x === hx - 2 || x === hx + 1)) c = PL.d; // back-of-head stripes
        else if (y > hy + 2.5) c = PL.d;
        else if (y < hy - 3.5) c = PL.h;
      } else if (Tl.get(x, y) === 'o' && !B.get(x, y)) {
        c = ((x + 1) % 4 === 0) ? PL.d : PL.o;
      } else {
        const ax = Math.abs(x + .5 - cx);
        if (y > 24) c = PL.d;
        else if (y >= 10 && y < 23 && Math.floor(y + ax * 0.5) % 4 === 0) c = PL.d; // chevron stripes
        else if (y >= 10 && y < 24 && Math.abs(x + .5 - cx) < 1) c = PL.d; // spine
        else if (y < 12) c = PL.h;
      }
      cv.set(x, y, c);
    }
    // hint of white chest on the right side (3/4 view)
    [[cx + 6, 15], [cx + 6, 16], [cx + 6, 17], [cx + 6, 18], [cx + 5, 19], [cx + 6, 19]].forEach(([x, y]) => { if (cv.get(x, y) && cv.get(x, y) !== K) cv.set(x, y, PL.w); });
    // inner ear glow (translucent in the backlight)
    if (!noHead) {
      cv.set(hx - 4 + earT, hy - 5, PL.p); cv.set(hx + 4, hy - 5, PL.p); cv.set(hx + 4, hy - 4, PL.p);
      // whisker tip poking out on the sunny side
      [[hx + 7, hy + 2], [hx + 8, hy + 2]].forEach(([x, y]) => { cv.set(x, y, '#fff3e0'); Hd.set(x, y, '#fff3e0'); });
    }
    return { cv, Tl, B, Hd };
  }
  const BACK_A = { [PL.o]: '#b85e40', [PL.d]: '#8a3c38', [PL.h]: '#cf7448', [PL.w]: '#e8b09a', [PL.p]: '#ff9a7a' };
  const RIM_A = [[1, 0, '#ffd88a'], [0, -1, '#ffb070'], [-1, 0, '#d86a7a']];
  const BACK_B = { [PL.o]: '#8a4658', [PL.d]: '#62304e', [PL.h]: '#9a5466', [PL.w]: '#b0788e', [PL.p]: '#f2657a', '#fff3e0': '#f7a8a0' };
  const RIM_B = [[1, 0, '#ff9a7a'], [0, -1, '#e06a8a'], [-1, 0, '#7a4a8a']];

  // --- walk frames (sprites) ---
  const walkId = (s, look, eyes) => {
    const id = `${P}w${s}${look}${eyes}`;
    if (!C.size(id)) walkSprite(id, { pose: 'walk', step: s, eyes, headDY: look ? -1 : 0, headDX: look ? -1 : 0, tail: 115 + (s % 2) * 6, curl: -55 });
    return id;
  };
  const WALK_T0 = 40.0, WALK_T1 = 43.0, SIT_T = 43.5;
  const walkX = t => key(t, [[WALK_T0, -36], [42.4, 76], [WALK_T1, 86]], lin);
  const catY = RIDGE - 27;
  const walkPose = t => {
    if (t < WALK_T0 || t >= SIT_T) return null;
    if (t >= WALK_T1) return walkId(0, 0, t < 43.2 ? 'open' : 'half');
    const s = Math.floor((t - WALK_T0) * 10) % 4;
    const look = t >= 41.55 && t < 42.8 ? 1 : 0;
    const eyes = 'open';
    return walkId(s, look, eyes);
  };
  const walkAct = C.act({ t0, t1, fps: 10, pose: walkPose, pos: t => [walkX(Math.min(t, WALK_T1)), catY - ((Math.floor((t - WALK_T0) * 10) % 2 && t < WALK_T1) ? 1 : 0)] });

  // --- back-view sit frames ---
  // split into parts (tail / body / head) so frames are cheap combos of shared pieces
  const partSprite = (id, v, opts, keep) => {
    if (C.size(id)) return id;
    const L = drawBack(opts);
    const m = v === 'A' ? BACK_A : BACK_B, rim = v === 'A' ? RIM_A : RIM_B;
    const lit = relight(L.cv, m, rim, v === 'A' ? '#6a2c34' : '#3a2040');
    const part = new Canvas(36, 28);
    for (let y = 0; y < 28; y++) for (let x = 0; x < 36; x++) if (keep(L, x, y)) part.set(x, y, lit.get(x, y));
    return C.spriteRaw(id, part.toSVG(), 36, 28);
  };
  const backId = (v, tail, earT, headUp) => {
    const id = `${P}b${v}${tail}${earT}${headUp}`;
    if (!C.size(id)) {
      const tId = partSprite(`${P}bt${v}${tail}`, v, { tail, noHead: true }, (L, x, y) => L.Tl.get(x, y) && !L.B.get(x, y));
      const bId = partSprite(`${P}bb${v}`, v, { noHead: true }, (L, x, y) => L.B.get(x, y));
      const hId = partSprite(`${P}bh${v}${earT}${headUp}`, v, { earT, headUp }, (L, x, y) => L.Hd.get(x, y));
      C.spriteRaw(id, C.use(tId) + C.use(bId) + C.use(hId), 36, 28);
    }
    return id;
  };
  const SWISH = [0, 1, 2, 3, 3, 2, 1, 0, 4, 4];
  const backPose = v => t => {
    if (t < SIT_T) return null;
    const tail = SWISH[Math.floor((t - SIT_T) * 4) % SWISH.length];
    const earT = (t >= 45.0 && t < 45.15) || (t >= 46.9 && t < 47.0) || (t >= 47.55 && t < 47.7) ? 1 : 0;
    const headUp = 0;
    return backId(v, tail, earT, headUp);
  };
  const SIT_X = 86;
  const backA = C.act({ t0, t1, fps: 20, pose: backPose('A'), pos: () => [SIT_X, catY] });
  const backB = C.act({ t0, t1, fps: 20, pose: backPose('B'), pos: () => [SIT_X, catY] });
  // backlit cast shadow falling toward the viewer across the tiles
  const sh = new Canvas(30, 12);
  sh.ellipse(15, 3, 12, 2.8, dpat('#0e0918', 6));
  sh.ellipse(15, 2.5, 8, 1.6, dpat('#0e0918', 11));
  C.spriteRaw(P + 'shadow', sh.toSVG(), 30, 12);
  const shAct = C.act({ t0, t1, fps: 10, pose: t => (t >= WALK_T0 ? P + 'shadow' : null), pos: t => [(t < SIT_T ? walkX(Math.min(t, WALK_T1)) + 1 : SIT_X) + 1, RIDGE + 6] });
  const catMarkup = shAct + walkAct + backA + fadeIn(backB, [[44.5, 0], [48.5, 1]]);
  out[out.length - 1] = out[out.length - 1].replace('__CAT__', '');

  // overlay 2: dusk over the near world
  out.push(`<rect width="256" height="144" fill="#1b1733" opacity="0">${C.tween('opacity', [[43.5, 0], [t1, 0.38]])}</rect>`);
  out.push(starMarkup.join(''));
  // Mikan stays above the dusk overlay (her own dusk palette crossfades in)
  out.push(`<g>${drift(1.2)}${catMarkup}</g>`);

  // ================= WINDOWS LIGHT UP =================
  const cueWins = [[45.2, 1, 0], [45.8, 3, 1], [46.4, 0, 1], [47.0, 4, 0], [47.0 + 0.9, 5, 0]]; // [time, house, window]
  let wl = '';
  cueWins.forEach(([ts, hi, wi], n) => {
    const h = houses[hi]; const [wx, wy] = h.wins[wi];
    const X = h.x + wx, Y = wy + NY;
    const g = new Canvas(20, 17);
    g.ellipse(10, 8.5, 8, 6, dpat('#ffcf7a', 3));
    g.ellipse(10, 8.5, 5.5, 4.2, dpat('#ffcf7a', 7));
    // window itself
    for (let yy = 6; yy < 11; yy++) for (let xx = 7; xx < 13; xx++) g.set(xx, yy, null);
    g.rect(7, 6, 6, 5, '#ffcf7a');
    g.rect(7, 6, 6, 1, '#ffe9b8');
    g.rect(10, 6, 1, 5, '#d89048');
    g.rect(7, 8, 6, 1, '#e8a458');
    g.set(8, 7, '#fff6d8');
    // light spill on the sill below
    g.rect(6, 11, 8, 1, '#8a5a4a');
    const flick = n === 1 ? [[ts, 1], [ts + 0.08, 0.2], [ts + 0.16, 1], [ts + 0.22, 0.4], [ts + 0.3, 1]] : [[ts, 1]];
    wl += `<g opacity="0" transform="translate(${X - 7} ${Y - 6})">${C.steps('opacity', [[0, 0], ...flick, [t1, 0]])}${g.toSVG()}</g>`;
  });
  out.push(layer(wl, 1.0));

  // ================= CROWS =================
  C.sprite(P + 'cr0', `
    .....kk......
    ......kk.....
    ..kk..kkk....
    kkkkkkkkkkkk.
    ..kkkkkkkkkkk
    .............
    .............`, { k: '#1b1426' });
  C.sprite(P + 'cr1', `
    .............
    .............
    ..kk.........
    kkkkkkkkkkkk.
    ..kkkkkkkkkkk
    ...kkkkkk....
    .............`, { k: '#1b1426' });
  C.sprite(P + 'cr2', `
    .............
    .............
    ..kk.........
    kkkkkkkkkkkk.
    ..kkkkkkkkkkk
    .....kkk.....
    ......kk.....`, { k: '#1b1426' });
  C.sprite(P + 'crc', `
    .............
    .............
    k.kk.........
    .kkkkkkkkkkk.
    k.kkkkkkkkkkk
    ...kkkkkk....
    .............`, { k: '#1b1426' });
  C.spriteRaw(P + 'ka', C.text('KA', 1, 1, '#2b1d2e') + C.text('KA', 0, 0, '#fff3e0'), 8, 6);
  const CROW_T = 41.5;
  const crows = [
    { dx: 0, y: 50, ph: 0, caw: 41.8 },
    { dx: 18, y: 58, ph: 1.7, caw: 42.3 },
    { dx: 38, y: 45, ph: 3.1, caw: null },
  ];
  const WING = ['cr0', 'cr1', 'cr2', 'cr1'];
  crows.forEach(c => {
    const cx = t => 258 + c.dx - (t - CROW_T) * 92;
    const cy = t => c.y - (t - CROW_T) * 3 + Math.round(Math.sin((t - CROW_T) * 5 + c.ph) * 1.5);
    const cawing = t => c.caw && t >= c.caw && t < c.caw + 0.3;
    out.push(C.act({ t0, t1, fps: 12, pose: t => {
      if (t < CROW_T || cx(t) < -20) return null;
      if (cawing(t)) return P + 'crc';
      return P + WING[Math.floor((t - CROW_T) * 9 + c.ph) % 4];
    }, pos: t => [cx(t), cy(t)] }));
    if (c.caw) out.push(C.act({ t0, t1, fps: 12, pose: t => (t >= c.caw && t < c.caw + 0.45 ? P + 'ka' : null), pos: t => [cx(c.caw) - 5, cy(c.caw) - 8 - (t - c.caw > 0.2 ? 1 : 0)] }));
  });

  return out.join('\n');
};
