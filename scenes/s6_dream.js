// S6 helper: Mikan's dream bubble — swimming through a starry sky with big friendly fish.
'use strict';
module.exports = ({ C, cat, P, cid, mix, K }) => {
  const { Canvas } = C;
  const BX = 112, BY = 47, RX = 44, RY = 25; // full bubble ellipse
  const RING = '#fff3e0', RING2 = '#cfc4ee', IN = '#241f52';
  const ellPath = (cx, cy, rx, ry) => { const cv = new Canvas(256, 144); cv.ellipse(cx, cy, rx, ry, '#000'); return cv.toSVG().match(/d="([^"]+)"/)[1]; };

  // ring sprites
  const ring = (id, rx, ry, cx = BX, cy = BY, fill = IN) => {
    const cv = new Canvas(256, 144);
    cv.ellipse(cx, cy, rx + 1, ry + 1, RING2);
    cv.ellipse(cx, cy, rx + 0.2, ry + 0.2, (x, y) => (y < cy - ry * 0.35 && x < cx ? RING : RING2));
    cv.ellipse(cx, cy, rx - 1, ry - 1, fill);
    cv.outline(K);
    C.spriteRaw(id, cv.toSVG(), 256, 144);
    return id;
  };
  const rS = ring(P + 'bub_s', 10, 6, BX + 8, BY + 14);
  const rM = ring(P + 'bub_m', 26, 15, BX + 3, BY + 5);
  const rO = ring(P + 'bub_o', RX + 2, RY + 1);
  const rF = ring(P + 'bub_f', RX, RY);
  const chain = [[140, 101, 1.4], [137, 93, 2.1], [132, 84, 3.2]].map(([x, y, r], i) => {
    const cv = new Canvas(256, 144);
    cv.circle(x, y, r + 0.6, RING2); cv.circle(x, y, r - 0.6, IN); cv.set(Math.round(x - r / 2), Math.round(y - r / 2), RING);
    cv.outline(K);
    return C.spriteRaw(P + 'chain' + i, cv.toSVG(), 256, 144);
  });

  const T_B = 53.5, T_OPEN = 54.04, T_POP = 55.85;
  const out = [];
  const vis = (a, b, m) => `<g opacity="0">${C.show(a, b)}${m}</g>`;
  chain.forEach((id, i) => out.push(vis(T_B + i * 0.12, 56.14 - i * 0.07, C.use(id))));
  out.push(vis(53.86, 53.95, C.use(rS)));
  out.push(vis(53.95, T_OPEN, C.use(rM)));
  out.push(vis(T_OPEN, T_OPEN + 0.1, C.use(rO)));
  out.push(vis(T_OPEN + 0.1, T_POP, C.use(rF)));
  out.push(vis(T_POP, T_POP + 0.1, C.use(rM)));

  // pop sparkle
  {
    let d = '', d2 = '';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = Math.round(BX + 3 + Math.cos(a) * 30), y = Math.round(BY + 5 + Math.sin(a) * 17);
      if (i % 2) d += `M${x} ${y}h1v1h-1z`; else d2 += `M${x - 1} ${y}h3v1h-3zM${x} ${y - 1}h1v3h-1z`;
    }
    out.push(vis(T_POP + 0.1, T_POP + 0.2, `<path fill="${RING}" d="${d2}"/><path fill="${RING2}" d="${d}"/>`));
    let e = '';
    for (let i = 0; i < 12; i++) { const a = (i + .5) / 12 * Math.PI * 2, x = Math.round(BX + 3 + Math.cos(a) * 36), y = Math.round(BY + 5 + Math.sin(a) * 21); e += `M${x} ${y}h1v1h-1z`; }
    out.push(vis(T_POP + 0.2, T_POP + 0.3, `<path fill="${RING2}" d="${e}"/>`));
  }

  // ---- content (clipped) ----
  C.def(`<clipPath id="${P}bclip"><path d="${ellPath(BX, BY, RX - 1, RY - 1)}"/></clipPath>`);
  let m = '';
  // dreamy sky gradient
  m += C.ditherGradient(BX - RX, BY - RY, RX * 2, RY * 2, [[BY - RY, '#221c50'], [BY - 4, '#3e3486'], [BY + RY, '#8a5aa8']]);
  // scrolling star field (parallax)
  {
    const r = C.rng(909);
    let far = '', near = '';
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(BX - RX + r() * (RX * 2 + 60)), y = Math.floor(BY - RY + r() * (RY * 2 - 8));
      if (i % 3) far += `M${x} ${y}h1v1h-1z`; else near += `M${x - 1} ${y}h3v1h-3zM${x} ${y - 1}h1v3h-1z`;
    }
    m += `<g>${C.move(T_OPEN, T_POP, 6, t => [-(t - T_OPEN) * 10, 0])}<path fill="#b8b0f0" d="${far}"/></g>`;
    m += `<g>${C.move(T_OPEN, T_POP, 8, t => [-(t - T_OPEN) * 22, 0])}<path fill="#fff4cc" d="${near}"/></g>`;
  }
  // ringed planet
  {
    const cv = new Canvas(256, 144);
    const px = BX - 28, py = BY - 13;
    cv.circle(px, py, 5, (x, y) => (y < py - 1 ? '#ffb8c8' : '#e07aa0'));
    cv.line(px - 9, py + 2, px + 9, py - 2, '#ffe9b8'); cv.line(px - 8, py + 3, px + 8, py - 1, '#e8c070');
    m += `<g>${C.move(T_OPEN, T_POP, 4, t => [-(t - T_OPEN) * 4, 0])}${cv.toSVG()}</g>`;
  }
  // soft dream clouds along the bottom
  {
    const cv = new Canvas(400, 144);
    for (let i = 0; i < 7; i++) { const cx = BX - RX + i * 22, cy = BY + RY - 2 - (i % 2) * 2; cv.ellipse(cx, cy, 10, 5, (x, y) => (y < cy - 2 ? '#ffd8e8' : '#e8a8d0')); }
    m += `<g>${C.move(T_OPEN, T_POP, 6, t => [-(t - T_OPEN) * 14, 0])}${cv.toSVG()}</g>`;
  }
  // fish
  const fish = (id, len, body, belly, fin, ph) => {
    const cv = new Canvas(len + 12, Math.ceil(len * 0.8) + 4);
    const cx = len / 2 + 7, cy = Math.round(cv.h / 2), rx = len / 2, ry = len * 0.3;
    // tail
    cv.poly([[cx - rx + 3, cy], [cx - rx - 5, cy - 5 + ph], [cx - rx - 3, cy + ph * 0.3], [cx - rx - 5, cy + 5 + ph]], fin);
    // dorsal + belly fins
    cv.poly([[cx - 3, cy - ry + 1], [cx + 1, cy - ry - 4], [cx + 5, cy - ry + 1]], fin);
    cv.poly([[cx - 2, cy + ry - 1], [cx - 5 - ph * 0.3, cy + ry + 3], [cx + 2, cy + ry - 1]], fin);
    cv.ellipse(cx, cy, rx, ry, (x, y) => (y > cy + 1 ? belly : ((x + y) % 5 === 0 && x < cx + rx * 0.4 ? mix(body, '#ffffff', 0.3) : body)));
    cv.outline(K);
    // eye, smile, blush, gill
    const ex = Math.round(cx + rx * 0.5), ey = Math.round(cy - 2);
    cv.rect(ex, ey, 2, 2, K); cv.set(ex, ey, '#ffffff');
    cv.set(ex + 2, ey + 3, K); cv.set(ex + 1, ey + 4, K);
    cv.set(ex - 2, ey + 3, '#f59aaa');
    cv.line(Math.round(cx + rx * 0.2), cy - 2, Math.round(cx + rx * 0.2) - 1, cy + 2, mix(body, K, 0.4));
    C.spriteRaw(id, cv.toSVG(), cv.w, cv.h);
    return id;
  };
  const fA = [0, 2].map((ph, i) => fish(P + 'fishA' + i, 28, '#5fb0ee', '#dff4ff', '#3d7ac8', ph - 1));
  const fB = [0, 2].map((ph, i) => fish(P + 'fishB' + i, 20, '#ff9a7a', '#fff0d8', '#f2657a', ph - 1));
  const fishGroup = (ids, fps, fn, flip) => `<g>${C.move(T_OPEN, T_POP, 8, fn)}${C.flipbook(ids, fps, 0, 0, flip)}</g>`;
  m += fishGroup(fA, 4, t => [BX - RX + 2 + Math.sin((t - T_OPEN) * 2.2) * 2, BY + 2 + Math.sin((t - T_OPEN) * 3) * 2.5]);
  m += fishGroup(fB, 5, t => [BX + 12 + (t - T_OPEN) * 3, BY - RY + 3 + Math.sin((t - T_OPEN) * 3.6 + 1) * 2]);
  // swimming Mikan
  const sw = [cid('swim0', { pose: 'leap', eyes: 'happy', tail: 5, curl: -25 }), cid('swim1', { pose: 'leap', eyes: 'happy', tail: 30, curl: 15, headDY: -1 })];
  m += C.act({ t0: T_OPEN, t1: T_POP, fps: 8, pose: t => sw[Math.floor((t - T_OPEN) * 4) % 2], pos: t => [BX - 20 + Math.sin((t - T_OPEN) * 1.6) * 3, BY - 16 + Math.sin((t - T_OPEN) * 3.2) * 2.5] });
  // sparkle trail behind swimming Mikan
  {
    const mpos = t => [BX - 20 + Math.sin((t - T_OPEN) * 1.6) * 3, BY - 16 + Math.sin((t - T_OPEN) * 3.2) * 2.5];
    let g = '';
    [0, 0.25, 0.5, 0.75].forEach((d, i) => {
      const per = 1.0;
      const st = C.sample(T_OPEN, T_POP, 8, t => { const u = ((t - T_OPEN + d) % per) / per; const [mx, my] = mpos(t - u * per); return [Math.round(mx + 2 - u * 16), Math.round(my + 16 + (i % 2 ? -2 : 1) + u * 2), u < 0.45 ? 'a' : 'b'].join(' '); });
      const tr = st.map(([t, v]) => [t, v.split(' ').slice(0, 2).join(' ')]);
      g += `<g>${C.steps('translate', tr, 'animateTransform')}<g>${C.steps('opacity', st.map(([t, v]) => [t, v.endsWith('a') ? 1 : 0]))}<path fill="#fff4cc" d="M0 -1h1v3h-1zM-1 0h3v1h-3z"/></g><g>${C.steps('opacity', st.map(([t, v]) => [t, v.endsWith('b') ? 1 : 0]))}<path fill="#c8b8f8" d="M0 0h1v1h-1z"/></g></g>`;
    });
    m += g;
  }
  // little air bubbles from the big fish
  {
    let g = '';
    [0, 0.5, 1.0].forEach((d, i) => {
      g += `<g>${C.move(T_OPEN, T_POP, 8, t => { const u = ((t - T_OPEN + d) % 1.5) / 1.5; return [BX - RX + 30 + i + Math.round(Math.sin(u * 9)), BY + 2 - u * 22]; })}<path fill="none" stroke="#cfe8ff" stroke-width="0" d=""/><path fill="#cfe8ff" d="M0 -1h1v1h-1zM-1 0h1v1h-1zM1 0h1v1h-1zM0 1h1v1h-1z"/></g>`;
    });
    m += g;
  }
  out.push(vis(T_OPEN, T_POP, `<g clip-path="url(#${P}bclip)">${m}</g>`));
  // glossy highlight on top of the content
  out.push(vis(T_OPEN, T_POP, `<path fill="${RING}" d="M${BX - 30} ${BY - 18}h2v1h-2zM${BX - 34} ${BY - 14}h1v3h-1zM${BX - 33} ${BY - 16}h2v1h-2zM${BX - 24} ${BY - 21}h6v1h-6z"/>`));
  return out.join('\n');
};
