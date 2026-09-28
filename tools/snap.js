// Render frames of the animation to a PNG contact sheet with headless Chrome.
//   node tools/snap.js --times 0.5,3,7.5 [--only 1] [--cols 3] [--scale 2] [--out tmp/x.png]
// Each frame is the SVG paused at that global time. Frames are labelled with their time.
// You can then view the PNG with the Read tool.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildSVG } = require('../build');

const a = process.argv.slice(2);
const arg = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
const times = arg('--times', '1').split(',').map(Number);
const only = +arg('--only', 0);
const scale = +arg('--scale', times.length === 1 ? 4 : 2);
const cols = +arg('--cols', Math.min(times.length, 3));
const out = path.resolve(arg('--out', `tmp/snap_${process.pid}.png`));
const noCRT = a.includes('--nocrt');

const fw = 256 * scale, fh = 144 * scale;
let svg = buildSVG({ only, noScript: true, noCRT, width: fw, height: fh, cls: 'f' });
const rows = Math.ceil(times.length / cols);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#333;font:bold 14px monospace;color:#fff}
.g{display:grid;grid-template-columns:repeat(${cols},${fw}px);gap:4px;padding:4px}
.c{position:relative;width:${fw}px;height:${fh}px}
.c b{position:absolute;left:4px;top:4px;background:#000a;padding:1px 4px;z-index:2}
svg{display:block}
</style></head><body><div class="g">
${times.map(t => `<div class="c"><b>t=${t}</b>${svg}</div>`).join('\n')}
</div><script>
const T=${JSON.stringify(times)};
document.querySelectorAll('svg.f').forEach((s,i)=>{s.pauseAnimations();s.setCurrentTime(T[i]);});
</script></body></html>`;
fs.mkdirSync(path.join(__dirname, '..', 'tmp'), { recursive: true });
const hf = path.join(__dirname, '..', 'tmp', `snap_${process.pid}.html`);
fs.writeFileSync(hf, html);
const chrome = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const W = cols * (fw + 4) + 4, H = rows * (fh + 4) + 4;
execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--window-size=${W},${H}`, '--virtual-time-budget=3000', `--screenshot=${out}`, 'file:///' + hf.replace(/\\/g, '/')], { stdio: 'pipe' });
fs.unlinkSync(hf);
console.log(out);
