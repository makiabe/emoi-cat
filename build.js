// Build out/cat_day.svg from scenes + global overlays.
//   node build.js                -> full build
//   node build.js --only 3       -> only scene 3 rendered (others blank), for quick checks
'use strict';
const fs = require('fs');
const path = require('path');

// scene schedule (seconds on the global 60s loop)
const SCENES = [
  { n: 1, file: 's1_dawn.js',      t0: 0,  t1: 10, name: 'DAWN' },
  { n: 2, file: 's2_breakfast.js', t0: 10, t1: 19, name: 'BREAKFAST' },
  { n: 3, file: 's3_window.js',    t0: 19, t1: 29, name: 'WINDOW' },
  { n: 4, file: 's4_play.js',      t0: 29, t1: 39, name: 'PLAY' },
  { n: 5, file: 's5_rooftop.js',   t0: 39, t1: 49, name: 'ROOFTOP' },
  { n: 6, file: 's6_night.js',     t0: 49, t1: 60, name: 'NIGHT' },
];
// in-world clock per scene [t, minutesSinceMidnight]
const CLOCK = [
  [0, 6 * 60], [10, 7 * 60 + 10],
  [10, 7 * 60 + 30], [19, 8 * 60 + 15],
  [19, 12 * 60], [29, 13 * 60 + 30],
  [29, 15 * 60], [39, 16 * 60 + 30],
  [39, 17 * 60 + 40], [49, 19 * 60 + 5],
  [49, 21 * 60 + 30], [60, 23 * 60 + 59],
];

function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

function buildSVG(opts = {}) {
  // reset engine state per build
  for (const k of Object.keys(require.cache)) if (k.includes(path.join(__dirname, 'lib')) || k.includes(path.join(__dirname, 'scenes'))) delete require.cache[k];
  const C = require('./lib/core');
  const cat = require('./lib/cat');
  const overlay = require('./lib/overlay');
  C.resetDefs();
  const body = [];
  for (const s of SCENES) {
    if (opts.only && opts.only !== s.n) continue;
    const f = path.join(__dirname, 'scenes', s.file);
    let markup = '';
    if (fs.existsSync(f)) {
      try { markup = freshRequire(f)({ t0: s.t0, t1: s.t1, C, cat }); }
      catch (e) { console.error(`[scene ${s.n}] ERROR: ${e.stack}`); markup = `<rect width="${C.W}" height="${C.H}" fill="#1b1733"/>`; }
    } else {
      markup = `<rect width="${C.W}" height="${C.H}" fill="#1b1733"/>`;
    }
    body.push(`<g id="scene${s.n}" opacity="0">${C.show(s.t0, s.t1)}${markup}</g>`);
  }
  const over = overlay({ C, cat, SCENES, CLOCK, opts });
  let music = '';
  if (!opts.noScript && fs.existsSync(path.join(__dirname, 'lib', 'music.js'))) {
    try { music = freshRequire('./lib/music')({ C }); } catch (e) { console.error('[music] ERROR', e.stack); }
  }
  const w = opts.width || 1280, h = opts.height || 720;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ${opts.cls ? `class="${opts.cls}" ` : ''}width="${w}" height="${h}" viewBox="0 0 ${C.W} ${C.H}" shape-rendering="crispEdges" style="image-rendering:pixelated;background:#000">
<title>ねこのいちにち — A Cat's Day (pixel art, 60s loop)</title>
<defs>
${C.getDefs()}
</defs>
<rect width="${C.W}" height="${C.H}" fill="#000"/>
${body.join('\n')}
${over}
${music}
</svg>`;
}

module.exports = { buildSVG, SCENES, CLOCK };

if (require.main === module) {
  const a = process.argv.slice(2);
  const only = a.includes('--only') ? +a[a.indexOf('--only') + 1] : 0;
  const out = a.includes('--out') ? a[a.indexOf('--out') + 1] : path.join(__dirname, 'out', 'cat_day.svg');
  const svg = buildSVG({ only });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg);
  console.log(`wrote ${out} (${(svg.length / 1024).toFixed(1)} KB)`);
  if (!only && !a.includes('--out')) {
    const pf = path.join(path.dirname(out), 'player.html');
    const html = require('./tools/player')(svg, SCENES);
    fs.writeFileSync(pf, html);
    fs.writeFileSync(path.join(path.dirname(out), 'index.html'), html);
    console.log(`wrote ${pf}`);
  }
}
