// Generates out/player.html: the SVG inlined + chapter scrubber UI.
'use strict';
module.exports = function player(svg, SCENES) {
  const chapters = [
    ['🌅', 'あさ', 'Dawn'], ['🍚', 'ごはん', 'Breakfast'], ['🪟', 'まどべ', 'Window'],
    ['🧶', 'あそび', 'Play'], ['🌇', 'ゆうやけ', 'Sunset'], ['🌙', 'おやすみ', 'Night'],
  ];
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>ねこのいちにち — A Cat's Day</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0;height:100%;background:#0d0a14;color:#ffe9b8;font:14px/1.4 ui-monospace,Consolas,monospace}
.wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100%;gap:14px;padding:16px;box-sizing:border-box}
.stage{width:min(96vw,calc((100vh - 150px)*16/9));aspect-ratio:16/9;box-shadow:0 0 0 4px #2b1d2e,0 0 0 8px #4a3560,0 20px 60px #000c;image-rendering:pixelated}
.stage svg{width:100%;height:100%;display:block}
.bar{width:min(96vw,calc((100vh - 150px)*16/9));display:flex;gap:4px;position:relative;height:30px;cursor:pointer;user-select:none}
.ch{flex:1;background:#2b1d2e;border:2px solid #4a3560;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:#b9a6d6;white-space:nowrap;overflow:hidden}
.ch.on{background:#4a3560;color:#fff3e0}
.head{position:absolute;top:-4px;bottom:-4px;width:3px;background:#ffcf4a;pointer-events:none;box-shadow:0 0 6px #ffcf4a}
.row{display:flex;gap:10px;align-items:center}
button{font:inherit;background:#2b1d2e;color:#ffe9b8;border:2px solid #4a3560;padding:4px 12px;cursor:pointer}
button:hover{background:#4a3560}
small{color:#7d6a99}
</style></head><body><div class="wrap">
<div class="stage" id="stage">${svg.replace(/^<\?xml[^>]*>/, '')}</div>
<div class="bar" id="bar">${SCENES.map((s, i) => `<div class="ch" style="flex:${s.t1 - s.t0}" data-t="${s.t0}">${chapters[i][0]} ${chapters[i][1]}</div>`).join('')}<div class="head" id="head"></div></div>
<div class="row"><button id="pp">❚❚ pause</button><span id="tm">0.0s</span><small>click the chapters to jump · click ♪ in the corner of the picture for chiptune sound</small></div>
</div><script>
const svg=document.querySelector('#stage svg');const bar=document.getElementById('bar'),head=document.getElementById('head'),tm=document.getElementById('tm'),pp=document.getElementById('pp');
const S=${JSON.stringify(SCENES.map(s => [s.t0, s.t1]))};
function seek(t){svg.setCurrentTime(t);}
bar.addEventListener('click',e=>{const r=bar.getBoundingClientRect();seek(60*(e.clientX-r.left)/r.width);});
pp.onclick=()=>{if(svg.animationsPaused()){svg.unpauseAnimations();pp.textContent='❚❚ pause';}else{svg.pauseAnimations();pp.textContent='▶ play';}};
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();pp.click();}if(e.code==='ArrowRight')seek((svg.getCurrentTime()%60)+2);if(e.code==='ArrowLeft')seek(Math.max(0,(svg.getCurrentTime()%60)-2));});
const chs=[...bar.querySelectorAll('.ch')];
(function loop(){const t=svg.getCurrentTime()%60;head.style.left=(t/60*100)+'%';tm.textContent=t.toFixed(1)+'s';chs.forEach((c,i)=>c.classList.toggle('on',t>=S[i][0]&&t<S[i][1]));requestAnimationFrame(loop);})();
</script></body></html>`;
};
