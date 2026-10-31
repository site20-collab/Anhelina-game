// ---------- find the pair: sixteen cards on the floor of a garden pavilion ----------
const MEMO_SYMBOLS = [
  { e: '🐱', c: '#ffb347' }, { e: '🐶', c: '#9ad8ff' }, { e: '🐰', c: '#ffc2e0' }, { e: '🦆', c: '#ffe066' },
  { e: '🐼', c: '#d9d9e0' }, { e: '🦒', c: '#f2c879' }, { e: '🐘', c: '#b6c2d6' }, { e: '🦉', c: '#c9a27a' },
];
const MEMO_STEP = 2.4;
const memo = { cards: [], open: [], wait: 0, moves: 0, found: 0, t: 0, state: 'off', best: 0 };
const memoTex = {};
function memoFace(sym) {
  if (memoTex[sym.e]) return memoTex[sym.e];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = sym.c; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#ff6fae'; g.lineWidth = 8; g.strokeRect(4, 4, 120, 120);
  g.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym.e, 64, 70);
  return (memoTex[sym.e] = new THREE.CanvasTexture(c));
}
let memoBack = null;
function memoBackTex() {
  if (memoBack) return memoBack;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#9a7bff'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#b8a2ff';
  for (let y = 0; y < 128; y += 32) for (let x = (y / 32) % 2 * 16; x < 128; x += 32) g.fillRect(x, y, 16, 16);
  g.fillStyle = '#fff'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 68);
  g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.strokeRect(4, 4, 120, 120);
  return (memoBack = new THREE.CanvasTexture(c));
}
function generateMemo() {
  flatGround(GRASS, MEMOB);
  // a pavilion floor with a hedge around it and an open side towards the player
  fillBox(CX - 7, KH, CZ - 7, CX + 7, KH, CZ + 12, PLANKS);
  for (let x = CX - 9; x <= CX + 9; x++) for (let z = CZ - 9; z <= CZ + 14; z++) {
    const edge = x === CX - 9 || x === CX + 9 || z === CZ - 9;
    if (edge) fillBox(x, KH + 1, z, x, KH + 2, z, LEAVES);
  }
  [[-8, -8], [8, -8], [-8, 13], [8, 13]].forEach(([dx, dz]) => { fillBox(CX + dx, KH + 1, CZ + dz, CX + dx, KH + 4, CZ + dz, CASTLE); setB(CX + dx, KH + 5, CZ + dz, LANTERN); });
  for (let z = 4; z < SZ - 4; z++) for (let x = 4; x < SX - 4; x++) {
    const d = Math.hypot(x - CX, z - CZ), h = hash(x, z, 95);
    if (d > 18 && d < 100 && h < 0.014) treeOak(x, KH, z, 4 + Math.floor(hash(x, z, 8) * 2), LOG, h < 0.007 ? PINKLEAVES : LEAVES);
    else if (d > 13 && h < 0.08) setB(x, KH + 1, z, FLOWERS[Math.floor(hash(x, z, 5) * FLOWERS.length)]);
  }
}
function clearMemo() { memo.cards.forEach(c => scene.remove(c.g)); memo.cards = []; memo.open = []; }
function enterMemo() {
  clearMemo();
  const deck = [];
  MEMO_SYMBOLS.forEach((s, i) => { deck.push(i, i); });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const geo = new THREE.PlaneGeometry(2, 2);
  deck.forEach((sym, k) => {
    const col = k % 4, row = Math.floor(k / 4);
    const g = new THREE.Group();
    g.position.set(CX + .5 + (col - 1.5) * MEMO_STEP, KH + 1.06, CZ + .5 + (row - 1.5) * MEMO_STEP);
    const back = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: memoBackTex() }));
    back.rotation.x = -Math.PI / 2;
    const face = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: memoFace(MEMO_SYMBOLS[sym]) }));
    // the face sits upside down in its own holder so it reads the right way once the card turns over
    const holder = new THREE.Group(); holder.rotation.z = Math.PI; holder.add(face);
    face.rotation.x = -Math.PI / 2; face.position.y = 0.035;
    back.position.y = 0.035;
    const edge = box(2.04, 0.05, 2.04, '#ffffff', 0, 0, 0, g);
    g.add(back, holder);
    scene.add(g);
    const card = { g, sym, up: false, done: false, rot: 0, x: g.position.x, z: g.position.z };
    g.userData.card = card; back.userData.card = card; face.userData.card = card; edge.userData.card = card;
    memo.cards.push(card);
  });
  Object.assign(memo, { open: [], wait: 0, moves: 0, found: 0, t: 0, state: 'run' });
  bigText('Знайди пару!', 1400);
  toast('Торкнись картки або стань на неї й натисни кнопку. Знайди дві однакові!', 4000);
  updateMemoHud();
}
function leaveMemo() { clearMemo(); memo.state = 'off'; }
function updateMemoHud() {
  if (dim !== D_MEMO) return;
  setGameHud([`Пар ${memo.found} / ${MEMO_SYMBOLS.length}`, `Ходів ${memo.moves}`, `Час ${fmtTime(memo.t)}`, ...(memo.best ? [`Рекорд ${memo.best} ходів`] : [])]);
}
function memoFlip(card) {
  if (memo.state !== 'run' || !card || card.up || card.done || memo.open.length >= 2) return;
  card.up = true; memo.open.push(card); sfx.click();
  if (memo.open.length === 2) {
    memo.moves++;
    const [a, b] = memo.open;
    if (a.sym === b.sym) {
      a.done = b.done = true; memo.open = []; memo.found++;
      setTimeout(() => { sfx.heart(); burst(a.x - .5, KH + 1, a.z - .5, '#ffd23f', 8); burst(b.x - .5, KH + 1, b.z - .5, '#ffd23f', 8); }, 300);
      if (memo.found === MEMO_SYMBOLS.length) finishMemo();
    } else memo.wait = 1.1;
  }
  updateMemoHud();
}
function memoTap(cx, cy) {
  aim(cx, cy);
  const h = raycaster.intersectObjects(memo.cards.map(c => c.g), true)[0];
  if (h) memoFlip(h.object.userData.card);
}
function memoNear() {
  if (memo.state !== 'run') return null;
  let best = null, bd = 1.3;
  memo.cards.forEach(c => { const d = Math.hypot(pl.p.x - c.x, pl.p.z - c.z); if (!c.up && !c.done && d < bd) { bd = d; best = c; } });
  return best;
}
function memoFlipNear() { memoFlip(memoNear()); }
function updateMemo(dt, t) {
  if (memo.state === 'off') return;
  if (memo.state === 'run') { memo.t += dt; updateMemoHud(); }
  if (memo.wait > 0) {
    memo.wait -= dt;
    if (memo.wait <= 0) { memo.open.forEach(c => { c.up = false; }); memo.open = []; }
  }
  memo.cards.forEach(c => {
    const target = c.up || c.done ? Math.PI : 0;
    c.rot += (target - c.rot) * Math.min(1, dt * 10);
    c.g.rotation.z = c.rot;
    c.g.position.y = KH + 1.06 + Math.sin(c.rot) * 0.6 + (c.done ? Math.sin(t * 3 + c.x) * 0.04 + 0.04 : 0);
  });
}
function finishMemo() {
  memo.state = 'done';
  const newBest = !memo.best || memo.moves < memo.best;
  if (newBest) memo.best = memo.moves;
  scheduleSave();
  setTimeout(() => { sfx.win(); bigText('Усі пари!', 1300); }, 500);
  const stars = memo.moves <= 12 ? '★★★' : memo.moves <= 18 ? '★★☆' : '★☆☆';
  setTimeout(() => showResult(`Знайди пару ${stars}`, `Ангеліна знайшла всі пари за ${memo.moves} ходів і ${fmtTime(memo.t)}.${newBest ? ' Це новий рекорд!' : ` Рекорд: ${memo.best} ходів.`}`, () => enterMemo()), 2000);
}
