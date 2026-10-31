// ---------- star rain: catch the stars before they touch the grass ----------
const STARS_R = 18, STARS_TIME = 60;
const starGame = { state: 'off', t: 0, score: 0, best: 0, spawnT: 0, items: [], slowT: 0 };
const starGeo = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.22 : 0.5; i ? s.lineTo(Math.cos(a) * r, -Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, -Math.sin(a) * r); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
  g.center();
  return g;
})();
const STAR_KINDS = [
  { w: 70, pts: 1, c: 0xffd23f, e: 0x806010, s: 1 },
  { w: 15, pts: 3, c: 0xffb703, e: 0xa05a00, s: 1.5 },
  { w: 7, pts: 5, c: 0xff6fae, e: 0x902050, s: 1.3, rainbow: true },
  { w: 8, pts: 0, cloud: true },
];
function generateStars() {
  flatGround(GRASS, STARSB);
  for (let dz = -STARS_R - 2; dz <= STARS_R + 2; dz++) for (let dx = -STARS_R - 2; dx <= STARS_R + 2; dx++) {
    const d = Math.hypot(dx, dz), x = CX + dx, z = CZ + dz;
    if (d > STARS_R && d <= STARS_R + 1.2) setB(x, KH + 1, z, LEAVES);
    else if (d <= STARS_R && hash(x, z, 51) < 0.05) setB(x, KH + 1, z, FLOWERS[Math.floor(hash(x, z, 52) * FLOWERS.length)]);
  }
  for (let z = 4; z < SZ - 4; z++) for (let x = 4; x < SX - 4; x++) {
    const d = Math.hypot(x - CX, z - CZ), h = hash(x, z, 94);
    if (d > STARS_R + 6 && d < 100 && h < 0.015) treeOak(x, KH, z, 4 + Math.floor(hash(x, z, 8) * 2), CANDY, PINKLEAVES);
    else if (d > STARS_R + 3 && h < 0.08) setB(x, KH + 1, z, FLOWERS[Math.floor(hash(x, z, 5) * FLOWERS.length)]);
  }
}
function enterStars() {
  clearStars();
  Object.assign(starGame, { state: 'ready', t: 2.5, score: 0, spawnT: 0, slowT: 0 });
  bigText('Лови зірочки!', 1600);
  toast('Стань туди, де світиться кружечок, і зірочка впаде тобі в руки. Сірих хмарок уникай!', 4000);
  updateStarsHud();
}
function clearStars() { starGame.items.forEach(s => { scene.remove(s.mesh); scene.remove(s.mark); }); starGame.items = []; }
function leaveStars() { clearStars(); starGame.state = 'off'; speedMul = 1; }
function updateStarsHud() {
  if (dim !== D_STARS) return;
  setGameHud([`Зірочок ${starGame.score}`, `Час ${Math.max(0, Math.ceil(starGame.state === 'run' ? starGame.t : STARS_TIME))}`, `Рекорд ${starGame.best}`]);
}
function spawnStar() {
  const sum = STAR_KINDS.reduce((a, k) => a + k.w, 0);
  let r = Math.random() * sum, kind = STAR_KINDS[0];
  for (const k of STAR_KINDS) { r -= k.w; if (r <= 0) { kind = k; break; } }
  const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * (STARS_R - 2);
  const x = CX + .5 + Math.cos(a) * d, z = CZ + .5 + Math.sin(a) * d;
  let mesh;
  if (kind.cloud) { mesh = new THREE.Group(); box(0.9, 0.4, 0.6, '#9aa4b4', 0, 0, 0, mesh); box(0.5, 0.3, 0.5, '#aab4c4', 0.2, 0.25, 0, mesh); box(0.12, 0.06, 0.02, '#2b2140', 0, 0, 0.31, mesh); }
  else { mesh = new THREE.Mesh(starGeo, new THREE.MeshLambertMaterial({ color: kind.c, emissive: kind.e })); mesh.scale.setScalar(kind.s); }
  mesh.position.set(x, KH + 14, z);
  scene.add(mesh);
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 20), new THREE.MeshBasicMaterial({ color: kind.cloud ? 0x6a7486 : 0xffe066, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  mark.rotation.x = -Math.PI / 2; mark.position.set(x, KH + 1.03, z);
  scene.add(mark);
  starGame.items.push({ kind, mesh, mark, x, z, vy: 5 + (STARS_TIME - starGame.t) * 0.06 });
}
function updateStars(dt, t) {
  if (starGame.state === 'off') return;
  if (starGame.state === 'ready') { starGame.t -= dt; if (starGame.t <= 0) { starGame.state = 'run'; starGame.t = STARS_TIME; sfx.go(); bigText('Старт!', 800); } return; }
  starGame.slowT = Math.max(0, starGame.slowT - dt);
  speedMul = starGame.slowT > 0 ? 0.45 : 1;
  if (starGame.state === 'run') {
    starGame.t -= dt;
    starGame.spawnT -= dt;
    if (starGame.spawnT <= 0) { spawnStar(); starGame.spawnT = Math.max(0.35, 0.9 - (STARS_TIME - starGame.t) * 0.008); }
    if (starGame.t <= 0) finishStars();
  }
  for (let i = starGame.items.length - 1; i >= 0; i--) {
    const s = starGame.items[i];
    s.mesh.position.y -= s.vy * dt;
    s.mesh.rotation.y += dt * 3;
    s.mark.material.opacity = 0.5 + Math.sin(t * 8) * 0.3;
    const near = Math.hypot(pl.p.x - s.x, pl.p.z - s.z) < 1.3;
    const low = s.mesh.position.y < pl.p.y + 2.4;
    let done = false;
    if (near && low) {
      done = true;
      if (s.kind.cloud) { starGame.slowT = 2.5; sfx.hurt(); toast('Ой, сонна хмарка! Позіхаю…', 1500); }
      else { starGame.score += s.kind.pts; sfx.heart(); burst(s.x - .5, s.mesh.position.y - .5, s.z - .5, '#ffd23f', 10, s.kind.rainbow ? ['#ff4f9a', '#ffd23f', '#7cc8ff', '#7be0a0'] : null); if (s.kind.pts > 1) toast(`+${s.kind.pts}!`, 800); }
    } else if (s.mesh.position.y < KH + 1) { done = true; if (!s.kind.cloud) sparkle(s.x, KH + 1.2, s.z); }
    if (done) { scene.remove(s.mesh); scene.remove(s.mark); starGame.items.splice(i, 1); }
  }
  updateStarsHud();
}
function finishStars() {
  starGame.state = 'done';
  clearStars(); speedMul = 1;
  const newBest = starGame.score > starGame.best;
  starGame.best = Math.max(starGame.best, starGame.score); scheduleSave();
  sfx.win(); bigText('Час вийшов!', 1400);
  const stars = starGame.score >= 45 ? '★★★' : starGame.score >= 25 ? '★★☆' : '★☆☆';
  setTimeout(() => showResult(`Зоряний дощ ${stars}`, `Ангеліна зловила ${starGame.score} зірочок.${newBest ? ' Це новий рекорд!' : ` Рекорд: ${starGame.best}.`}`, () => enterStars()), 1500);
}
