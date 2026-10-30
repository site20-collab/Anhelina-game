// ---------- the sign by Angelina's house ----------
function signTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 150;
  const g = c.getContext('2d');
  g.fillStyle = '#e8c48a'; g.fillRect(0, 0, 256, 150);
  for (let y = 0; y < 150; y += 30) { g.fillStyle = 'rgba(140,101,52,.25)'; g.fillRect(0, y, 256, 2); }
  g.fillStyle = '#6b4426'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 34px Nunito, system-ui, sans-serif';
  g.fillText('Підійди', 128, 52);
  g.fillText('й прочитай', 128, 92);
  g.fillStyle = '#ff4f9a'; g.font = 'bold 30px Nunito, system-ui, sans-serif'; g.fillText('♥', 128, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}
function openSign() {
  $('signCard').hidden = false; playing = false;
  sfx.heart();
  for (let i = 0; i < 6; i++) floatHeart(pl.p.x + (Math.random() - .5) * 2, pl.p.y + 2 + Math.random(), pl.p.z + (Math.random() - .5) * 2);
}
$('signClose').addEventListener('click', () => { $('signCard').hidden = true; playing = true; });

// ---------- sleeping through the night ----------
const MORNING = 0.03;
let sleeping = false;
function goToSleep() {
  if (sleeping) return;
  sleeping = true; playing = false;
  fadeEl.classList.add('sleep', 'on');
  bigText('Добраніч… Z z z', 1800);
  setTimeout(() => {
    sky.t = MORNING;
    netSend({ t: 'sleep' });
    scheduleSave();
    setTimeout(() => {
      fadeEl.classList.remove('on');
      setTimeout(() => fadeEl.classList.remove('sleep'), 500);
      sleeping = false; playing = true;
      toast('Доброго ранку, Ангеліно!', 2500);
      sfx.heart();
    }, 900);
  }, 1700);
}

// ---------- the big TV in the castle cinema ----------
const TV = { x: CX + 10, z: CZ - 16.75, y: KH + 1.4, w: 6, h: 3.4 };
const cartoon = { c: document.createElement('canvas'), t: 0, acc: 0, scene: 0 };
cartoon.c.width = 320; cartoon.c.height = 180;
const cartoonTex = new THREE.CanvasTexture(cartoon.c);
cartoonTex.magFilter = THREE.NearestFilter;
const cartoonMat = new THREE.MeshBasicMaterial({ map: cartoonTex });
// a hole in the picture: the YouTube player sits behind the canvas and shows through here,
// so walls and furniture in front of the TV still cover it
const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending, fog: false });
let tvScreenMesh = null;
const tvGroup = (() => {
  const g = new THREE.Group();
  box(TV.w + 0.5, TV.h + 0.5, 0.3, '#2b2140', 0, TV.h / 2, 0, g);
  box(0.6, 0.18, 0.18, '#ff4f9a', -TV.w / 2 + 0.2, TV.h + 0.32, 0.05, g);
  tvScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(TV.w, TV.h), cartoonMat);
  tvScreenMesh.position.set(0, TV.h / 2, 0.16);
  g.add(tvScreenMesh);
  g.position.set(TV.x + .5, TV.y, TV.z);
  g.visible = false;
  scene.add(g);
  return g;
})();
// our own little cartoons: four short stories that loop
const SCENES = [
  { title: 'Котик і метелик', len: 12 },
  { title: 'Зайчик і морквинка', len: 12 },
  { title: 'Хмаринка-поливайка', len: 12 },
  { title: 'Добраніч, зірочки', len: 12 },
];
function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function drawField(g, sky1, sky2) {
  const gr = g.createLinearGradient(0, 0, 0, 180); gr.addColorStop(0, sky1); gr.addColorStop(1, sky2);
  g.fillStyle = gr; g.fillRect(0, 0, 320, 180);
  px(g, 0, 130, 320, 50, '#67b845'); px(g, 0, 130, 320, 4, '#86d860');
}
function drawCat(g, x, y, s, t) {
  px(g, x, y, 34 * s, 20 * s, '#f2a541'); px(g, x + 26 * s, y - 14 * s, 20 * s, 18 * s, '#f2a541');
  px(g, x + 27 * s, y - 20 * s, 5 * s, 7 * s, '#f2a541'); px(g, x + 39 * s, y - 20 * s, 5 * s, 7 * s, '#f2a541');
  px(g, x + 31 * s, y - 9 * s, 3 * s, 4 * s, '#2b2140'); px(g, x + 39 * s, y - 9 * s, 3 * s, 4 * s, '#2b2140');
  px(g, x + 35 * s, y - 4 * s, 3 * s, 2 * s, '#ff8fa8');
  px(g, x - 10 * s, y - 6 * s + Math.sin(t * 6) * 3, 12 * s, 4 * s, '#e08a22');
  const st = Math.sin(t * 12) * 3 * s;
  px(g, x + 3 * s, y + 20 * s, 5 * s, 8 * s + st, '#e08a22'); px(g, x + 26 * s, y + 20 * s, 5 * s, 8 * s - st, '#e08a22');
}
function drawBunny(g, x, y, t) {
  px(g, x, y, 26, 20, '#ffffff'); px(g, x + 16, y - 14, 18, 16, '#ffffff');
  px(g, x + 18, y - 30, 5, 17, '#ffffff'); px(g, x + 27, y - 30, 5, 17, '#ffffff');
  px(g, x + 19, y - 27, 3, 12, '#ffb6c8'); px(g, x + 28, y - 27, 3, 12, '#ffb6c8');
  px(g, x + 21, y - 9, 3, 3, '#2b2140'); px(g, x + 28, y - 9, 3, 3, '#2b2140'); px(g, x + 25, y - 4, 3, 2, '#ff8fa8');
  px(g, x - 4, y + 4, 7, 7, '#f4f4f4');
}
function drawCloudFace(g, x, y, sad) {
  px(g, x, y + 8, 80, 26, '#ffffff'); px(g, x + 12, y, 56, 12, '#ffffff'); px(g, x + 24, y - 8, 30, 10, '#ffffff');
  px(g, x + 26, y + 16, 5, 6, '#2b2140'); px(g, x + 50, y + 16, 5, 6, '#2b2140');
  if (sad) px(g, x + 34, y + 27, 14, 3, '#2b2140'); else { px(g, x + 34, y + 26, 14, 3, '#c4486a'); px(g, x + 32, y + 24, 3, 3, '#c4486a'); px(g, x + 47, y + 24, 3, 3, '#c4486a'); }
  px(g, x + 18, y + 24, 7, 3, '#ffb6c8'); px(g, x + 56, y + 24, 7, 3, '#ffb6c8');
}
function drawFlower(g, x, y, h, col) {
  px(g, x, y - h, 3, h, '#3f9b3a');
  if (h > 10) { px(g, x - 5, y - h - 6, 13, 7, col); px(g, x - 2, y - h - 9, 7, 13, col); px(g, x - 1, y - h - 5, 5, 5, '#ffd23f'); }
}
function drawCartoon(dt) {
  const g = cartoon.c.getContext('2d');
  cartoon.t += dt;
  const sc = SCENES[cartoon.scene];
  if (cartoon.t > sc.len) { cartoon.t = 0; cartoon.scene = (cartoon.scene + 1) % SCENES.length; }
  const t = cartoon.t;
  if (cartoon.scene === 0) {
    drawField(g, '#9fd8ff', '#d6f0ff');
    px(g, 260, 18, 30, 30, '#ffe066');
    for (let i = 0; i < 6; i++) drawFlower(g, 30 + i * 52, 132, 16, ['#ff4f9a', '#ffd23f', '#9a7bff'][i % 3]);
    const bx = 40 + t * 22, by = 70 + Math.sin(t * 3) * 18;
    const fl = Math.sin(t * 20) > 0 ? 8 : 4;
    px(g, bx, by, fl, 7, '#ff9fd2'); px(g, bx + 9, by, fl, 7, '#ff9fd2'); px(g, bx + fl, by + 1, 2, 6, '#2b2140');
    const jump = Math.max(0, Math.sin(t * 2.4)) * 26;
    drawCat(g, bx - 70, 104 - jump, 1, t);
    if (t > 9) { g.fillStyle = '#ff4f9a'; g.font = 'bold 22px Nunito, sans-serif'; g.fillText('♥', bx - 30, 60); }
  } else if (cartoon.scene === 1) {
    drawField(g, '#bfe6ff', '#e8f6ff');
    const grow = clamp((t - 2) / 4, 0, 1);
    px(g, 220, 130 - 30 * grow, 10, 30 * grow, '#ff8a1f');
    px(g, 216, 118 - 30 * grow, 6, 12, '#3f9b3a'); px(g, 226, 116 - 30 * grow, 6, 14, '#3f9b3a');
    const hop = Math.abs(Math.sin(t * 4)) * 20, x = Math.min(170, 10 + t * 26);
    drawBunny(g, x, 110 - hop, t);
    if (t > 8) for (let i = 0; i < 4; i++) { g.fillStyle = '#ff4f9a'; g.font = 'bold 18px Nunito, sans-serif'; g.fillText('♥', 170 + i * 16, 60 - ((t * 20 + i * 10) % 40)); }
  } else if (cartoon.scene === 2) {
    drawField(g, '#a9c9e8', '#dceeff');
    const rain = t > 2 && t < 8;
    drawCloudFace(g, 40 + Math.sin(t) * 30, 20, t < 2);
    if (rain) for (let i = 0; i < 24; i++) px(g, 60 + (i * 37) % 160 + Math.sin(t) * 30, 60 + ((t * 120 + i * 23) % 70), 2, 6, '#3d8fe0');
    for (let i = 0; i < 5; i++) drawFlower(g, 70 + i * 34, 132, clamp((t - 3) * 6, 2, 26), ['#ff4f9a', '#ffd23f', '#9a7bff', '#ff8a1f', '#4a7bff'][i]);
    if (t > 8) ['#e8333a', '#ff8a1f', '#ffd23f', '#3bb54a', '#3d7be0', '#8a4fd8'].forEach((c, k) => {
      g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); g.arc(160, 150, 120 - k * 6, Math.PI, Math.PI * 2); g.stroke();
    });
  } else {
    const gr = g.createLinearGradient(0, 0, 0, 180); gr.addColorStop(0, '#0b1033'); gr.addColorStop(1, '#2a3a7a');
    g.fillStyle = gr; g.fillRect(0, 0, 320, 180);
    for (let i = 0; i < 40; i++) { const on = Math.sin(t * 3 + i) > -0.3; if (on) px(g, (i * 71) % 320, (i * 37) % 120, 3, 3, '#fff6b0'); }
    px(g, 220, 24, 44, 44, '#f4f1ff'); px(g, 232, 40, 5, 5, '#2b2140'); px(g, 248, 40, 5, 5, '#2b2140'); px(g, 236, 54, 14, 3, '#c4486a');
    px(g, 0, 140, 320, 40, '#1f3a2a');
    drawCat(g, 60, 128, 0.8, 0);
    g.fillStyle = '#fff'; g.font = 'bold 16px Nunito, sans-serif'; g.fillText('z', 110, 112 - (t * 8) % 20); g.fillText('Z', 122, 98 - (t * 8) % 20);
  }
  // title card at the start of each story
  if (t < 1.6) {
    g.fillStyle = 'rgba(255,255,255,.88)'; g.fillRect(40, 66, 240, 46);
    g.fillStyle = '#ff4f9a'; g.font = 'bold 22px Comfortaa, Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(sc.title, 160, 90);
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
  }
  cartoonTex.needsUpdate = true;
}

// ---------- the TV panel: our cartoons, plus YouTube links an adult adds ----------
let ytList = [];
const ytAllowed = () => !/claude/i.test(location.hostname);
let tvMode = 'ours';
function renderTv() {
  const scr = $('tvScreen'), ch = $('tvChannels');
  scr.textContent = '';
  scr.appendChild(cartoon.c);
  ch.textContent = '';
  const mk = (label, id) => {
    const b = document.createElement('button'); b.className = 'chip' + ((tvVideo.id || 'ours') === id ? ' on' : ''); b.textContent = label;
    b.addEventListener('click', () => {
      if (id === 'ours') { stopTvVideo(); shareTv(''); renderTv(); return; }
      // a YouTube cartoon goes onto the TV in the room, so Angelina can walk around and watch
      closeTv(); shareTv(id); startTvVideo(id);
      toast('Мультик іде на телевізорі. Можна ходити кімнатою й дивитися', 3000);
    });
    ch.appendChild(b);
  };
  mk('Наші мультики', 'ours');
  if (ytAllowed()) ytList.forEach(v => mk(v.name, v.id));
  $('tvParent').hidden = !ytAllowed();
}
function openTv() {
  tvMode = 'ours';
  renderTv();
  $('tvPanel').hidden = false; playing = false;
  if (document.pointerLockElement) document.exitPointerLock();
}
function closeTv() {
  $('tvScreen').textContent = '';
  $('tvPanel').hidden = true; playing = true;
}
$('tvClose').addEventListener('click', closeTv);
$('ytAdd').addEventListener('click', () => {
  const m = $('ytLink').value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);
  if (!m) { toast('Це не схоже на посилання YouTube', 1800); return; }
  if (!ytList.some(v => v.id === m[1])) ytList.push({ id: m[1], name: `Мультик ${ytList.length + 1}` });
  ytList = ytList.slice(-20);
  $('ytLink').value = '';
  scheduleSave();
  closeTv(); shareTv(m[1]); startTvVideo(m[1]);
  toast('Мультик іде на телевізорі. Можна ходити кімнатою й дивитися', 3000);
});

// ---------- the action button for whatever is nearby ----------
const actBtn = $('actBtn');
let actKind = '';
function nearbyAction() {
  if (!playing || wardrobeOpen || traveling) return '';
  if (dim === D_CASTLE && pl.p.x > CX + 6 && Math.hypot(pl.p.x - (TV.x + .5), pl.p.z - TV.z) < 10 && Math.abs(pl.p.y - KH - 1) < 2) return 'tv';
  if (dim > D_CASTLE) return '';
  const px0 = Math.floor(pl.p.x), pz0 = Math.floor(pl.p.z), py0 = Math.floor(pl.p.y);
  let bed = false, sign = false;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 1; dy++) {
    const base = furnCell[dim].get(I(px0 + dx, py0 + dy, pz0 + dz));
    if (base === undefined) continue;
    const r = furn[dim].get(base);
    if (r && r.type === 'sign') sign = true;
    if (r && r.type === 'bed') bed = true;
  }
  if (sign) return 'sign';
  if (bed && sky.night && sky.dark > 0.35) return 'sleep';
  return '';
}
let actT = 0;
function updateExtras(dt) {
  tvGroup.visible = dim === D_CASTLE;
  updateTvVideo(dt);
  const near = dim === D_CASTLE && Math.hypot(pl.p.x - TV.x, pl.p.z - TV.z) < 40;
  if (near || !$('tvPanel').hidden) { cartoon.acc += dt; if (cartoon.acc > 1 / 12) { drawCartoon(cartoon.acc); cartoon.acc = 0; } }
  actT -= dt;
  if (actT > 0) return;
  actT = 0.2;
  const k = nearbyAction();
  if (k === actKind) return;
  actKind = k;
  actBtn.hidden = !k;
  const key = document.body.classList.contains('touch') ? '' : ' (F)';
  actBtn.textContent = k === 'sign' ? 'Прочитати табличку' + key : k === 'sleep' ? 'Лягти спати' + key : k === 'tv' ? 'Дивитися мультики' + key : '';
}
function doAction() {
  if (actKind === 'sign') openSign();
  else if (actKind === 'sleep') goToSleep();
  else if (actKind === 'tv') openTv();
  actKind = ''; actBtn.hidden = true; actT = 0.6;
}
actBtn.addEventListener('click', doAction);
addEventListener('keydown', e => { if (e.code === 'KeyF' && !e.repeat && !actBtn.hidden) doAction(); });

// ---------- a YouTube cartoon playing on the TV in the room ----------
const tvVideo = { id: '', obj: null, frame: null, paused: false, volT: 0, vol: -1 };
// what the castle TV shows for everyone in the room, and when it started (local clock)
const tvShared = { id: '', startedAt: 0 };
const tvElapsed = () => Math.max(0, (performance.now() - tvShared.startedAt) / 1000);
function shareTv(id) { tvShared.id = id; tvShared.startedAt = performance.now(); netSend({ t: 'tv', tv: id, el: 0 }); }
function ensureCss() {
  if (cssRenderer || !THREE.CSS3DRenderer) return;
  cssRenderer = new THREE.CSS3DRenderer();
  cssRenderer.domElement.className = 'css3d';
  cssRenderer.setSize(innerWidth, innerHeight);
  document.body.insertBefore(cssRenderer.domElement, canvas);
}
function ytCmd(func, args = []) {
  try { if (tvVideo.frame && tvVideo.frame.contentWindow) tvVideo.frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) {}
}
function startTvVideo(id, from = 0) {
  ensureCss();
  if (!cssRenderer) { toast('Не вдалося ввімкнути відео на телевізорі', 2000); return; }
  stopTvVideo();
  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:960px;height:544px;background:#000';
  const f = document.createElement('iframe');
  f.src = window.__TV_SRC || `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3&start=${Math.floor(from)}`;
  f.allow = 'autoplay; encrypted-media';
  f.title = 'Мультик на телевізорі';
  f.style.cssText = 'width:100%;height:100%;border:0';
  wrap.appendChild(f);
  const obj = new THREE.CSS3DObject(wrap);
  obj.position.set(TV.x + .5, TV.y + TV.h / 2, TV.z + 0.17);
  obj.scale.setScalar(TV.w / 960);
  cssScene.add(obj);
  tvScreenMesh.material = holeMat;
  Object.assign(tvVideo, { id, obj, frame: f, paused: false, vol: -1 });
  $('tvBar').hidden = false;
  $('tvPause').textContent = 'Пауза';
}
function stopTvVideo() {
  if (tvVideo.obj) { cssScene.remove(tvVideo.obj); tvVideo.obj.element.remove(); }
  Object.assign(tvVideo, { id: '', obj: null, frame: null });
  if (tvScreenMesh) tvScreenMesh.material = cartoonMat;
  $('tvBar').hidden = true;
}
function updateTvVideo(dt) {
  // walking into the castle picks up whatever the room is watching
  if (dim === D_CASTLE && tvShared.id && tvVideo.id !== tvShared.id && ytAllowed()) startTvVideo(tvShared.id, tvElapsed());
  if (!tvVideo.id) return;
  if (dim !== D_CASTLE) { stopTvVideo(); return; }
  const d = Math.hypot(pl.p.x - (TV.x + .5), pl.p.z - TV.z);
  $('tvBar').hidden = d > 30;
  // the sound fades as Angelina walks away from the TV
  tvVideo.volT -= dt;
  if (tvVideo.volT <= 0) {
    tvVideo.volT = 0.5;
    const v = Math.round(clamp(1 - (d - 6) / 26, 0, 1) * 100);
    if (v !== tvVideo.vol) { tvVideo.vol = v; ytCmd('setVolume', [v]); if (v === 0) ytCmd('mute'); else ytCmd('unMute'); }
  }
}
function renderCss() {
  if (!cssRenderer || !tvVideo.obj) return;
  tvVideo.obj.visible = dim === D_CASTLE && !wardrobeOpen;
  cssRenderer.render(cssScene, camera);
}
$('tvPause').addEventListener('click', () => {
  tvVideo.paused = !tvVideo.paused;
  ytCmd(tvVideo.paused ? 'pauseVideo' : 'playVideo');
  $('tvPause').textContent = tvVideo.paused ? 'Грати' : 'Пауза';
});
$('tvStop').addEventListener('click', () => { stopTvVideo(); shareTv(''); toast('Телевізор показує наші мультики', 1500); });
function applyTvNet(m, P) {
  const id = typeof m.tv === 'string' && /^[\w-]{11}$/.test(m.tv) ? m.tv : '';
  tvShared.id = id; tvShared.startedAt = performance.now() - clamp(Number(m.el) || 0, 0, 86400) * 1000;
  if (!id) { if (tvVideo.id) { stopTvVideo(); if (P) toast(`${P.name} вимкнула мультик`, 1600); } return; }
  if (dim === D_CASTLE && ytAllowed()) { startTvVideo(id, tvElapsed()); if (P) toast(`${P.name} увімкнула мультик на телевізорі`, 2200); }
}
