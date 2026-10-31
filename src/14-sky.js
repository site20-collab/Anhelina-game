// ---------- sky, day and night ----------
const DAY_LEN = 600;
// 0.0 sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight; the game starts in the morning
const sky = { t: 0.12, night: true, light: 1, dark: 0 };
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(230, 32, 16), new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color(0x4aa8ff) }, horizon: { value: new THREE.Color(0x9fd8ff) }, glow: { value: new THREE.Color(0xffb38a) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, glowAmt: { value: 0 } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; uniform vec3 sunDir; uniform float glowAmt; varying vec3 vDir;
    void main(){
      float h = clamp(vDir.y, -0.2, 1.0);
      vec3 c = mix(horizon, top, pow(max(h, 0.0), 0.6));
      float s = max(dot(normalize(vec3(vDir.x, 0.0, vDir.z)), normalize(vec3(sunDir.x, 0.0, sunDir.z))), 0.0);
      c = mix(c, glow, glowAmt * pow(s, 3.0) * (1.0 - smoothstep(0.0, 0.45, h)));
      gl_FragColor = vec4(c, 1.0);
    }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
}));
skyDome.renderOrder = -10;
scene.add(skyDome);
scene.background = null;
function discSprite(inner, outer, size) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, inner); gr.addColorStop(0.45, inner); gr.addColorStop(0.55, outer); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, fog: false, depthWrite: false }));
  s.scale.set(size, size, 1); s.renderOrder = -9;
  scene.add(s);
  return s;
}
const sunSprite = discSprite('#fff8d0', 'rgba(255,220,120,0.5)', 34);
const moonSprite = discSprite('#f4f1ff', 'rgba(200,210,255,0.3)', 22);
const stars = (() => {
  const n = 900, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = hash(i, 1, 501), v = hash(i, 2, 502), th = u * Math.PI * 2, ph = Math.acos(1 - v * 0.95);
    pos[i * 3] = Math.sin(ph) * Math.cos(th) * 200; pos[i * 3 + 1] = Math.cos(ph) * 200; pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 200;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  p.renderOrder = -9;
  scene.add(p);
  return p;
})();
const hemi = scene.children.find(o => o.isHemisphereLight);
const C_NIGHT_TOP = new THREE.Color(0x070b24), C_NIGHT_HOR = new THREE.Color(0x1d2b5e), C_DUSK = new THREE.Color(0xff9a6b), C_DAY_TOP = new THREE.Color(0x3d9cff);
const _hor = new THREE.Color(), _top = new THREE.Color(), _day = new THREE.Color(), _dir = new THREE.Vector3();
function updateSky(dt, dayHorizon) {
  // games are always in daylight; the big worlds follow the clock unless night is switched off
  const games = dim > D_CASTLE;
  if (!games && sky.night) sky.t = (sky.t + dt / DAY_LEN) % 1;
  const t = games || !sky.night ? 0.25 : sky.t;
  const a = t * Math.PI * 2;
  _dir.set(Math.cos(a), Math.sin(a), 0.35).normalize();
  const h = _dir.y;
  sky.light = THREE.MathUtils.smoothstep(h, -0.12, 0.28);
  sky.dark = 1 - sky.light;
  const dusk = Math.exp(-Math.pow(h / 0.2, 2));
  _hor.copy(C_NIGHT_HOR).lerp(dayHorizon, sky.light).lerp(C_DUSK, dusk * 0.55);
  _day.copy(dayHorizon).lerp(C_DAY_TOP, 0.45);
  _top.copy(C_NIGHT_TOP).lerp(_day, sky.light);
  const u = skyDome.material.uniforms;
  u.top.value.copy(_top); u.horizon.value.copy(_hor); u.sunDir.value.copy(_dir); u.glowAmt.value = dusk * 0.8;
  skyDome.position.copy(camera.position);
  stars.position.copy(camera.position);
  stars.material.opacity = Math.max(0, sky.dark - 0.25) * 1.2;
  stars.rotation.y = a * 0.25;
  sunSprite.position.copy(camera.position).addScaledVector(_dir, 190);
  moonSprite.position.copy(camera.position).addScaledVector(_dir, -190);
  sunSprite.material.opacity = clamp(h * 4 + 0.3, 0, 1);
  moonSprite.material.opacity = clamp(-h * 4 + 0.3, 0, 1);
  // the light never gets fully dark so an eight-year-old can still find her way at night
  hemi.intensity = 0.36 + 0.46 * sky.light;
  hemi.color.setRGB(0.75 + 0.25 * sky.light, 0.8 + 0.2 * sky.light, 1);
  sun.intensity = 0.1 + 0.48 * sky.light;
  if (h > 0) sun.position.copy(_dir); else sun.position.copy(_dir).negate();
  cloudMat.color.setRGB(0.45 + 0.55 * sky.light, 0.48 + 0.52 * sky.light, 0.6 + 0.4 * sky.light);
  return _hor;
}
function isNight() { return sky.dark > 0.6; }

// ---------- butterflies by day, fireflies at night ----------
const butterflies = [];
const wingGeo = new THREE.PlaneGeometry(0.22, 0.18);
wingGeo.translate(0.11, 0, 0);
['#ff9fd2', '#ffd23f', '#9ad8ff', '#c9a8ff', '#ffffff', '#ff8a1f'].forEach((c, i) => {
  for (let k = 0; k < 3; k++) {
    const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, fog: true });
    const l = new THREE.Mesh(wingGeo, m), r = new THREE.Mesh(wingGeo, m);
    r.rotation.y = Math.PI;
    g.add(l, r);
    g.visible = false;
    scene.add(g);
    butterflies.push({ g, l, r, home: new THREE.Vector3(), p: new THREE.Vector3(), ph: i * 2 + k, life: 0 });
  }
});
const fireflies = (() => {
  const n = 70, pos = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff28a, size: 0.22, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.frustumCulled = false;
  scene.add(p);
  return { p, seeds: Array.from({ length: n }, (_, i) => [hash(i, 1, 801) * 40 - 20, hash(i, 2, 802) * 40 - 20, hash(i, 3, 803) * 6.28]) };
})();
function updateFauna(dt, t) {
  const outside = dim === D_MAIN || dim === D_CASTLE || dim === D_HIDE;
  const day = outside && sky.light > 0.5;
  butterflies.forEach((b, i) => {
    if (!day) { b.g.visible = false; b.life = 0; return; }
    b.life -= dt;
    if (b.life <= 0 || b.p.distanceTo(pl.p) > 34) {
      const a = hash(i, Math.floor(t), 811) * 6.28, r = 6 + hash(i, Math.floor(t), 812) * 18;
      const x = Math.floor(pl.p.x + Math.cos(a) * r), z = Math.floor(pl.p.z + Math.sin(a) * r);
      b.home.set(x + .5, surfaceY(x, z) + 1.2, z + .5); b.p.copy(b.home); b.life = 8 + hash(i, 5, 813) * 8;
    }
    b.p.set(b.home.x + Math.sin(t * 0.7 + b.ph) * 1.6, b.home.y + Math.sin(t * 1.3 + b.ph) * 0.4 + 0.3, b.home.z + Math.cos(t * 0.6 + b.ph) * 1.6);
    b.g.position.copy(b.p);
    b.g.rotation.y = t * 0.7 + b.ph + Math.PI / 2;
    const flap = Math.sin(t * 18 + b.ph) * 1.1;
    b.l.rotation.y = flap; b.r.rotation.y = Math.PI - flap;
    b.g.visible = true;
  });
  const night = outside && sky.dark > 0.55;
  fireflies.p.material.opacity = night ? (sky.dark - 0.55) * 2 : 0;
  if (night) {
    const pos = fireflies.p.geometry.attributes.position;
    fireflies.seeds.forEach(([sx, sz, ph], i) => {
      const x = pl.p.x + sx + Math.sin(t * 0.4 + ph) * 2, z = pl.p.z + sz + Math.cos(t * 0.3 + ph) * 2;
      pos.setXYZ(i, x, surfaceY(Math.floor(x), Math.floor(z)) + 0.8 + Math.sin(t * 0.9 + ph) * 0.6, z);
    });
    pos.needsUpdate = true;
  }
}

// ---------- little fish in lakes and the castle moat ----------
const fishes = [];
['#ff8a1f', '#ffd23f', '#ff6fae', '#7cc8ff', '#b388ff', '#ffffff'].forEach((c, i) => {
  for (let k = 0; k < 4; k++) {
    const g = new THREE.Group();
    box(0.34, 0.16, 0.12, c, 0, 0, 0, g);
    box(0.12, 0.16, 0.04, c, -0.22, 0, 0, g);
    box(0.04, 0.04, 0.02, '#1a1a1a', 0.12, 0.03, 0.065, g);
    g.visible = false;
    scene.add(g);
    fishes.push({ g, c: new THREE.Vector3(), a: (i * 4 + k) * 0.7, r: 1 + (k % 3) * 0.6, sp: 0.6 + (k % 2) * 0.5, life: 0, ok: false });
  }
});
function waterSpot(x, z) {
  let y = surfaceY(x, z);
  if (get(x, y, z) !== WATER || get(x, y + 1, z) !== WATER) return null;
  return y + 0.7;
}
function updateFishSchool(dt, t) {
  const here = dim === D_MAIN || dim === D_CASTLE || dim === D_FISH;
  fishes.forEach((f, i) => {
    if (!here) { f.g.visible = false; f.ok = false; return; }
    f.life -= dt;
    if (!f.ok || f.life <= 0 || f.c.distanceTo(pl.p) > 45) {
      f.ok = false; f.g.visible = false;
      for (let tries = 0; tries < 4 && !f.ok; tries++) {
        const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 30;
        const x = Math.floor(pl.p.x + Math.cos(a) * r), z = Math.floor(pl.p.z + Math.sin(a) * r);
        const y = waterSpot(x, z);
        if (y !== null) { f.c.set(x + .5, y, z + .5); f.ok = true; f.life = 10 + Math.random() * 15; }
      }
      if (!f.ok) return;
    }
    f.a += f.sp * dt;
    const x = f.c.x + Math.cos(f.a) * f.r, z = f.c.z + Math.sin(f.a) * f.r;
    if (get(Math.floor(x), Math.floor(f.c.y), Math.floor(z)) !== WATER) { f.sp = -f.sp; f.a += f.sp * dt * 2; return; }
    f.g.position.set(x, f.c.y + Math.sin(t * 3 + i) * 0.05, z);
    f.g.rotation.y = -f.a - (f.sp > 0 ? Math.PI / 2 : -Math.PI / 2);
    f.g.children[1].rotation.y = Math.sin(t * 12 + i) * 0.5;
    f.g.visible = true;
  });
}
