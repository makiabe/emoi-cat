// Build and validate the deployable site without installing dependencies.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const required = [
  'build.js', 'tools/player.js',
  'lib/core.js', 'lib/cat.js', 'lib/overlay.js', 'lib/music.js',
  'scenes/s1_dawn.js', 'scenes/s2_breakfast.js', 'scenes/s3_window.js',
  'scenes/s4_play.js', 'scenes/s5_rooftop.js', 'scenes/s6_night.js', 'scenes/s6_dream.js',
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `Missing source: ${file}`);
const result = spawnSync(process.execPath, ['build.js'], {
  cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
assert.equal(result.status, 0, 'Build process failed');
// The original renderer logs scene errors and substitutes a blank scene. Reject that in CI.
assert.equal(result.stderr.trim(), '', 'Build reported errors; refusing to publish a partial animation');
const svg = fs.readFileSync(path.join(root, 'out/cat_day.svg'), 'utf8');
const html = fs.readFileSync(path.join(root, 'out/index.html'), 'utf8');
assert.equal(html, fs.readFileSync(path.join(root, 'out/player.html'), 'utf8'));
for (let i = 1; i <= 6; i++) assert.ok(svg.includes(`id="scene${i}"`), `Missing scene ${i}`);
assert.ok(svg.includes('viewBox="0 0 256 144"'));
assert.ok(svg.includes('window.__catDayMusic = api'));
assert.ok(html.includes(svg), 'The player must contain the complete animation and sound script');
for (const id of ['stage', 'bar', 'pp', 'tm', 'snd-btn']) assert.ok(html.includes(`id="${id}"`), `Missing control: ${id}`);
const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const match of svg.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.has(match[1]), `Unresolved sprite: ${match[1]}`);
assert.ok(!svg.includes('__CAT__'), 'Unresolved scene placeholder');
fs.writeFileSync(path.join(root, 'out/.nojekyll'), '');
console.log('PASS: six scenes, audio, controls, sprite references, and self-contained Pages output.');
