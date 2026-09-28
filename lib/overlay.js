// Global overlays: Bayer-dither scene transitions, in-world clock HUD, titles, CRT finish.
'use strict';

// 8x8 hiragana bitmaps for the title (# = on)
const KANA = {
  'ね': ['..#.....', '.####...', '...#.##.', '..##...#', '.#.#...#', '#..#.###', '...#.#.#', '..#...#.'],
  'こ': ['........', '.######.', '.......#', '........', '........', '.#......', '.#......', '..######'],
  'の': ['...###..', '.##.#.#.', '#...#..#', '#..#...#', '#..#...#', '#.#....#', '.#....#.', '.....#..'],
  'い': ['........', '#.......', '#.....#.', '#......#', '#......#', '#..#...#', '.##.....', '........'],
  'ち': ['...#....', '#######.', '...#....', '..#.###.', '..##...#', '.......#', '......#.', '..###...'],
  'に': ['#.......', '#..#####', '#.......', '#.......', '#.......', '#.#.....', '##.#....', '#...####'],
};
function kana(str, x, y, c, s = 1, gap = 2) {
  let d = '', cx = x;
  for (const ch of str) {
    const g = KANA[ch];
    if (g) g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '#') d += `M${cx + i * s} ${y + j * s}h${s}v${s}h-${s}z`; }));
    cx += (8 + gap) * s;
  }
  return `<path fill="${c}" d="${d}"/>`;
}
const kanaWidth = (str, s = 1, gap = 2) => str.length * (8 + gap) * s - gap * s;

module.exports = function overlay({ C, SCENES, CLOCK, opts }) {
  const { W, H, T } = C;
  const out = [];

  // ---------- clock HUD ----------
  const minutes = t => {
    for (let i = 0; i < CLOCK.length - 1; i++) {
      const [ta, ma] = CLOCK[i], [tb, mb] = CLOCK[i + 1];
      if (t >= ta && t < tb) return Math.floor(ma + (mb - ma) * (t - ta) / (tb - ta));
    }
    return CLOCK[CLOCK.length - 1][1];
  };
  const hx = W - 30, hy = 4;
  let hud = `<rect x="${hx - 9}" y="${hy - 2}" width="36" height="9" fill="#1a1226" opacity=".72"/>`;
  hud += `<rect x="${hx - 9}" y="${hy + 7}" width="36" height="1" fill="#000" opacity=".3"/>`;
  const samp = C.sample(0, T, 10, t => minutes(t));
  const digitAt = (pos, m) => { const hh = String(Math.floor(m / 60) % 24).padStart(2, '0'), mm = String(m % 60).padStart(2, '0'); return (hh + mm)[pos]; };
  const dxs = [0, 4, 11, 15];
  for (let pos = 0; pos < 4; pos++) {
    for (let dgt = 0; dgt <= 9; dgt++) {
      const st = samp.map(([t, m]) => [t, digitAt(pos, m) === String(dgt) ? 1 : 0]);
      if (!st.some(s => s[1])) continue;
      hud += `<g opacity="0">${C.text(String(dgt), hx + dxs[pos], hy, '#ffe9b8')}${C.steps('opacity', st)}</g>`;
    }
  }
  hud += `<g>${C.text(':', hx + 7, hy, '#ffe9b8')}<animate attributeName="opacity" values="1;0.2" calcMode="discrete" dur="1s" repeatCount="indefinite"/></g>`;
  // sun / moon icon
  const isDay = t => minutes(t) < 18 * 60 + 30;
  const sun = `<path fill="#ffcf4a" d="M2 0h1v1h-1zM0 2h1v1h-1zM4 2h1v1h-1zM2 4h1v1h-1zM1 1h3v3h-3z"/>`;
  const moon = `<path fill="#fff1a8" d="M1 0h3v1h-3zM0 1h2v3h-2zM1 4h3v1h-3z"/>`;
  const dayS = C.sample(0, T, 4, t => (isDay(t) ? 1 : 0));
  hud += `<g transform="translate(${hx - 7} ${hy})"><g opacity="0">${sun}${C.steps('opacity', dayS)}</g><g opacity="0">${moon}${C.steps('opacity', dayS.map(([t, v]) => [t, 1 - v]))}</g></g>`;
  out.push(`<g id="hud">${hud}</g>`);

  // ---------- titles ----------
  const title = 'ねこのいちにち';
  const tw = kanaWidth(title, 2);
  const tx = Math.round((W - tw) / 2);
  const titleCard = (ty, sub, sub2) => {
    const ph = sub2 ? 44 : 36; let m = '<rect x="' + (tx - 12) + '" y="' + (ty - 8) + '" width="' + (tw + 24) + '" height="' + ph + '" fill="#120c1e" opacity=".72"/>' + '<rect x="' + (tx - 12) + '" y="' + (ty - 9) + '" width="' + (tw + 24) + '" height="1" fill="#ffd08c" opacity=".6"/><rect x="' + (tx - 12) + '" y="' + (ty - 8 + ph) + '" width="' + (tw + 24) + '" height="1" fill="#ffd08c" opacity=".6"/>' + kana(title, tx + 1, ty + 1, '#2b1d2e', 2) + kana(title, tx, ty, '#fff3e0', 2);
    const sw = C.textWidth(sub);
    m += C.text(sub, Math.round((W - sw) / 2), ty + 22, '#ffd08c');
    if (sub2) m += C.text(sub2, Math.round((W - C.textWidth(sub2)) / 2), ty + 30, '#b9a6d6');
    return m;
  };
  // opening title: dithers in and out
  const fadeGroup = (t0, t1, markup, fd = 0.5) => {
    let g = '';
    for (let k = 0; k < 4; k++) { // 4-step pixel "materialise" using bayer threshold masks
      const pid = C.newId('tm');
      let d = ''; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (C.bayer(x, y) < (k + 1) * 4) d += `M${x} ${y}h1v1h-1z`;
      C.def(`<pattern id="${pid}p" width="4" height="4" patternUnits="userSpaceOnUse"><path fill="#fff" d="${d}"/></pattern><mask id="${pid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${pid}p)"/></mask>`);
      const a = t0 + fd * k / 4, b = t1 - fd * (k + 1) / 4;
      g += `<g opacity="0" mask="url(#${pid})">${C.show(a, k === 3 ? b : a + fd / 4)}${markup}</g>`;
      if (k < 3) g += `<g opacity="0" mask="url(#${pid})">${C.show(b, b + fd / 4)}${markup}</g>`;
    }
    return g;
  };
  out.push(`<g id="title-open">${fadeGroup(0.9, 4.3, titleCard(46, "A CAT'S DAY"))}</g>`);
  out.push(`<g id="title-end">${fadeGroup(56.4, 59.4, titleCard(40, 'GOOD NIGHT, MIKAN', 'SEE YOU TOMORROW ♥'))}</g>`);

  // ---------- Bayer dither transitions to black ----------
  const bounds = SCENES.slice(1).map(s => s.t0);
  const FD = 0.45;
  const lvl = t => {
    if (t < 0.6) return 16 * (1 - t / 0.6);
    if (t >= T - 0.6) return 16 * (t - (T - 0.6)) / 0.6;
    for (const b of bounds) {
      if (t >= b - FD && t < b) return 16 * (t - (b - FD)) / FD;
      if (t >= b && t < b + FD) return 16 * (1 - (t - b) / FD);
    }
    return 0;
  };
  const ls = C.sample(0, T, 40, t => Math.round(C.clamp(lvl(t), 0, 16)));
  let tr = '';
  for (let k = 0; k < 16; k++) {
    const pid = C.newId('bt');
    let x = [0, 1, 2, 3].find(i => [0, 1, 2, 3].some(j => C.bayer(i, j) === k)), y = [0, 1, 2, 3].find(j => C.bayer(x, j) === k);
    C.def(`<pattern id="${pid}" width="4" height="4" patternUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="1" height="1" fill="#07040c"/></pattern>`);
    tr += `<rect width="${W}" height="${H}" fill="url(#${pid})" opacity="0">${C.steps('opacity', ls.map(([t, l]) => [t, l > k ? 1 : 0]))}</rect>`;
  }
  out.unshift(`<g id="transitions">${tr}</g>`);

  // ---------- CRT finish: scanlines + vignette ----------
  if (!opts.noCRT) {
    C.def(`<pattern id="scan" width="4" height="1" patternUnits="userSpaceOnUse"><rect y="0.8" width="4" height="0.2" fill="#000" opacity=".22"/></pattern>`);
    C.def(`<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".45"/></radialGradient>`);
    out.push(`<g id="crt" pointer-events="none"><rect width="${W}" height="${H}" fill="url(#scan)" shape-rendering="auto"/><rect width="${W}" height="${H}" fill="url(#vig)" shape-rendering="auto"/></g>`);
  }
  return out.join('\n');
};
module.exports.kana = kana;
module.exports.kanaWidth = kanaWidth;
