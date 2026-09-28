// Scene-like module that shows every cat pose. Use: node tools/snap.js --only 1 with SHEET=1
'use strict';
module.exports = ({ C, cat }) => {
  const poses = [
    { pose: 'sit' }, { pose: 'sit', eyes: 'happy', mouth: 'open', tail: 120 }, { pose: 'sit', eyes: 'wide', paw: 3 },
    { pose: 'walk', step: 0 }, { pose: 'walk', step: 1 }, { pose: 'walk', step: 3 },
    { pose: 'loaf', eyes: 'half' }, { pose: 'sleep', eyes: 'closed' }, { pose: 'stretch', eyes: 'closed', mouth: 'yawn' },
    { pose: 'leap', eyes: 'wide' }, { pose: 'eat', eyes: 'closed' }, { pose: 'crouch', eyes: 'wide', step: 0 },
  ];
  let m = `<rect width="256" height="144" fill="#8ab"/>`;
  poses.forEach((p, i) => {
    const id = 'sheet' + i;
    cat.catSprite(id, p);
    m += C.use(id, 4 + (i % 6) * 42, 10 + Math.floor(i / 6) * 50);
    m += C.text(p.pose, 4 + (i % 6) * 42, 42 + Math.floor(i / 6) * 50, '#123');
  });
  return m;
};
