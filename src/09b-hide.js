// ---------- hide and seek in a hedge maze ----------
const MAZE = { n: 13, cell: 4, x0: 0, z0: 0, size: 0, spots: [], seed: 1 };
const HIDERS = ['cat', 'bunny', 'piglet', 'puppy', 'fox', 'penguin', 'duckling', 'hedgehog'];
const hide = { animals: [], found: 0, t: 0, state: 'off', hints: 3, hintT: 0, best: 0 };
function generateHide() {
  flatGround(GRASS, HIDEB);
  const n = MAZE.n, c = MAZE.cell, size = n * c + 1;
  const x0 = CX - Math.floor(size / 2), z0 = CZ - Math.floor(size / 2);
  Object.assign(MAZE, { x0, z0, size });
  let s = MAZE.seed = (Date.now() & 0xffff) | 1;
  const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
  fillBox(x0, KH + 1, z0, x0 + size - 1, KH + 3, z0 + size - 1, LEAVES);
  const open = (cx, cz) => fillBox(x0 + cx * c + 1, KH + 1, z0 + cz * c + 1, x0 + cx * c + c - 1, KH + 3, z0 + cz * c + c - 1, 0);
  const seen = new Uint8Array(n * n), links = Array.from({ length: n * n }, () => 0);
  const start = [Math.floor(n / 2), n - 1];
  const stack = [start];
  seen[start[1] * n + start[0]] = 1; open(start[0], start[1]);
  while (stack.length) {
    const [cx, cz] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [cx + dx, cz + dz, dx, dz]).filter(([x, z]) => x >= 0 && z >= 0 && x < n && z < n && !seen[z * n + x]);
    if (!nb.length) { stack.pop(); continue; }
    const [nx, nz, dx, dz] = nb[Math.floor(rnd() * nb.length)];
    seen[nz * n + nx] = 1; open(nx, nz);
    links[cz * n + cx]++; links[nz * n + nx]++;
    // knock out the hedge between the two cells
    if (dx) { const wx = x0 + Math.max(cx, nx) * c; fillBox(wx, KH + 1, z0 + cz * c + 1, wx, KH + 3, z0 + cz * c + c - 1, 0); }
    else { const wz = z0 + Math.max(cz, nz) * c; fillBox(x0 + cx * c + 1, KH + 1, wz, x0 + cx * c + c - 1, KH + 3, wz, 0); }
    stack.push([nx, nz]);
  }
  // the entrance on the south side
  fillBox(x0 + start[0] * c + 1, KH + 1, z0 + size - 1, x0 + start[0] * c + c - 1, KH + 3, z0 + size - 1, 0);
  // dead ends make the best hiding places
  const ends = [];
  for (let cz = 0; cz < n; cz++) for (let cx = 0; cx < n; cx++) if (links[cz * n + cx] === 1 && !(cx === start[0] && cz === start[1])) ends.push([cx, cz, Math.hypot(cx - start[0], cz - start[1]) + rnd() * 3]);
  ends.sort((a, b) => b[2] - a[2]);
  MAZE.spots = ends.slice(0, HIDERS.length).map(([cx, cz]) => [x0 + cx * c + c / 2, z0 + cz * c + c / 2]);
  for (let z = z0; z < z0 + size; z++) for (let x = x0; x < x0 + size; x++) {
    if (!world[I(x, KH + 1, z)] && hash(x, z, 33 + MAZE.seed) < 0.06) world[I(x, KH + 1, z)] = FLOWERS[Math.floor(hash(x, z, 34) * FLOWERS.length)];
    if (world[I(x, KH + 3, z)] === LEAVES && hash(x, z, 35) < 0.05) world[I(x, KH + 3, z)] = PINKLEAVES;
  }
  for (let z = 4; z < SZ - 4; z++) for (let x = 4; x < SX - 4; x++) {
    const r = Math.max(Math.abs(x - CX), Math.abs(z - CZ)), h = hash(x, z, 92);
    if (r > size / 2 + 6 && r < 110 && h < 0.015) treeOak(x, KH, z, 4 + Math.floor(hash(x, z, 8) * 2), LOG, h < 0.007 ? PINKLEAVES : LEAVES);
    else if (r > size / 2 + 3 && h < 0.08) setB(x, KH + 1, z, FLOWERS[Math.floor(hash(x, z, 5) * FLOWERS.length)]);
  }
}
function hideStart() { return { x: MAZE.x0 + Math.floor(MAZE.n / 2) * MAZE.cell + 2, z: MAZE.z0 + MAZE.size + 3, face: Math.PI, yaw: 0, pitch: 0.3 }; }
function enterHide() {
  clearHide();
  hide.found = 0; hide.t = 0; hide.hints = 3; hide.hintT = 0; hide.state = 'run';
  MAZE.spots.forEach(([x, z], i) => {
    const type = HIDERS[i % HIDERS.length];
    const m = { id: i, type, breed: DUCK_BREEDS[1], variant: '' };
    const parts = MOB_TYPES[type].build(m);
    parts.g.position.set(x, KH + 1, z);
    parts.g.rotation.y = hash(i, 3, MAZE.seed) * 6.28;
    scene.add(parts.g);
    hide.animals.push({ type, g: parts.g, x, z, found: false, phase: i * 1.3, gone: 0 });
  });
  updateHideHud();
  bigText('Знайди всіх!', 1400);
  toast(`У лабіринті сховалися ${hide.animals.length} тваринок`, 2500);
}
function clearHide() { hide.animals.forEach(a => scene.remove(a.g)); hide.animals = []; }
function leaveHide() { clearHide(); hide.state = 'off'; }
function updateHideHud() {
  if (dim !== D_HIDE) return;
  setGameHud([`Знайдено ${hide.found} / ${hide.animals.length}`, `Час ${fmtTime(hide.t)}`],
    hide.state === 'run' && hide.hints > 0 ? [[`Підказка (${hide.hints})`, () => { if (hide.hints > 0) { hide.hints--; hide.hintT = 5; updateHideHud(); } }]] : []);
}
let hideHudT = 0;
function updateHide(dt, t) {
  if (hide.state === 'off') return;
  if (hide.state === 'run') hide.t += dt;
  hide.hintT = Math.max(0, hide.hintT - dt);
  let near = null, nd = Infinity;
  hide.animals.forEach(a => {
    if (a.found) {
      if (a.gone > 0) { a.gone -= dt; a.g.position.y = KH + 1 + Math.max(0, Math.sin((1.2 - a.gone) * 8)) * 0.6; if (a.gone <= 0) a.g.visible = false; }
      return;
    }
    // peeking: a little bob and a turn now and then
    a.g.position.y = KH + 1 + Math.max(0, Math.sin(t * 2 + a.phase)) * 0.12;
    a.g.rotation.y += Math.sin(t * 0.7 + a.phase) * dt * 0.8;
    const d = Math.hypot(a.x - pl.p.x, a.z - pl.p.z);
    if (d < nd) { nd = d; near = a; }
    if (d < 1.9 && Math.abs(pl.p.y - KH - 1) < 1.5) {
      a.found = true; a.gone = 1.2; hide.found++;
      floatHeart(a.x, KH + 2, a.z); burst(a.x - .5, KH + 1, a.z - .5, '#ff6fae', 10);
      sfx.friend();
      toast(`Знайшла: ${MOB_TYPES[a.type].name.toLowerCase()}! ${MOB_TYPES[a.type].say}`, 1800);
      updateHideHud();
      if (hide.found === hide.animals.length) finishHide();
    }
  });
  // the hint uses the arrow from the big world
  if (hide.hintT > 0 && near) {
    const ang = Math.atan2(near.x - pl.p.x, near.z - pl.p.z), camFwd = Math.atan2(-Math.sin(yaw), -Math.cos(yaw));
    compassEl.hidden = false;
    compassArrow.style.transform = `rotate(${wrapAngle(camFwd - ang)}rad)`;
    compassText.textContent = `Тваринка: ${steps(Math.round(nd))}`;
  } else if (dim === D_HIDE) compassEl.hidden = true;
  hideHudT -= dt;
  if (hideHudT <= 0) { hideHudT = 0.25; hudKey = ''; updateHideHud(); }
}
function finishHide() {
  hide.state = 'done';
  if (!hide.best || hide.t < hide.best) hide.best = hide.t;
  scheduleSave();
  sfx.win(); bigText('Усіх знайдено!', 1500);
  const stars = hide.t < 150 ? '★★★' : hide.t < 260 ? '★★☆' : '★☆☆';
  setTimeout(() => showResult(`Усіх знайдено! ${stars}`, `Ангеліна знайшла всіх тваринок за ${fmtTime(hide.t)}. Найкращий час: ${fmtTime(hide.best)}. Наступного разу лабіринт буде інший.`,
    () => restartGameWorld(D_HIDE)), 1600);
}
