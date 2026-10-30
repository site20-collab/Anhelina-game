// ---------- repeat the picture ----------
const ART_COLORS = { r: W_RED, o: W_ORANGE, y: W_YELLOW, g: W_GREEN, b: W_BLUE, p: W_PURPLE, k: W_PINK, w: W_WHITE, x: W_BLACK, n: W_BROWN };
const PICTURES = [
  { name: 'Сердечко', rows: ['rr.rr', 'rrrrr', 'rrrrr', '.rrr.', '..r..'] },
  { name: 'Усмішка', rows: ['.yyyy.', 'yxyyxy', 'yyyyyy', 'yxyyxy', 'yyxxyy', '.yyyy.'] },
  { name: 'Квітка', rows: ['..kkk..', '.kkykk.', '..kkk..', '...g...', '.g.g.g.', '..ggg..', '...g...'] },
  { name: 'Каченя', rows: ['..yyy...', '.yyxy...', '.yyyyoo.', '..yy....', '.yyyyyy.', 'yyyyyyyy', '.yyyyyy.', 'bbbbbbbb'] },
  { name: 'Котик', rows: ['o......o', 'oo....oo', 'oooooooo', 'oxooooxo', 'oooooooo', 'oookkooo', '.oooooo.', '..oooo..'] },
  { name: 'Будиночок', rows: ['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', '.wwwwww.', '.wbwwbw.', '.wwnnww.', '.wwnnww.'] },
  { name: 'Веселка', rows: ['..rrrr..', '.roooor.', 'roy..yor', 'oyg..gyo', 'ygb..bgy', 'gb....bg', 'w......w', 'ww....ww'] },
];
const art = { level: 0, target: null, labels: [], done: false };
function artTarget(level) {
  const pic = PICTURES[level % PICTURES.length], S = ART.size;
  const h = pic.rows.length, w = pic.rows[0].length, ox = Math.floor((S - w) / 2), oy = Math.floor((S - h) / 2);
  const grid = new Uint8Array(S * S);
  pic.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') grid[(oy + (h - 1 - r)) * S + ox + c] = ART_COLORS[ch]; }));
  return grid;
}
function paintArt() {
  const S = ART.size, W = worlds[D_ART];
  art.target = artTarget(art.level);
  art.done = false;
  for (let gy = 0; gy < S; gy++) for (let gx = 0; gx < S; gx++) {
    W[I(ART.x0T + gx, ART.y0 + gy, ART.zWall)] = art.target[gy * S + gx] || W_WHITE;
    W[I(ART.x0C + gx, ART.y0 + gy, ART.zWall + 1)] = 0;
  }
  if (dim === D_ART) { rebuildAround(ART.x0T + 3, ART.zWall); rebuildAround(ART.x0C + 3, ART.zWall); rebuildAround(ART.x0T + 6, ART.zWall); rebuildAround(ART.x0C + 6, ART.zWall); }
  updateArtHud();
}
function inCanvas(x, y, z) {
  return z === ART.zWall + 1 && x >= ART.x0C && x < ART.x0C + ART.size && y >= ART.y0 && y < ART.y0 + ART.size;
}
function artScore() {
  const S = ART.size, W = worlds[D_ART];
  let need = 0, good = 0, wrong = 0;
  for (let gy = 0; gy < S; gy++) for (let gx = 0; gx < S; gx++) {
    const t = art.target[gy * S + gx], c = W[I(ART.x0C + gx, ART.y0 + gy, ART.zWall + 1)];
    if (t) { need++; if (c === t) good++; else if (c) wrong++; } else if (c) wrong++;
  }
  return { need, good, wrong };
}
function updateArtHud() {
  if (dim !== D_ART) return;
  const s = artScore();
  setGameHud([`Картина ${art.level % PICTURES.length + 1} з ${PICTURES.length}: ${PICTURES[art.level % PICTURES.length].name}`,
    `Готово ${s.good} з ${s.need}`, s.wrong ? `Зайвих ${s.wrong}` : 'Без помилок'],
    [['Очистити', () => { paintArt(); toast('Полотно чисте', 1000); }], ['Інша картинка', () => nextArt()]]);
}
function nextArt() { art.level = (art.level + 1) % PICTURES.length; scheduleSave(); paintArt(); toast(PICTURES[art.level].name, 1200); }
function artTap(hit, place) {
  if (place) {
    const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
    if (!inCanvas(x, y, z)) { toast('Став блоки на біле полотно праворуч'); return; }
    if (world[I(x, y, z)]) return;
    if (overlapsPlayer(x, y, z)) return;
    setBlock(x, y, z, hotbar[selected]);
    sfx.place();
  } else {
    if (!inCanvas(hit.x, hit.y, hit.z)) { toast('Прибирати можна тільки блоки на своїй картині'); return; }
    const b = world[I(hit.x, hit.y, hit.z)];
    if (!b) return;
    setBlock(hit.x, hit.y, hit.z, 0);
    burst(hit.x, hit.y, hit.z, BLOCKS[b].c, 6);
    sfx.brk();
  }
  updateArtHud();
  const s = artScore();
  if (!art.done && s.good === s.need && s.wrong === 0) {
    art.done = true;
    sfx.win();
    bigText('Чудово!', 1600);
    for (let i = 0; i < 6; i++) burst(ART.x0C + 1 + i, ART.y0 + 4, ART.zWall + 1, '#fff', 8, ['#ff4f9a', '#ffd23f', '#3bb54a', '#3d7be0', '#9a7bff']);
    setTimeout(() => {
      if (dim !== D_ART) return;
      if (art.level === PICTURES.length - 1) toast('Ти справжня художниця! Усі картини готові', 3500);
      nextArt();
    }, 2200);
  }
}
function enterArt() {
  art.labels.forEach(s => scene.remove(s));
  const a = textSprite('Зразок', 1.4, 'rgba(255,79,154,.85)'), b = textSprite('Повтори тут', 1.4, 'rgba(106,76,255,.85)');
  a.position.set(ART.x0T + ART.size / 2, ART.y0 + ART.size + 1.4, ART.zWall + 1.2);
  b.position.set(ART.x0C + ART.size / 2, ART.y0 + ART.size + 1.4, ART.zWall + 1.4);
  scene.add(a); scene.add(b);
  art.labels = [a, b];
  setMode(true);
  paintArt();
}
function leaveArt() { art.labels.forEach(s => scene.remove(s)); art.labels = []; }
