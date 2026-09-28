// Synthesized chiptune soundtrack + pixel sound toggle for "A Cat's Day".
// module.exports = ({ C }) => markup (button + <script>), injected at the end of the root <svg>.
// The music follows the SVG document clock (svg.getCurrentTime() % 60) with a lookahead scheduler.
'use strict';

// ============================================================================================
// Runtime (serialized into the SVG via Function.prototype.toString). Plain ES2017, no modules.
// ============================================================================================
function catDayMusic(window, document) {
  var LOOP = 60, LOOK = 0.3, TICK = 50, VOL = 0.5;

  // ---------- helpers ----------
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) {
    if (typeof n === 'number') return n;
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (+m[3] + 1);
  }
  function hz(n) { return 440 * Math.pow(2, (midi(n) - 69) / 12); }

  // ============================================================================================
  // COMPOSITION — a list of events on the 60 s loop: notes {t,i,f,d,v} and sfx {t,fx,a}
  // ============================================================================================
  var EV = [];
  // global dynamics: fade in from the loop start, fade to silence under the end title
  function dyn(t) {
    if (t < 1.2) return 0.3 + 0.7 * t / 1.2;
    if (t >= 56.4) return Math.max(0, 1 - (t - 56.4) / 3);
    return 1;
  }
  function N(t, i, n, d, v) {
    if (t >= 59.5) return;
    var vv = v * dyn(t);
    if (vv <= 0.001) return;
    var e = { t: t, i: i, f: hz(n), d: d, v: vv };
    if (t >= 49) e.cap = 59.45 - t; // everything in S6 is silent by ~59.6
    EV.push(e);
  }
  function F(t, fx, a) { EV.push({ t: t, fx: fx, a: a }); }
  // "C5/1 E5/.5 r/.5 C4+E4/2" (durations in beats)
  function seq(t, b, i, str, v) {
    str.trim().split(/\s+/).forEach(function (tok) {
      var p = tok.split('/'), d = parseFloat(p[1]) * b;
      if (p[0] !== 'r') p[0].split('+').forEach(function (n) { N(t, i, n, d, v); });
      t += d;
    });
    return t;
  }
  // arpeggio over chord tones; pattern index >= chord length wraps up an octave
  function arp(t, step, i, ch, pat, count, v, tr, vf) {
    var ms = ch.map(midi);
    for (var k = 0; k < count; k++) {
      var p = pat[k % pat.length];
      var m = ms[p % ms.length] + 12 * Math.floor(p / ms.length) + (tr || 0);
      N(t + k * step, i, m, step * 1.5, v * (vf ? vf(k) : 1));
    }
  }

  (function compose() {
    var k, t, c, r;

    // ---------------- S1 DAWN 0–10 · F major · 72 bpm · music box, sleepy → brightening ----------------
    var b = 60 / 72, h = b * 2;
    var s1 = [['F4', 'A4', 'C5', 'E5'], ['D4', 'F4', 'A4', 'E5'], ['Bb3', 'D4', 'F4', 'A4']];
    for (c = 0; c < 3; c++) arp(c * h, b / 2, 'bell', s1[c], [0, 2, 1, 3], 4, 0.085, 12);
    arp(3 * h, b / 2, 'bell', ['C4', 'F4', 'G4', 'C5'], [0, 2], 2, 0.075, 12);           // Csus4 (5.0)
    arp(5.625, b / 4, 'bell', ['C4', 'E4', 'G4', 'C5'], [0, 1, 2, 3, 4], 5, 0.065, 12);   // sun is up: 16ths
    arp(4 * h, b / 4, 'bell', ['A3', 'C4', 'F4', 'A4'], [0, 1, 2, 3, 5, 6, 7, 6], 8, 0.06, 12);
    arp(5 * h, b / 4, 'bell', ['G3', 'Bb3', 'D4', 'F4'], [0, 1, 2, 3], 4, 0.06, 12);
    arp(5 * h + b, b / 4, 'bell', ['C4', 'E4', 'G4', 'Bb4'], [0, 1, 2, 3], 4, 0.06, 12);
    [[0, 'F2', 'C3', h], [h, 'D2', 'A2', h], [2 * h, 'Bb1', 'F2', h], [3 * h, 'C2', 'G2', h],
     [4 * h, 'A1', 'F2', h], [5 * h, 'G1', 'D2', b], [5 * h + b, 'C2', 'G2', b]].forEach(function (p) {
      N(p[0], 'pad', p[1], p[3], 0.07); N(p[0], 'pad', p[2], p[3], 0.045);
    });
    seq(5.0, b, 'flute', 'G5/1 A5/.5 C6/.5 A5/1.5 G5/.5 F5/.5 G5/.5 Bb5/.5 C6/.5', 0.075);
    F(0.5, 'snore', 1); F(2.1, 'snore', 1); F(3.7, 'snore', 0.9); F(5.0, 'snore', 0.5);
    F(5.5, 'shimmer'); F(6.2, 'twitch'); F(6.8, 'blink'); F(7.6, 'yawn'); F(8.8, 'hop');

    // ---------------- S2 BREAKFAST 10–19 · F major · 120 bpm · bouncy oom-pah ----------------
    var FF = ['F4', 'A4', 'C5'];
    var ch2 = [[10, 'F2', 'C3', FF], [11, 'F2', 'C3', FF], [12, 'D2', 'A2', FF], [13, 'G2', 'D3', ['F4', 'G4', 'B4']],
               [14, 'C2', 'G2', ['E4', 'G4', 'Bb4']], [15, 'F2', 'C3', FF], [16, 'Bb1', 'F2', ['F4', 'Bb4', 'D5']],
               [17, 'C2', 'G2', ['E4', 'G4', 'Bb4']]];
    ch2.forEach(function (p) {
      N(p[0], 'bassS', p[1], 0.4, 0.15); N(p[0] + 0.5, 'bassS', p[2], 0.4, 0.13);
      p[3].forEach(function (n) { N(p[0] + 0.25, 'stab', n, 0.12, 0.03); N(p[0] + 0.75, 'stab', n, 0.12, 0.03); });
      F(p[0], 'kick', 0.2);
      if (p[0] < 14) F(p[0] + 0.5, 'snare', 0.07);
    });
    N(18, 'bassS', 'F2', 0.4, 0.13); FF.forEach(function (n) { N(18.25, 'stab', n, 0.12, 0.028); });
    N(18.5, 'bassS', 'G2', 0.4, 0.12); ['G4', 'B4', 'D5'].forEach(function (n) { N(18.75, 'stab', n, 0.12, 0.025); });
    F(18, 'kick', 0.12);
    for (t = 10.25; t < 18.9; t += 0.5) F(t, 'hat', 0.025);
    seq(10, 0.5, 'lead', 'C5/.5 F5/.5 A5/.5 F5/.5 G5/.5 A5/.25 G5/.25 F5/1 ' +
                         'r/3 B4/.25 D5/.25 G5/.5 ' +
                         'E5/.5 G5/.5 Bb5/.5 G5/.5 A5/1 F5/1 ' +
                         'D5/.5 F5/.5 Bb5/1 C6/.5 Bb5/.25 A5/.25 G5/1 ' +
                         'A5/.5 B5/.5', 0.07);
    F(12.4, 'meow', 1); F(13.0, 'meow', 1.13);
    F(13.6, 'pour', 1.6);
    r = rng(7);
    for (t = 13.62; t < 15.2; t += 0.035 + r() * 0.06) F(t, 'tink', r());
    for (t = 15.3; t <= 17.6; t += 0.29) F(t, 'crunch');
    F(17.0, 'heart'); F(18.0, 'lick');

    // ---------------- S3 WINDOW 19–29 · C major · 96 bpm · airy triangle flute ----------------
    var b3 = 0.625, B3 = 2.5;
    var ch3 = [['C4', 'E4', 'G4', 'B4'], ['F4', 'A4', 'C5', 'E5'], ['A3', 'C4', 'E4', 'G4']];
    for (c = 0; c < 3; c++) arp(19 + c * B3, b3 / 2, 'arp12', ch3[c], [0, 1, 2, 3, 2, 3, 1, 2], 8, 0.032, 12);
    arp(26.5, b3, 'arp12', ['F4', 'A4', 'C5', 'E5'], [0, 2], 2, 0.026, 12);
    arp(27.75, b3, 'arp12', ['D4', 'F#4', 'A4', 'C5'], [0, 2], 2, 0.022, 12);
    [[19, 'C2', 2.4], [21.5, 'F2', 2.4], [24, 'A1', 2.4], [26.5, 'F2', 1.2], [27.75, 'D2', 1.2]].forEach(function (p) {
      N(p[0], 'bass', p[1], p[2], 0.1); N(p[0], 'pad', p[1], p[2], 0.03);
    });
    seq(19, b3, 'flute', 'E5/1.5 G5/.5 B5/1 A5/1 A5/2 G5/.5 E5/.5 C5/1 ' +
                         'r/1 E5/.5 G5/.5 C6/1.5 B5/.5 A5/2 F#5/2', 0.1);
    for (t = 19 + b3 / 2; t < 26.5; t += b3) F(t, 'hat', 0.014);
    [21.0, 21.1, 21.7, 21.78, 21.86, 22.8, 23.3, 23.4, 23.9, 24.6, 24.68].forEach(function (x, j) { F(x, 'chirp', (j * 0.37) % 1); });
    [[22.0, 22.4], [22.55, 22.95], [23.1, 23.5]].forEach(function (w) {
      for (var x = w[0]; x < w[1]; x += 1 / 14) F(x, 'chat', (x * 7.3) % 1);
    });
    F(24.0, 'tap'); F(24.4, 'tap');
    F(24.8, 'flutter'); F(24.9, 'chirp', 0.8);
    F(25.5, 'sparkle');
    F(27.9, 'snore', 0.45);

    // ---------------- S4 PLAY 29–39 · G major · 144 bpm · upbeat & funny ----------------
    var b4 = 60 / 144, B4 = b4 * 4, e4 = b4 / 2;
    var bar = function (n) { return 29 + n * B4; };
    var oct = function (t0, notes) { notes.forEach(function (n, j) { if (n !== 'r') N(t0 + j * e4, 'bassS', n, e4 * 0.9, 0.15); }); };
    oct(bar(0), ['G2', 'G3', 'G2', 'G3', 'G2', 'G3', 'G2', 'G3']);
    ['G2', 'G#2', 'A2', 'A#2'].forEach(function (n, j) { N(bar(1) + j * b4, 'bassS', n, 0.12, 0.14); });
    oct(bar(2), ['C2', 'C3', 'C2', 'C3', 'D2', 'D3', 'D2', 'D3']);
    oct(bar(3), ['G2', 'G3', 'G2', 'G3', 'E2', 'E3', 'E2', 'E3']);
    oct(bar(4), ['A2', 'r', 'A2', 'r', 'D2', 'r', 'D2', 'r']);
    seq(bar(5), b4, 'bassS', 'D2/.5 r/.5 G2/1 D2/1 G1/1', 0.15);
    seq(bar(0), b4, 'lead', 'D5/.5 G5/.5 r/.5 G5/.25 A5/.25 B5/.5 A5/.5 G5/1', 0.075);
    for (k = 0; k < 12; k++) N(bar(1) + b4 + k * b4 / 4, 'stab', k % 2 ? 'Eb5' : 'D5', b4 / 4, 0.025 + k * 0.005); // butt wiggle trill
    seq(bar(2), b4, 'lead', 'C6/1 r/1 G5/.25 E5/.25 D5/.25 B4/.25 A4/.25 G4/.25 E4/.25 D4/.25', 0.075);
    seq(bar(3), b4, 'lead', 'B4/.5 D5/.5 G5/.5 B5/.5 A5/.5 G5/.5 E5/1', 0.075);
    seq(bar(4), b4, 'sq', 'E5/.5 r/.5 C5/.5 r/.5 F#5/.5 r/.5 D5/.5 r/.5', 0.045); // tiptoe
    seq(bar(5), b4, 'lead', 'r/.5 D5/.25 G5/.25 B5/.5 D6/.5 G6/1 r/1', 0.075);      // "!" fanfare
    seq(bar(5), b4, 'lead12', 'r/.5 B4/.25 D5/.25 G5/.5 B5/.5 D6/1 r/1', 0.035);
    var st = function (t0, ch) { for (var j = 0; j < 4; j++) ch.forEach(function (n) { N(t0 + j * b4 + e4, 'stab', n, 0.1, 0.025); }); };
    st(bar(0), ['G4', 'B4', 'D5']);
    st(bar(3), ['G4', 'B4', 'D5']);
    for (k = 0; k < 4; k++) {
      F(bar(0) + k * b4, k % 2 ? 'snare' : 'kick', k % 2 ? 0.09 : 0.22);
      F(bar(3) + k * b4, k % 2 ? 'snare' : 'kick', k % 2 ? 0.09 : 0.22);
    }
    for (k = 0; k < 8; k++) { F(bar(0) + k * e4, 'hat', 0.03); F(bar(3) + k * e4, 'hat', 0.03); }
    for (k = 0; k < 16; k++) F(bar(1) + k * b4 / 4, 'hat', 0.008 + k * 0.0022); // suspense ticking
    F(bar(2), 'kick', 0.22); F(bar(2), 'crash', 0.05); F(bar(2) + 2 * b4, 'kick', 0.15);
    F(bar(4), 'kick', 0.1);
    F(bar(5) + b4, 'kick', 0.2); F(bar(5) + 2 * b4, 'snare', 0.09); F(bar(5) + 3 * b4, 'kick', 0.18); F(bar(5) + 3 * b4, 'crash', 0.035);
    F(30.2, 'yarn'); F(32.4, 'boing'); F(33.2, 'tumble'); F(35.6, 'thud');
    F(36.5, 'bonk'); F(37.05, 'bonk'); F(37.5, 'pop');

    // ---------------- S5 ROOFTOP 39–49 · D yonanuki pentatonic · 72 bpm · nostalgic ----------------
    var b5 = 60 / 72, h5 = b5 * 2;
    var ch5 = [[39, 'G2', ['G3', 'D4', 'F#4', 'B4'], 4], [39 + h5, 'A2', ['A3', 'E4', 'A4', 'C#5'], 4],
               [39 + 2 * h5, 'F#2', ['F#3', 'C#4', 'E4', 'A4'], 4], [39 + 3 * h5, 'B1', ['B3', 'F#4', 'A4', 'D5'], 4],
               [39 + 4 * h5, 'G2', ['G3', 'D4', 'F#4', 'B4'], 4], [39 + 5 * h5, 'A2', ['A3', 'D4', 'E4', 'A4'], 2],
               [39 + 5 * h5 + b5, 'A2', ['A3', 'E4', 'A4', 'C#5'], 2]];
    ch5.forEach(function (p) {
      arp(p[0], b5 / 2, 'koto', p[2], [0, 1, 2, 3], p[3], 0.06);
      var d = p[3] * b5 / 2;
      N(p[0], 'pad', p[1], d, 0.08);
      N(p[0], 'pad', p[2][1], d, 0.022); N(p[0], 'pad', p[2][2], d, 0.02);
    });
    seq(39, b5, 'leadv', 'B4/.5 D5/.5 E5/1 F#5/1.5 E5/.5 A5/1 F#5/.5 E5/.5 D5/1.5 B4/.5 ' +
                         'E5/1.5 F#5/.5 A5/1 E5/1', 0.07);
    F(41.8, 'caw', 1); F(42.3, 'caw', 0.9);
    F(43.5, 'templebell');
    F(45.2, 'bloop', 'A5'); F(45.8, 'bloop', 'B5'); F(46.4, 'bloop', 'D6'); F(47.0, 'bloop', 'E6');
    F(47.5, 'twinkle');

    // ---------------- S6 NIGHT 49–60 · D major · 3/4 68 bpm · music-box lullaby → silence ----------------
    var b6 = 60 / 68, B6 = b6 * 3, e6 = b6 / 2;
    var D = ['D4', 'A4', 'F#5'], G = ['G3', 'D4', 'B4'], A = ['A3', 'E4', 'C#5'], Bm = ['B3', 'F#4', 'D5'];
    var lb = function (t0, ch, from, to, v) { for (var j = from; j < to; j++) N(t0 + j * e6, 'bell', midi(ch[[0, 1, 2, 1, 2, 1][j]]), e6 * 2, v); };
    lb(49, D, 0, 6, 0.045);
    lb(49 + B6, G, 0, 4, 0.045); lb(49 + B6, A, 4, 6, 0.045);
    lb(49 + 2 * B6, Bm, 0, 4, 0.04); lb(49 + 2 * B6, G, 4, 6, 0.04);
    lb(49 + 3 * B6, D, 0, 3, 0.035);
    seq(49, b6, 'bell', 'A5/1.5 F#5/.5 E5/1 B5/1.5 A5/.5 E5/1 F#5/2 D5/1 D5+A4/3', 0.09);
    [[49, 'D2', 3], [49 + B6, 'G2', 2], [49 + B6 + 2 * b6, 'A2', 1], [49 + 2 * B6, 'B1', 2], [49 + 2 * B6 + 2 * b6, 'G1', 1],
     [49 + 3 * B6, 'D2', 3]].forEach(function (p) { N(p[0], 'pad', p[1], p[2] * b6, 0.07); });
    F(52.6, 'purr'); F(53.5, 'harp'); F(53.95, 'bubble', 0); F(54.25, 'bubble', 1);
    F(54.8, 'shooting'); F(55.6, 'click');
  })();
  EV.sort(function (a, b) { return a.t - b.t; });

  // ============================================================================================
  // SYNTH
  // ============================================================================================
  var ctx = null, master, bus, sess, WAVES = {}, NB = null;

  function init() {
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500; lp.Q.value = 0.4;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
    bus = ctx.createGain(); bus.gain.value = 1;
    // feedback delay "room"
    var dl = ctx.createDelay(1); dl.delayTime.value = 0.27;
    var fb = ctx.createGain(); fb.gain.value = 0.33;
    var dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400;
    var wet = ctx.createGain(); wet.gain.value = 0.22;
    bus.connect(lp);
    bus.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(wet); wet.connect(lp);
    lp.connect(comp); comp.connect(master); master.connect(ctx.destination);
    sess = ctx.createGain(); sess.connect(bus);
    var pulse = function (duty) {
      var n = 64, re = new Float32Array(n), im = new Float32Array(n);
      for (var k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
      return ctx.createPeriodicWave(re, im);
    };
    WAVES.p25 = pulse(0.25); WAVES.p12 = pulse(0.125);
    NB = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var ch = NB.getChannelData(0), r = rng(99);
    for (var i = 0; i < ch.length; i++) ch[i] = r() * 2 - 1;
  }

  // attack → (decay to sustain) → release at t+hold
  function env(p, t, hold, v, a, dec, r, sus) {
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(v, t + a);
    if (dec) p.setTargetAtTime(v * (sus || 0), t + a, dec);
    p.setTargetAtTime(0, t + Math.max(hold, a), r / 5);
  }
  function mkOsc(w, f, t) {
    var o = ctx.createOscillator();
    if (WAVES[w]) o.setPeriodicWave(WAVES[w]); else o.type = w;
    o.frequency.setValueAtTime(f, t);
    return o;
  }
  function addVib(param, t, f, vib, end) {
    var l = ctx.createOscillator(); l.frequency.value = vib[0];
    var lg = ctx.createGain(), t1 = t + (vib[2] || 0) + 0.12;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * vib[1], t1);
    if (vib[3]) lg.gain.setTargetAtTime(0, t1, vib[3]);
    l.connect(lg); lg.connect(param); l.start(t); l.stop(end);
  }
  function mkFilter(fl, t) {
    var f = ctx.createBiquadFilter(); f.type = fl.type || 'lowpass'; f.Q.value = fl.q || 0.7;
    f.frequency.setValueAtTime(fl.pts[0][1], t);
    for (var i = 1; i < fl.pts.length; i++) f.frequency.exponentialRampToValueAtTime(fl.pts[i][1], t + fl.pts[i][0]);
    return f;
  }
  // generic tone: o = {w, f | pts:[[dt,hz]..], a, dec, s, r, vib:[rate,depth,delay,decay], flt:{type,q,pts}}
  function tone(t, hold, v, o) {
    var f0 = o.pts ? o.pts[0][1] : o.f, r = o.r || 0.05, end = t + hold + r + 0.1;
    var s = mkOsc(o.w || 'square', f0, t);
    if (o.pts) for (var i = 1; i < o.pts.length; i++) s.frequency.exponentialRampToValueAtTime(o.pts[i][1], t + o.pts[i][0]);
    if (o.vib) addVib(s.frequency, t, f0, o.vib, end);
    var g = ctx.createGain();
    env(g.gain, t, hold, v, o.a || 0.005, o.dec, r, o.s);
    if (o.flt) { var fl = mkFilter(o.flt, t); s.connect(fl); fl.connect(g); } else s.connect(g);
    g.connect(o.dst || sess);
    s.start(t); s.stop(end);
    return g;
  }
  // noise burst: o = {type, f, f2, q, a, dec, r, rate, am:[rate, depth]}
  function noise(t, hold, v, o) {
    o = o || {};
    var r = o.r || 0.05, end = t + hold + r + 0.1;
    var s = ctx.createBufferSource(); s.buffer = NB; s.loop = true;
    if (o.rate) s.playbackRate.value = o.rate;
    var fl = mkFilter({ type: o.type || 'bandpass', q: o.q || 1, pts: o.f2 ? [[0, o.f || 1000], [hold, o.f2]] : [[0, o.f || 1000]] }, t);
    var g = ctx.createGain();
    env(g.gain, t, hold, v, o.a || 0.002, o.dec, r, o.s);
    s.connect(fl);
    if (o.am) {
      var am = ctx.createGain(); am.gain.value = 1 - o.am[1] / 2;
      var l = ctx.createOscillator(); l.type = o.amType || 'square'; l.frequency.value = o.am[0];
      var lg = ctx.createGain(); lg.gain.value = o.am[1] / 2;
      l.connect(lg); lg.connect(am.gain); l.start(t); l.stop(end);
      fl.connect(am); am.connect(g);
    } else fl.connect(g);
    g.connect(sess);
    s.start(t, Math.random() * 0.5); s.stop(end);
  }

  var INST = {
    bell:   { w: 'triangle', a: 0.003, dec: 0.42, s: 0, r: 0.3, min: 1.3, p2: { w: 'sine', mul: 4, v: 0.22, dec: 0.1 } },
    harp:   { w: 'triangle', a: 0.002, dec: 0.5, s: 0, r: 0.3, min: 1.0, p2: { w: 'sine', mul: 2, v: 0.3, dec: 0.2 } },
    flute:  { w: 'triangle', a: 0.06, dec: 0.3, s: 0.85, r: 0.16, vib: [5.2, 0.011, 0.22] },
    lead:   { w: 'p25', a: 0.006, dec: 0.12, s: 0.6, r: 0.05, gate: 0.85 },
    leadv:  { w: 'p25', a: 0.03, dec: 0.4, s: 0.75, r: 0.25, vib: [5, 0.012, 0.25], lp: 2400 },
    lead12: { w: 'p12', a: 0.006, dec: 0.15, s: 0.5, r: 0.08, gate: 0.85 },
    sq:     { w: 'square', a: 0.003, dec: 0.05, s: 0.2, r: 0.04, gate: 0.6, lp: 3000 },
    stab:   { w: 'p12', a: 0.003, dec: 0.05, s: 0.3, r: 0.03 },
    arp12:  { w: 'p12', a: 0.004, dec: 0.12, s: 0.12, r: 0.12, lp: 4000 },
    koto:   { w: 'p12', a: 0.002, dec: 0.22, s: 0, r: 0.2, bend: 1.02, min: 0.9, lp: 3000 },
    bass:   { w: 'triangle', a: 0.005, dec: 0.3, s: 0.75, r: 0.08 },
    bassS:  { w: 'triangle', a: 0.003, dec: 0.08, s: 0.5, r: 0.03, gate: 0.75 },
    pad:    { w: 'triangle', a: 0.35, dec: 1.0, s: 0.85, r: 0.5, det: 6 },
  };
  function voice(I, f, t, d, v, cap) {
    var hold = Math.max(d * (I.gate || 1), I.min || 0);
    if (cap != null) hold = Math.min(hold, Math.max(cap, 0.02));
    var o = { w: I.w, a: I.a, dec: I.dec, s: I.s, r: I.r, vib: I.vib, flt: I.lp ? { pts: [[0, I.lp]] } : null };
    if (I.bend) o.pts = [[0, f * I.bend], [0.06, f]]; else o.f = f;
    tone(t, hold, v, o);
    if (I.det) { o.pts = null; o.f = f * Math.pow(2, I.det / 1200); tone(t, hold, v * 0.7, o); }
    if (I.p2) tone(t, Math.min(hold, 0.3), v * I.p2.v, { w: I.p2.w, f: f * I.p2.mul, a: 0.002, dec: I.p2.dec, s: 0, r: 0.1 });
  }

  // ---------- sound effects (t = audio time) ----------
  var FX = {
    kick: function (t, v) { tone(t, 0.16, v, { w: 'sine', pts: [[0, 150], [0.12, 42]], a: 0.002, dec: 0.08, r: 0.05 }); },
    snare: function (t, v) {
      noise(t, 0.1, v, { type: 'bandpass', f: 2200, q: 0.7, dec: 0.045 });
      tone(t, 0.06, v * 0.5, { w: 'triangle', pts: [[0, 200], [0.06, 140]], dec: 0.03 });
    },
    hat: function (t, v) { noise(t, 0.03, v, { type: 'highpass', f: 7000, dec: 0.012, r: 0.02 }); },
    crash: function (t, v) { noise(t, 0.8, v, { type: 'highpass', f: 5000, dec: 0.3, r: 0.3 }); },

    snore: function (t, v) { // z-z: breathy puff + nasal buzz + two tiny "z" pops
      noise(t, 0.8, 0.05 * v, { type: 'bandpass', f: 700, f2: 380, q: 2, a: 0.45, r: 0.5 });
      tone(t, 0.8, 0.018 * v, { w: 'p12', pts: [[0, 104], [0.8, 92]], a: 0.4, r: 0.4, flt: { pts: [[0, 500]] } });
      tone(t + 0.9, 0.04, 0.012 * v, { w: 'p12', f: hz('C6'), dec: 0.03 });
      tone(t + 1.08, 0.04, 0.01 * v, { w: 'p12', f: hz('A5'), dec: 0.03 });
    },
    shimmer: function (t) { // sunrise: rising pentatonic sparkle + airy swell
      ['F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6', 'C7', 'D7', 'F7', 'A7'].forEach(function (n, k) {
        voice(INST.bell, hz(n), t + k * 0.055, 0.3, 0.045 * (1 - k * 0.05));
      });
      noise(t, 0.5, 0.018, { type: 'highpass', f: 6000, a: 0.3, r: 0.6 });
    },
    twitch: function (t) { tone(t, 0.03, 0.02, { w: 'square', pts: [[0, 1800], [0.03, 2600]], dec: 0.02, r: 0.02 }); },
    blink: function (t) { voice(INST.bell, hz('A6'), t, 0.2, 0.035); voice(INST.bell, hz('C7'), t + 0.08, 0.2, 0.03); },
    yawn: function (t) { // "fwaaaah" — pitch glide through a moving formant
      tone(t, 0.9, 0.09, { w: 'p12', pts: [[0, 330], [0.35, 520], [0.6, 480], [1.0, 250]], a: 0.15, r: 0.2,
        vib: [6, 0.015, 0.3], flt: { type: 'lowpass', q: 4, pts: [[0, 600], [0.35, 1800], [1.0, 700]] } });
      noise(t, 0.8, 0.018, { type: 'bandpass', f: 1200, q: 1.5, a: 0.2, r: 0.3 });
    },
    hop: function (t) {
      tone(t, 0.1, 0.055, { w: 'square', pts: [[0, 260], [0.12, 900]], r: 0.04, flt: { pts: [[0, 3500]] } });
      noise(t + 0.34, 0.05, 0.06, { type: 'lowpass', f: 300, dec: 0.04 });
    },
    meow: function (t, k) { // "nya!"
      var d = k > 1 ? 0.3 : 0.36;
      tone(t, d, 0.11, { w: 'p25', pts: [[0, 480 * k], [0.06, 820 * k], [0.18, 760 * k], [d + 0.02, 520 * k]], a: 0.02, r: 0.06,
        vib: [9, 0.02, 0.1], flt: { type: 'bandpass', q: 3, pts: [[0, 900], [0.08, 2200], [0.2, 1500], [d, 900]] } });
    },
    pour: function (t, d) { noise(t, d, 0.014, { type: 'bandpass', f: 3200, q: 0.8, a: 0.2, r: 0.3 }); },
    tink: function (t, x) {
      var f = 2400 + x * 1800;
      tone(t, 0.02, 0.03 + x * 0.02, { w: 'sine', pts: [[0, f], [0.05, f * 0.97]], a: 0.001, dec: 0.035, r: 0.06 });
      if (x > 0.6) tone(t, 0.02, 0.02, { w: 'triangle', f: f / 2, a: 0.001, dec: 0.03, r: 0.05 });
    },
    crunch: function (t) {
      noise(t, 0.05, 0.09, { type: 'bandpass', f: 1800, q: 0.9, dec: 0.03 });
      noise(t + 0.07, 0.04, 0.06, { type: 'bandpass', f: 2600, q: 0.9, dec: 0.025 });
      noise(t, 0.05, 0.05, { type: 'lowpass', f: 450, dec: 0.03 });
    },
    heart: function (t) {
      ['F6', 'A6', 'C7', 'F7'].forEach(function (n, k) { voice(INST.bell, hz(n), t + k * 0.09, 0.3, 0.05); });
    },
    lick: function (t) {
      tone(t, 0.07, 0.03, { w: 'p12', pts: [[0, 700], [0.08, 1100]], r: 0.03 });
      tone(t + 0.15, 0.07, 0.025, { w: 'p12', pts: [[0, 750], [0.08, 1200]], r: 0.03 });
    },
    chirp: function (t, x) {
      var f = 2600 + x * 900;
      tone(t, 0.06, 0.04, { w: 'sine', pts: [[0, f], [0.04, f * 1.6], [0.08, f * 1.2]], a: 0.003, r: 0.02 });
    },
    chat: function (t, x) { // "k-k-k" cat chatter
      tone(t, 0.02, 0.032, { w: 'square', f: 820 + x * 180, a: 0.001, dec: 0.012, r: 0.02, flt: { pts: [[0, 2500]] } });
      noise(t, 0.008, 0.025, { type: 'highpass', f: 3000, r: 0.01 });
    },
    tap: function (t) {
      tone(t, 0.02, 0.06, { w: 'sine', f: 1900, a: 0.001, dec: 0.06, r: 0.1 });
      tone(t, 0.02, 0.03, { w: 'sine', f: 2950, a: 0.001, dec: 0.04, r: 0.08 });
      noise(t, 0.008, 0.05, { type: 'highpass', f: 4000, r: 0.01 });
    },
    flutter: function (t) {
      noise(t, 0.6, 0.07, { type: 'bandpass', f: 1800, f2: 3600, q: 1.2, a: 0.01, dec: 0.3, r: 0.1, am: [22, 1] });
    },
    sparkle: function (t) {
      ['E7', 'C7', 'G6'].forEach(function (n, k) { voice(INST.bell, hz(n), t + k * 0.13, 0.2, 0.018); });
    },
    yarn: function (t) { // soft rolling rumble
      noise(t, 0.9, 0.06, { type: 'lowpass', f: 600, f2: 350, q: 1, a: 0.08, r: 0.3, am: [7, 0.8], amType: 'sine' });
      tone(t, 0.9, 0.02, { w: 'triangle', pts: [[0, 220], [0.9, 150]], a: 0.05, r: 0.2, vib: [7, 0.05] });
    },
    boing: function (t) { // spring pounce
      tone(t, 0.1, 0.05, { w: 'square', pts: [[0, 300], [0.1, 1200]], r: 0.03, flt: { pts: [[0, 3000]] } });
      tone(t + 0.02, 0.45, 0.12, { w: 'triangle', pts: [[0, 180], [0.45, 300]], a: 0.005, r: 0.12, vib: [16, 0.3, 0, 0.18] });
    },
    tumble: function (t) {
      [0, 0.12, 0.26, 0.38, 0.55].forEach(function (x, k) {
        tone(t + x, 0.08, 0.12 - k * 0.015, { w: 'sine', pts: [[0, 140 - k * 12], [0.08, 60]], dec: 0.05, r: 0.04 });
        noise(t + x, 0.04, 0.04, { type: 'lowpass', f: 700, dec: 0.03 });
      });
      tone(t, 0.55, 0.04, { w: 'p12', pts: [[0, 600], [0.09, 300], [0.18, 500], [0.27, 250], [0.36, 400], [0.5, 200]], r: 0.05 });
    },
    thud: function (t) {
      tone(t, 0.16, 0.3, { w: 'sine', pts: [[0, 130], [0.18, 40]], a: 0.002, dec: 0.12, r: 0.06 });
      noise(t, 0.12, 0.13, { type: 'lowpass', f: 260, dec: 0.08 });
      noise(t, 0.08, 0.08, { type: 'bandpass', f: 420, q: 2, dec: 0.06 });
    },
    bonk: function (t) { noise(t, 0.06, 0.05, { type: 'bandpass', f: 380, q: 3, dec: 0.05 }); },
    pop: function (t) {
      tone(t, 0.05, 0.11, { w: 'sine', pts: [[0, 500], [0.06, 1800]], a: 0.001, r: 0.03 });
      noise(t, 0.01, 0.05, { type: 'highpass', f: 2500, r: 0.01 });
      tone(t + 0.05, 0.05, 0.03, { w: 'square', f: hz('E6'), dec: 0.04, r: 0.03, flt: { pts: [[0, 4000]] } });
    },
    caw: function (t, k) { // "kaa" — raspy, a bit distant
      var d = 0.34 * k;
      tone(t, d, 0.075, { w: 'sawtooth', pts: [[0, 620 * k], [0.1, 570 * k], [d, 470 * k]], a: 0.02, r: 0.08,
        vib: [45, 0.04], flt: { type: 'bandpass', q: 2.5, pts: [[0, 1400], [d, 1050]] } });
      noise(t, d, 0.025, { type: 'bandpass', f: 1500, q: 2, a: 0.02, r: 0.08 });
    },
    templebell: function (t) { // distant evening bell
      var f = hz('D3');
      tone(t, 0.05, 0.06, { w: 'sine', f: f, a: 0.004, dec: 1.6, r: 3 });
      tone(t, 0.05, 0.03, { w: 'sine', f: f * 1.006, a: 0.004, dec: 1.4, r: 3 });
      tone(t, 0.05, 0.02, { w: 'sine', f: f * 2.76, a: 0.003, dec: 0.5, r: 1 });
      tone(t, 0.05, 0.01, { w: 'sine', f: f * 5.4, a: 0.002, dec: 0.2, r: 0.5 });
    },
    bloop: function (t, n) { // a window lights up
      var f = hz(n);
      tone(t, 0.05, 0.07, { w: 'sine', pts: [[0, f * 0.7], [0.06, f]], a: 0.005, dec: 0.3, r: 0.5 });
      tone(t, 0.05, 0.025, { w: 'triangle', f: f * 2, a: 0.005, dec: 0.12, r: 0.3 });
    },
    twinkle: function (t) {
      ['A6', 'E7', 'A6', 'E7', 'A7'].forEach(function (n, k) { voice(INST.bell, hz(n), t + k * 0.12, 0.2, 0.05 - k * 0.007); });
    },
    purr: function (t) { noise(t, 0.9, 0.05, { type: 'lowpass', f: 200, q: 1, a: 0.3, r: 0.4, am: [26, 0.9] }); },
    harp: function (t) { // dream opens: Dmaj9 glissando
      ['D4', 'F#4', 'A4', 'C#5', 'E5', 'F#5', 'A5', 'C#6', 'E6', 'F#6', 'A6', 'C#7'].forEach(function (n, k) {
        voice(INST.harp, hz(n), t + k * 0.07, 0.5, 0.05 - k * 0.002);
      });
    },
    bubble: function (t, x) { tone(t, 0.06, 0.03, { w: 'sine', pts: [[0, 600 + x * 200], [0.08, 1400 + x * 300]], a: 0.004, r: 0.05 }); },
    shooting: function (t) {
      tone(t, 0.7, 0.045, { w: 'sine', pts: [[0, 2800], [0.8, 700]], a: 0.02, r: 0.2 });
      noise(t, 0.6, 0.015, { type: 'highpass', f: 4000, a: 0.05, r: 0.3 });
      ['A7', 'F#7', 'D7', 'A6', 'F#6', 'D6'].forEach(function (n, k) { voice(INST.bell, hz(n), t + 0.05 + k * 0.1, 0.2, 0.025); });
    },
    click: function (t) { // lamp chain click
      noise(t, 0.008, 0.12, { type: 'highpass', f: 2500, r: 0.01 });
      tone(t, 0.012, 0.035, { w: 'square', f: 1600, dec: 0.008, r: 0.01 });
      tone(t, 0.03, 0.05, { w: 'sine', pts: [[0, 320], [0.04, 200]], dec: 0.03, r: 0.03 });
      noise(t + 0.05, 0.006, 0.05, { type: 'highpass', f: 3000, r: 0.01 });
    },
  };

  function play(e, when) {
    if (e.i) voice(INST[e.i], e.f, when, e.d, e.v, e.cap);
    else FX[e.fx](when, e.a);
  }

  // ============================================================================================
  // SYNC — follow the SVG document clock with a lookahead scheduler
  // ============================================================================================
  var scr = document.currentScript;
  var root = (scr && scr.ownerSVGElement) || (scr && scr.closest && scr.closest('svg')) || null;
  var btn = root ? root.querySelector('#snd-btn') : document.getElementById('snd-btn');
  if (!root && btn) root = btn.ownerSVGElement || document.documentElement;
  if (!root) root = document.documentElement;
  var q = function (id) { return btn && btn.querySelector('#' + id); };
  var onG = q('snd-on'), offG = q('snd-off'), pulseG = q('snd-pulse');

  var playing = false, timer = null, schedUntil = -1, lastA = -1, held = true, api = {};
  function clock() { return typeof root.getCurrentTime === 'function' ? root.getCurrentTime() : Date.now() / 1000; }
  function isPaused() { return typeof root.animationsPaused === 'function' && root.animationsPaused(); }

  // silence everything already scheduled (seek / pause / hide) and start a fresh session bus
  function hush() {
    if (!ctx || !sess) return;
    var old = sess, n = ctx.currentTime;
    old.gain.cancelScheduledValues(n); old.gain.setValueAtTime(old.gain.value, n); old.gain.setTargetAtTime(0, n, 0.02);
    setTimeout(function () { try { old.disconnect(); } catch (e) { /* already gone */ } }, 300);
    sess = ctx.createGain(); sess.connect(bus);
  }

  function scheduleRange(a0, a1, A, now) {
    var lat = ctx.outputLatency || ctx.baseLatency || 0;
    for (var k = Math.floor(a0 / LOOP); k <= Math.floor(a1 / LOOP); k++) {
      var base = k * LOOP, lo = a0 - base, hi = a1 - base;
      for (var j = 0; j < EV.length; j++) {
        var e = EV[j];
        if (e.t < lo) continue;
        if (e.t >= hi) break;
        var when = now + (base + e.t - A) - lat;
        if (when < now) when = now;
        try { play(e, when); if (api.onPlay) api.onPlay(e, when, base + e.t); } catch (err) { /* never let one voice kill the scheduler */ }
      }
    }
  }

  function tick() {
    if (!ctx || !playing) return;
    if (isPaused() || document.hidden || ctx.state !== 'running') {
      if (!held) { hush(); held = true; }
      if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
      return;
    }
    var A = clock(), now = ctx.currentTime;
    // (re)sync after start / pause / hide, a backwards seek or loop reset, or a forward jump
    if (held || schedUntil < 0 || A < lastA - 0.02 || A < schedUntil - LOOK - 0.5 || A > lastA + 0.6) {
      if (!held) hush();
      held = false; schedUntil = A;
    } else if (A > schedUntil) schedUntil = A; // fell slightly behind: skip the gap
    lastA = A;
    var end = A + LOOK;
    if (end > schedUntil) { scheduleRange(schedUntil, end, A, now); schedUntil = end; }
  }

  function setUI() {
    if (!btn) return;
    if (onG) onG.setAttribute('display', playing ? 'inline' : 'none');
    if (offG) offG.setAttribute('display', playing ? 'none' : 'inline');
    if (pulseG) pulseG.setAttribute('display', playing ? 'none' : 'inline');
  }

  function start() {
    try { init(); } catch (e) { ctx = null; return; }
    playing = true; held = true; schedUntil = -1;
    var p = ctx.resume && ctx.resume();
    master.gain.setTargetAtTime(VOL, ctx.currentTime, 0.15);
    if (p && p.then) p.then(tick);
    timer = setInterval(tick, TICK);
    tick(); setUI();
  }
  function stop() {
    playing = false;
    if (timer) clearInterval(timer);
    timer = null;
    var c = ctx, m = master;
    ctx = null; sess = null;
    if (c) {
      m.gain.cancelScheduledValues(c.currentTime); m.gain.setValueAtTime(m.gain.value, c.currentTime);
      m.gain.setTargetAtTime(0, c.currentTime, 0.04);
      setTimeout(function () { try { c.close(); } catch (e) { /* ignore */ } }, 350);
    }
    setUI();
  }
  function toggle(ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); if (playing) stop(); else start(); }

  if (document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (!ctx) return;
      if (document.hidden) { hush(); held = true; if (ctx.suspend) ctx.suspend(); }
      else { if (ctx.resume) ctx.resume(); held = true; tick(); }
    });
  }
  if (btn && (window.AudioContext || window.webkitAudioContext)) {
    btn.setAttribute('display', 'inline');
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
    setUI();
  }
  // debug / test hook
  api.EV = EV; api.tick = tick; api.toggle = toggle; api.isPlaying = function () { return playing; };
  window.__catDayMusic = api;
}

// ============================================================================================
// Markup: pixel speaker button (bottom-left) + script
// ============================================================================================
function pix(cells) { return cells.map(([x, y, w = 1, h = 1]) => `M${x} ${y}h${w}v${h}h-${w}z`).join(''); }

module.exports = ({ C }) => {
  const X = 5, Y = 131; // 9x9 icon origin
  // speaker: body + cone
  const spk = pix([[0, 3, 2, 3], [2, 2, 1, 5], [3, 1, 1, 7], [4, 0, 1, 9]]);
  const wave1 = pix([[6, 3, 1, 3]]);
  const wave2 = pix([[7, 1], [7, 7], [8, 2, 1, 5]]);
  const cross = pix([[6, 3], [8, 3], [7, 4], [6, 5], [8, 5]]);
  const bx = 3, by = 129, bw = 36, bh = 13;
  const label = (c) => C.text('SOUND', X + 12, Y + 2, c);
  const border = pix([[bx - 1, by - 1, bw + 2, 1], [bx - 1, by + bh, bw + 2, 1], [bx - 1, by, 1, bh], [bx + bw, by, 1, bh]]);

  const markup = `<g id="snd-btn" display="none" style="cursor:pointer" pointer-events="all" tabindex="0" role="button" aria-label="Toggle sound">
<title>Sound on/off</title>
<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#1a1226" opacity=".72"/>
<rect x="${bx}" y="${by + bh}" width="${bw}" height="1" fill="#000" opacity=".3"/>
<g id="snd-pulse"><path fill="#ffcf7a" d="${border}" opacity="0"><animate attributeName="opacity" values="0;.25;.5;.75;.5;.25;0;0" calcMode="discrete" dur="1.6s" repeatCount="indefinite"/></path></g>
<g transform="translate(${X + 1} ${Y + 1})"><path fill="#2b1d2e" d="${spk}"/></g>
<g transform="translate(${X} ${Y})"><path fill="#ffe9b8" d="${spk}"/></g>
<g id="snd-off"><g transform="translate(${X} ${Y})"><path fill="#f2657a" d="${cross}"/></g>${label('#b9a6d6')}<animate attributeName="opacity" values="1;.7" calcMode="discrete" dur="1.6s" repeatCount="indefinite"/></g>
<g id="snd-on" display="none"><g transform="translate(${X} ${Y})"><path fill="#ffcf7a" d="${wave1}"/><path fill="#ffcf7a" d="${wave2}"><animate attributeName="opacity" values="1;.35" calcMode="discrete" dur="0.8s" repeatCount="indefinite"/></path></g>${label('#ffe9b8')}</g>
<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" pointer-events="all"/>
</g>`;

  const js = `(${catDayMusic.toString()})(window, document);`;
  if (js.includes(']]>')) throw new Error('music script contains ]]>');
  return `${markup}\n<script type="text/javascript"><![CDATA[\n${js}\n]]></script>`;
};
module.exports.catDayMusic = catDayMusic;
