// ---------- race ----------
const race = { cars: [], player: null, state: 'off', t: 0, count: 0, laps: 3, engine: null, finished: 0, best: 0, lastCount: 0 };
const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.26, 14);
wheelGeo.rotateZ(Math.PI / 2);
function driverHead(kind, parent) {
  const h = pivot(0, 1.12, -0.25, parent);
  if (kind === 'angelina') {
    box(0.42, 0.4, 0.38, SKIN, 0, 0, 0, h);
    box(0.46, 0.1, 0.42, HAIR, 0, 0.22, 0, h); box(0.46, 0.44, 0.08, HAIR, 0, -0.02, -0.2, h);
    box(0.46, 0.1, 0.05, HAIR, 0, 0.15, 0.19, h);
    box(0.12, 0.1, 0.05, '#ff6fae', 0.12, 0.3, 0.04, h); box(0.12, 0.1, 0.05, '#ff6fae', 0.28, 0.3, 0.04, h);
    eyePair(h, 0, 0.195, 0.09, 0.06, '#1d1630');
  } else if (kind === 'cat') {
    box(0.4, 0.34, 0.34, '#f2a541', 0, 0, 0, h);
    box(0.09, 0.12, 0.06, '#f2a541', -0.12, 0.22, 0, h); box(0.09, 0.12, 0.06, '#f2a541', 0.12, 0.22, 0, h);
    eyePair(h, 0.03, 0.175, 0.09, 0.06, '#3bb54a');
  } else if (kind === 'bunny') {
    box(0.36, 0.32, 0.32, '#f7f3ee', 0, 0, 0, h);
    box(0.08, 0.36, 0.05, '#f7f3ee', -0.08, 0.32, 0, h); box(0.08, 0.36, 0.05, '#f7f3ee', 0.08, 0.32, 0, h);
    eyePair(h, 0.03, 0.165, 0.09, 0.05);
  } else {
    box(0.34, 0.34, 0.42, '#fdf7ff', 0, 0, 0.04, h);
    box(0.06, 0.3, 0.06, '#ffd23f', 0, 0.3, 0.12, h);
    ['#ff6fae', '#b388ff', '#7cc8ff'].forEach((c, i) => box(0.1, 0.12, 0.1, c, 0, 0.14 - i * 0.12, -0.2, h));
    eyePair(h, 0.04, 0.255, 0.1, 0.05, '#3a2f5c');
  }
}
function buildCar(color, driver) {
  const g = new THREE.Group();
  box(1.5, 0.42, 2.7, color, 0, 0.52, 0, g);
  box(1.36, 0.08, 1.0, '#ffffff', 0, 0.76, 0.75, g);
  box(1.3, 0.5, 0.3, color, 0, 0.98, -0.62, g);
  box(1.22, 0.3, 0.06, '#bfe6ff', 0, 0.9, 0.3, g);
  box(1.66, 0.1, 0.34, '#2b2140', 0, 1.2, -1.22, g);
  box(0.08, 0.36, 0.08, '#2b2140', -0.6, 0.98, -1.22, g); box(0.08, 0.36, 0.08, '#2b2140', 0.6, 0.98, -1.22, g);
  box(0.32, 0.14, 0.04, '#fff6a8', -0.48, 0.58, 1.36, g); box(0.32, 0.14, 0.04, '#fff6a8', 0.48, 0.58, 1.36, g);
  box(0.3, 0.12, 0.04, '#ff4040', -0.5, 0.58, -1.36, g); box(0.3, 0.12, 0.04, '#ff4040', 0.5, 0.58, -1.36, g);
  const wheels = [[-0.8, 0.9], [0.8, 0.9], [-0.8, -0.9], [0.8, -0.9]].map(([x, z]) => {
    const p = pivot(x, 0.32, z, g);
    p.add(new THREE.Mesh(wheelGeo, M('#2b2630')));
    box(0.28, 0.12, 0.12, '#d9d9e0', 0, 0, 0, p);
    return p;
  });
  driverHead(driver, g);
  scene.add(g);
  return { g, wheels };
}
const CAR_SPECS = [
  { color: '#3d7be0', driver: 'cat', name: 'Котик', max: 21.5 },
  { color: '#ff4f9a', driver: 'angelina', name: 'Ангеліна', max: 24, player: true },
  { color: '#ffd23f', driver: 'bunny', name: 'Зайчик', max: 22.5 },
  { color: '#9a7bff', driver: 'unicorn', name: 'Єдиноріжка', max: 23 },
];
function raceProgress(c) { return c.lap + c.i / TRACK.N - (c.lap === 0 && c.i > TRACK.N / 2 ? 1 : 0); }
function startRace() {
  race.cars.forEach(c => scene.remove(c.g));
  race.cars = [];
  const T = TRACK, N = T.N;
  // friends in the race take grid slots in a fixed order; computer cars fill the rest
  const racers = [...net.players.values()].filter(P => P.d === D_RACE).map(P => P.id).concat(net.myId).sort();
  const mySlot = racers.indexOf(net.myId);
  const ai = CAR_SPECS.filter(sp => !sp.player).slice(0, Math.max(1, 4 - racers.length));
  const me = { ...CAR_SPECS[1], color: (WARDROBE.dress.items.find(i => i.id === outfit.dress) || {}).sw || '#ff4f9a' };
  const slots = [];
  let next = racers.length;
  ai.forEach(sp => slots.push([sp, next++]));
  slots.push([me, mySlot]);
  slots.forEach(([sp, k]) => {
    const row = Math.floor(k / 2), lane = k % 2 ? 2.3 : -2.3;
    const i = (N - 6 - row * 14) % N, p = T.pts[i];
    const { g, wheels } = buildCar(sp.color, sp.driver);
    const c = { ...sp, g, wheels, x: p.x + p.nx * lane, z: p.z + p.nz * lane, h: Math.atan2(p.tx, p.tz), speed: 0, i, lastI: i, lap: 0, half: false,
      boost: 0, lane: lane * 0.6, baseMax: sp.max, done: false, time: 0, spin: 0 };
    race.cars.push(c);
    if (sp.player) race.player = c;
  });
  race.state = 'count'; race.count = 3.6; race.t = 0; race.finished = 0; race.lastCount = 4;
  race.cars.forEach(placeCar);
  startEngine();
}
function placeCar(c) {
  c.g.position.set(c.x, KH + 1, c.z);
  c.g.rotation.y = c.h;
}
function startEngine() {
  stopEngine();
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sawtooth'; o.frequency.value = 50; g.gain.value = 0;
  o.connect(g).connect(actx.destination); o.start();
  race.engine = { o, g };
}
function stopEngine() {
  if (!race.engine) return;
  try { race.engine.o.stop(); } catch (e) {}
  race.engine = null;
}
function carStep(c, dt, throttle, brake, steer) {
  const T = TRACK, HW = T.HW;
  let n = trackNearest(c.x, c.z, c.i);
  c.i = n.i;
  const onBoost = worlds[D_RACE][I(Math.floor(c.x), KH, Math.floor(c.z))] === BOOST;
  if (onBoost && c.boost < 0.3) { c.boost = 1.3; if (c.player) sfx.boost(); }
  c.boost = Math.max(0, c.boost - dt);
  const off = n.d > HW + 1.2;
  const max = c.max * (off ? 0.45 : 1) + (c.boost > 0 ? 9 : 0);
  if (throttle > 0) c.speed += 15 * throttle * dt;
  if (brake > 0) c.speed -= (c.speed > 0 ? 24 : 9) * brake * dt;
  if (!throttle && !brake) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 5 * dt);
  if (c.boost > 0) c.speed = Math.max(c.speed, max - 3);
  if (c.speed > max) c.speed = Math.max(max, c.speed - 22 * dt);
  c.speed = Math.max(c.speed, -7);
  const grip = clamp(Math.abs(c.speed) / 7, 0, 1) * (c.speed < 0 ? -1 : 1);
  c.h -= steer * 2.3 * dt * grip;
  c.x += Math.sin(c.h) * c.speed * dt;
  c.z += Math.cos(c.h) * c.speed * dt;
  n = trackNearest(c.x, c.z, c.i);
  if (n.d > HW + 4.3) {
    const p = T.pts[n.i], dx = c.x - p.x, dz = c.z - p.z;
    c.x = p.x + dx / n.d * (HW + 4.3); c.z = p.z + dz / n.d * (HW + 4.3);
    c.speed *= 1 - 2.5 * dt;
    const along = Math.atan2(p.tx, p.tz) + (c.speed < 0 ? Math.PI : 0);
    c.h += wrapAngle(along - c.h) * Math.min(1, dt * 3);
  }
  c.i = n.i;
  const N = T.N;
  if (c.lastI > N * 0.85 && c.i < N * 0.15) { if (c.lap === 0 || c.half) { c.lap++; c.half = false; if (c.player && c.lap > 1 && c.lap <= race.laps) bigText(`Коло ${c.lap}!`, 1000); } }
  else if (c.lastI < N * 0.15 && c.i > N * 0.85 && c.lap > 0) { c.lap--; c.half = true; }
  if (c.i > N * 0.4 && c.i < N * 0.6) c.half = true;
  c.lastI = c.i;
  c.spin += c.speed * dt / 0.32;
  c.wheels.forEach(w => { w.rotation.x = c.spin; });
  c.wheels[0].rotation.y = c.wheels[1].rotation.y = steer * 0.35;
  placeCar(c);
  c.g.position.y += c.boost > 0 ? Math.sin(race.t * 40) * 0.03 : 0;
}
function aiControls(c) {
  const T = TRACK, look = T.pts[(c.i + 10) % T.N];
  const tx = look.x + look.nx * c.lane, tz = look.z + look.nz * c.lane;
  const diff = wrapAngle(Math.atan2(tx - c.x, tz - c.z) - c.h);
  const lead = raceProgress(c) - raceProgress(race.player);
  c.max = c.baseMax + (lead > 0.12 ? -4 : lead < -0.25 ? 2.5 : 0);
  return { throttle: Math.abs(diff) > 0.7 ? 0.4 : 1, brake: 0, steer: clamp(-diff * 2.2, -1, 1) };
}
function updateRace(dt) {
  if (race.state === 'off') return;
  const P = race.player;
  if (race.state === 'count') {
    race.count -= dt;
    const n = Math.ceil(race.count - 0.6);
    if (n !== race.lastCount && n >= 1 && n <= 3) { race.lastCount = n; bigText(String(n), 700); sfx.tick(); }
    if (race.count <= 0.6 && race.lastCount !== 0) { race.lastCount = 0; bigText('Старт!', 900); sfx.go(); race.state = 'run'; }
  }
  if (race.state === 'run' || race.state === 'done') {
    race.t += dt;
    race.cars.forEach(c => {
      let ctl;
      if (c.player && !c.done) {
        const st = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
        const gas = keys.KeyW || keys.ArrowUp || joy.y > 0.25 ? 1 : 0;
        const brk = keys.KeyS || keys.ArrowDown || joy.y < -0.3 ? 1 : 0;
        ctl = { throttle: playing ? gas : 0, brake: playing ? brk : 0, steer: playing ? clamp(st, -1, 1) : 0 };
      } else if (c.player) ctl = { throttle: 0, brake: 0.4, steer: 0 };
      else ctl = aiControls(c);
      carStep(c, dt, ctl.throttle, ctl.brake, ctl.steer);
      if (!c.done && c.lap > race.laps) {
        c.done = true; c.time = race.t; race.finished++; c.place = race.finished + (c.player ? remoteRacersAhead(raceProgress(c)).ahead : 0);
        if (c.player) finishRace();
      }
    });
    pushFromRemoteCars(P);
    for (let a = 0; a < race.cars.length; a++) for (let b = a + 1; b < race.cars.length; b++) {
      const A = race.cars[a], B = race.cars[b], dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz);
      if (d > 0.01 && d < 1.9) { const push = (1.9 - d) / 2; A.x -= dx / d * push; A.z -= dz / d * push; B.x += dx / d * push; B.z += dz / d * push; A.speed *= 0.985; B.speed *= 0.985; }
    }
  }
  if (race.engine) {
    race.engine.o.frequency.value = 50 + Math.abs(P.speed) * 7;
    race.engine.g.gain.value = soundOn && race.state !== 'off' ? 0.012 : 0;
  }
  const score = c => c.done ? 1000 - c.place : raceProgress(c);
  const rem = remoteRacersAhead(raceProgress(P));
  const place = 1 + race.cars.filter(c => c !== P && score(c) > score(P)).length + (P.done ? 0 : rem.ahead);
  setGameHud([`Коло ${clamp(P.lap, 1, race.laps)} / ${race.laps}`, `Місце ${P.done ? P.place : place} / ${race.cars.length + rem.total}`, `Час ${fmtTime(P.done ? P.time : race.t)}`]);
}
function finishRace() {
  const P = race.player;
  if (!race.best || P.time < race.best) race.best = P.time;
  scheduleSave();
  sfx.win();
  bigText('Фініш!', 1400);
  const titles = ['Перемога! Перше місце!', 'Друге місце!', 'Третє місце!', 'Четверте місце'];
  setTimeout(() => showResult(titles[P.place - 1] || `${P.place}-е місце`,
    `Час: ${fmtTime(P.time)}. Найкращий час: ${fmtTime(race.best)}.${P.place === 1 ? ' Ангеліна найшвидша на трасі!' : ' Спробуй ще раз, щоб приїхати першою!'}`,
    () => { startRace(); netSend({ t: 'raceStart' }); }), 1600);
}
const raceLook = new THREE.Vector3(), raceCam = new THREE.Vector3();
function raceCamera(dt) {
  const c = race.player;
  if (!c) return;
  const fx = Math.sin(c.h), fz = Math.cos(c.h);
  if (view === 'fp') {
    camera.position.set(c.x + fx * 0.1, KH + 2.35, c.z + fz * 0.1);
    raceLook.set(c.x + fx * 10, KH + 1.9, c.z + fz * 10);
    camera.lookAt(raceLook);
    c.g.children.forEach(o => { if (o.position.y > 1 && o.position.z < 0) o.visible = false; });
    return;
  }
  c.g.children.forEach(o => { o.visible = true; });
  raceCam.set(c.x - fx * 7, KH + 4.4, c.z - fz * 7);
  if (camera.position.distanceTo(raceCam) > 20) camera.position.copy(raceCam);
  camera.position.lerp(raceCam, Math.min(1, dt * 6));
  raceLook.set(c.x + fx * 3, KH + 2, c.z + fz * 3);
  camera.lookAt(raceLook);
}
function leaveRace() {
  race.cars.forEach(c => scene.remove(c.g));
  race.cars = []; race.player = null; race.state = 'off';
  stopEngine();
}
