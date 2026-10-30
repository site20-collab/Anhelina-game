// ---------- portals ----------
function portalMaterial(a, b) {
  return new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, ca: { value: new THREE.Color(a) }, cb: { value: new THREE.Color(b) } },
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float t; uniform vec3 ca; uniform vec3 cb;
      void main(){
        vec2 p = (vUv - 0.5) * vec2(2.0, 3.2);
        float r = length(p), a = atan(p.y, p.x);
        float s = sin(a * 3.0 + r * 6.0 - t * 3.0) * 0.5 + 0.5;
        vec3 c = mix(ca, cb, s);
        c = mix(c, vec3(1.0, 0.97, 1.0), smoothstep(0.7, 0.0, r) * 0.7);
        gl_FragColor = vec4(c, 0.88);
      }`,
  });
}
function makePortal(frame, top, a, b, label) {
  const g = new THREE.Group();
  box(0.5, 3.6, 0.5, frame, -1.25, 1.8, 0, g);
  box(0.5, 3.6, 0.5, frame, 1.25, 1.8, 0, g);
  box(3.2, 0.5, 0.6, top, 0, 3.75, 0, g);
  box(0.62, 0.3, 0.62, '#f4c23f', -1.25, 0.15, 0, g);
  box(0.62, 0.3, 0.62, '#f4c23f', 1.25, 0.15, 0, g);
  box(0.4, 0.4, 0.4, '#f4c23f', 0, 4.2, 0, g).rotation.z = Math.PI / 4;
  const mat = portalMaterial(a, b);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.2), mat);
  plane.position.y = 1.7;
  g.add(plane);
  if (label) { const s = textSprite(label, 2, 'rgba(106,76,255,.88)'); s.position.y = 5.2; g.add(s); }
  g.visible = false;
  scene.add(g);
  return { g, mat };
}
// side: which side of the portal you step out on (+1 south, -1 north)
const PORTALS = [
  { dim: D_MAIN, to: D_CASTLE, x: CX, z: CZ - 5, side: 1, open: false, ...makePortal('#9a7bff', '#ff6fae', '#9e61ff', '#ff6bbd', 'До замку') },
  { dim: D_CASTLE, to: D_MAIN, x: CX, z: CZ + 50, side: -1, open: true, ...makePortal('#9a7bff', '#ff6fae', '#9e61ff', '#ff6bbd', 'Додому') },
  { dim: D_CASTLE, to: D_RACE, x: CX - 28, z: CZ + 62, side: -1, open: true, ...makePortal('#3d7be0', '#ffd23f', '#3d9bff', '#ffe066', 'Гонки') },
  { dim: D_CASTLE, to: D_ART, x: CX - 14, z: CZ + 62, side: -1, open: true, ...makePortal('#3bb54a', '#ff8a1f', '#5fd36a', '#ffb347', 'Повтори картинку') },
  { dim: D_CASTLE, to: D_ARENA, x: CX, z: CZ + 66, side: -1, open: true, ...makePortal('#ff4f9a', '#ffffff', '#ff4f9a', '#ffc2e0', 'Цукеркова битва') },
  { dim: D_CASTLE, to: D_HIDE, x: CX + 14, z: CZ + 62, side: -1, open: true, ...makePortal('#3f9b3a', '#ffd23f', '#5cbf4f', '#c9f29b', 'Хованки') },
  { dim: D_CASTLE, to: D_JUMP, x: CX + 28, z: CZ + 62, side: -1, open: true, ...makePortal('#7cc8ff', '#ffffff', '#9ad8ff', '#ffffff', 'Стрибки по хмаринках') },
];
const GAME_START = {
  [D_RACE]: { x: CX, z: CZ, face: 0, yaw: Math.PI },
  [D_ART]: { x: CX, z: CZ + 1, face: Math.PI, yaw: 0, pitch: 0.12 },
  [D_ARENA]: { x: CX, z: CZ + 22, face: Math.PI, yaw: 0 },
  [D_HIDE]: () => hideStart(),
  [D_JUMP]: () => jumpStart(),
};
function placePortal(P) {
  withDim(P.dim, () => {
    const gy = surfaceY(P.x, P.z);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -2; dx <= 2; dx++) {
      for (let y = gy; y <= gy + 4; y++) setB(P.x + dx, y, P.z + dz, 0);
      if (!isOpaque(get(P.x + dx, gy - 1, P.z + dz))) setB(P.x + dx, gy - 1, P.z + dz, CASTLE);
    }
    P.gy = gy;
  });
  P.g.position.set(P.x + .5, P.gy, P.z + .5);
}
function arrivalFor(to, from) {
  if (GAME_START[to]) return typeof GAME_START[to] === 'function' ? GAME_START[to]() : GAME_START[to];
  const P = PORTALS.find(p => p.dim === to && p.to === from) || PORTALS.find(p => p.dim === to);
  return { x: P.x, z: P.z + P.side * 3, face: P.side > 0 ? 0 : Math.PI, yaw: P.side > 0 ? Math.PI : 0 };
}
// a game's world is built on the way in and dropped on the way out, so only the two big worlds stay in memory
const GEN = { [D_RACE]: () => generateRace(), [D_ART]: () => generateArt(), [D_ARENA]: () => generateArena(), [D_HIDE]: () => generateHide(), [D_JUMP]: () => generateJump() };
function switchDim(to) {
  const from = dim;
  if (to > D_CASTLE && !worlds[to]) { allocDim(to); useDim(to); GEN[to](); }
  dim = to; useDim(to);
  if (from !== to) freeDim(from);
}
let portalLock = false, traveling = false;
const fadeEl = document.getElementById('fade');
function travel(to) {
  if (traveling) return;
  traveling = true;
  const from = dim;
  fadeEl.classList.add('on');
  sfx.portal();
  setTimeout(() => {
    leaveGame(from);
    switchDim(to);
    const a = arrivalFor(to, from);
    pl.p.set(a.x + .5, surfaceY(a.x, a.z) + 0.01, a.z + .5); pl.vel.set(0, 0, 0);
    pl.facing = a.face; yaw = a.yaw; pitch = view === 'fp' ? 0 : (a.pitch ?? 0.38); camDist = dist;
    portalLock = true;
    hearts.forEach(h => { const on = to === D_MAIN && !collected.has(h.id); h.mesh.visible = on; });
    curBiome = -1;
    buildGirl();
    applyMode();
    resetChunks(); refreshChunks(pl.p.x, pl.p.z, true); buildCount(9);
    enterGame(to);
    setTimeout(() => {
      fadeEl.classList.remove('on'); traveling = false;
      if (to === D_CASTLE && from === D_MAIN) toast('Ласкаво просимо до замку принцеси Ангеліни!', 3000);
      if (to === D_MAIN) toast('Ангеліна повернулася додому', 2200);
    }, 120);
  }, 450);
}
function updatePortals(dt, t) {
  PORTALS.forEach(P => {
    P.mat.uniforms.t.value = t;
    P.g.visible = P.open && P.dim === dim && Math.hypot(P.x - pl.p.x, P.z - pl.p.z) < 120;
  });
  if (traveling) return;
  let near = Infinity;
  PORTALS.forEach(P => {
    if (!P.open || P.dim !== dim) return;
    const dx = pl.p.x - (P.x + .5), dz = pl.p.z - (P.z + .5), dy = pl.p.y - P.gy;
    const d = Math.hypot(dx, dz);
    near = Math.min(near, d);
    if (d < 30 && Math.random() < dt * 10) sparkle(P.x + .5 + (Math.random() - .5) * 2.4, P.gy + Math.random() * 3.5, P.z + .5 + (Math.random() - .5) * 0.6);
    if (!portalLock && Math.abs(dx) < 1 && Math.abs(dz) < 0.5 && dy > -0.5 && dy < 3) travel(P.to);
  });
  if (portalLock && near > 2.5) portalLock = false;
}
