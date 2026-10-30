// ---------- Angelina & her wardrobe ----------
const SKIN = '#f3c9a8', HAIR = '#16110f';
const WARDROBE = {
  dress: { title: 'Одяг', items: [
    { id: 'pink', name: 'Рожева сукня', sw: '#ff6fae', top: '#ff6fae', skirt: '#ff4f9a', legs: '#4a3a7a', sleeve: '#ff6fae', heart: true },
    { id: 'blue', name: 'Блакитна сукня', sw: '#6fb7ff', top: '#8cc8ff', skirt: '#3d8fe0', legs: '#ffffff', sleeve: '#8cc8ff' },
    { id: 'tee', name: 'Футболка й джинси', sw: '#ffd23f', top: '#ffd23f', legs: '#3a5fa8', sleeve: '#ffd23f', star: true },
    { id: 'overalls', name: 'Комбінезон', sw: '#9a7bff', top: '#ffffff', legs: '#9a7bff', sleeve: '#ffffff', bib: '#9a7bff' },
    { id: 'princess', name: 'Сукня принцеси', sw: '#c9a8ff', top: '#d9c2ff', skirt: '#b388ff', legs: '#b388ff', sleeve: '#efe4ff', long: true, trim: '#f4c23f' },
    { id: 'winter', name: 'Зимова куртка', sw: '#e8333a', top: '#e8333a', legs: '#2b2140', sleeve: '#e8333a', jacket: true, trim: '#ffffff' },
    { id: 'sport', name: 'Спортивний костюм', sw: '#3bb54a', top: '#3bb54a', legs: '#3bb54a', sleeve: '#3bb54a', stripes: '#ffffff' },
  ] },
  shoes: { title: 'Взуття', items: [
    { id: 'white', name: 'Білі кросівки', sw: '#ffffff', c: '#ffffff' },
    { id: 'pink', name: 'Рожеві', sw: '#ff6fae', c: '#ff6fae' },
    { id: 'red', name: 'Червоні', sw: '#e8333a', c: '#e8333a' },
    { id: 'boots', name: 'Чобітки', sw: '#7a5230', c: '#7a5230', tall: true },
    { id: 'gold', name: 'Золоті', sw: '#f4c23f', c: '#f4c23f' },
  ] },
  hat: { title: 'На голову', items: [
    { id: 'bow', name: 'Бантик' }, { id: 'none', name: 'Нічого' }, { id: 'hat', name: 'Капелюшок' },
    { id: 'beanie', name: 'Шапка з помпоном' }, { id: 'bunny', name: 'Вушка зайчика' }, { id: 'cat', name: 'Котячі вушка' }, { id: 'flowers', name: 'Віночок' },
  ] },
  hairColor: { title: 'Колір волосся', items: [
    { id: 'black', name: 'Чорне', sw: '#16110f', c: '#16110f' }, { id: 'brown', name: 'Каштанове', sw: '#5a3820', c: '#5a3820' },
    { id: 'blonde', name: 'Світле', sw: '#e8c46a', c: '#e8c46a' }, { id: 'red', name: 'Руде', sw: '#b5482a', c: '#b5482a' },
  ] },
  hair: { title: 'Зачіска', items: [
    { id: 'long', name: 'Довге волосся' }, { id: 'pigtails', name: 'Хвостики' }, { id: 'bun', name: 'Гулька' }, { id: 'braid', name: 'Коса' },
  ] },
  glasses: { title: 'Окуляри', items: [
    { id: 'none', name: 'Без окулярів' }, { id: 'hearts', name: 'Сердечка', sw: '#ff4f9a' }, { id: 'star', name: 'Зірочки', sw: '#ffd23f' }, { id: 'round', name: 'Круглі', sw: '#2b2140' },
  ] },
};
let outfit = { dress: 'pink', shoes: 'white', hat: 'bow', hair: 'long', hairColor: 'black', glasses: 'none' };
const pick = (cat) => WARDROBE[cat].items.find(i => i.id === outfit[cat]) || WARDROBE[cat].items[0];

const girl = new THREE.Group();
scene.add(girl);
let body = null, legs = [], arms = [], eyes = [], crown = null, blaster = null;
let nameTag = null;
function setNameTag(name) {
  if (nameTag) girl.remove(nameTag);
  nameTag = textSprite(name, 1.15);
  nameTag.position.y = 2.15;
  girl.add(nameTag);
}
setNameTag('Ангеліна');

// builds any girl in any outfit: Angelina herself and friends who join the room
function buildAvatar(o, d) {
  const body = new THREE.Group();
  const pk = cat => WARDROBE[cat].items.find(i => i.id === o[cat]) || WARDROBE[cat].items[0];
  const D = pk('dress'), S = pk('shoes'), hat = o.hat, hair = o.hair, gl = o.glasses, HAIR = pk('hairColor').c;
  let legs, arms, eyes, crown, blaster;
  legs = [-0.12, 0.12].map(x => {
    const p = pivot(x, 0.55, 0, body);
    box(0.2, 0.45, 0.22, D.legs, 0, -0.225, 0, p);
    if (S.tall) box(0.23, 0.26, 0.26, S.c, 0, -0.42, 0.02, p);
    else box(0.22, 0.1, 0.28, S.c, 0, -0.5, 0.03, p);
    return p;
  });
  if (D.long) {
    box(0.68, 0.56, 0.48, D.skirt, 0, 0.44, 0, body);
    box(0.7, 0.06, 0.5, D.trim, 0, 0.18, 0, body);
    box(0.52, 0.05, 0.32, D.trim, 0, 0.74, 0, body);
  } else if (D.skirt) box(0.6, 0.24, 0.4, D.skirt, 0, 0.62, 0, body);
  else box(0.5, 0.16, 0.3, D.legs, 0, 0.6, 0, body);
  box(0.5, 0.42, 0.3, D.top, 0, 0.92, 0, body);
  if (D.heart) box(0.1, 0.08, 0.02, '#ffffff', 0, 0.96, 0.155, body);
  if (D.star) { box(0.12, 0.04, 0.02, '#ff8a1f', 0, 0.96, 0.155, body); box(0.04, 0.12, 0.02, '#ff8a1f', 0, 0.96, 0.155, body); }
  if (D.bib) { box(0.34, 0.26, 0.02, D.bib, 0, 0.84, 0.155, body); box(0.06, 0.18, 0.02, D.bib, -0.14, 1.04, 0.155, body); box(0.06, 0.18, 0.02, D.bib, 0.14, 1.04, 0.155, body); }
  if (D.jacket) { box(0.03, 0.42, 0.02, D.trim, 0, 0.92, 0.155, body); box(0.54, 0.07, 0.34, D.trim, 0, 1.12, 0, body); }
  if (D.stripes) { box(0.02, 0.42, 0.04, D.stripes, -0.25, 0.92, 0, body); box(0.02, 0.42, 0.04, D.stripes, 0.25, 0.92, 0, body); }
  arms = [-0.33, 0.33].map(x => {
    const p = pivot(x, 1.1, 0, body);
    box(0.17, 0.16, 0.2, D.sleeve, 0, -0.06, 0, p);
    if (D.jacket || D.id === 'sport') { box(0.15, 0.32, 0.17, D.sleeve, 0, -0.26, 0, p); box(0.14, 0.1, 0.16, SKIN, 0, -0.46, 0, p); }
    else box(0.14, 0.4, 0.16, SKIN, 0, -0.3, 0, p);
    return p;
  });
  // head & face
  box(0.52, 0.5, 0.48, SKIN, 0, 1.38, 0, body);
  eyes = [-0.12, 0.12].map(x => {
    const e = box(0.08, 0.11, 0.02, '#1d1630', x, 1.37, 0.245, body);
    box(0.03, 0.03, 0.01, '#ffffff', x + 0.02, 1.4, 0.257, body);
    return e;
  });
  box(0.07, 0.04, 0.02, '#ff9db4', -0.19, 1.28, 0.245, body);
  box(0.07, 0.04, 0.02, '#ff9db4', 0.19, 1.28, 0.245, body);
  box(0.1, 0.03, 0.02, '#c4486a', 0, 1.24, 0.245, body);
  // hair: black for Angelina unless she picks another colour
  box(0.58, 0.12, 0.54, HAIR, 0, 1.66, 0, body);
  box(0.58, 0.56, 0.1, HAIR, 0, 1.38, -0.25, body);
  box(0.07, 0.4, 0.5, HAIR, -0.285, 1.44, -0.01, body);
  box(0.07, 0.4, 0.5, HAIR, 0.285, 1.44, -0.01, body);
  box(0.58, 0.14, 0.07, HAIR, 0, 1.56, 0.245, body);
  if (hair === 'long') box(0.54, 0.42, 0.1, HAIR, 0, 0.98, -0.22, body);
  if (hair === 'pigtails') [-1, 1].forEach(s => { box(0.08, 0.08, 0.08, '#ff6fae', s * 0.33, 1.5, -0.1, body); box(0.15, 0.42, 0.15, HAIR, s * 0.36, 1.24, -0.12, body); });
  if (hair === 'bun') { box(0.26, 0.24, 0.24, HAIR, 0, 1.8, -0.14, body); box(0.28, 0.05, 0.05, '#ff6fae', 0, 1.7, -0.02, body); }
  if (hair === 'braid') { [[0.14, 1.12], [0.12, 0.96], [0.1, 0.82]].forEach(([w, y]) => box(w, 0.16, w, HAIR, 0, y, -0.29, body)); box(0.12, 0.05, 0.12, '#ff6fae', 0, 0.73, -0.29, body); }
  // headwear; in the kingdom the crown takes its place
  const inKingdom = d === D_CASTLE;
  crown = new THREE.Group(); body.add(crown);
  box(0.4, 0.08, 0.4, '#f4c23f', 0, 1.77, 0, crown);
  [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16], [0, 0.17], [0, -0.17]].forEach(([x, z]) => box(0.07, 0.1, 0.07, '#f4c23f', x, 1.86, z, crown));
  box(0.08, 0.08, 0.03, '#ff4f9a', 0, 1.78, 0.21, crown);
  crown.visible = inKingdom;
  if (!inKingdom) {
    if (hat === 'bow') { box(0.14, 0.12, 0.06, '#ff6fae', 0.1, 1.75, 0.05, body); box(0.14, 0.12, 0.06, '#ff6fae', 0.3, 1.75, 0.05, body); box(0.08, 0.08, 0.08, '#ff4f9a', 0.2, 1.75, 0.05, body); }
    if (hat === 'hat') { box(0.82, 0.04, 0.82, '#f6e3a1', 0, 1.73, 0, body); box(0.5, 0.2, 0.5, '#f6e3a1', 0, 1.84, 0, body); box(0.52, 0.06, 0.52, '#ff6fae', 0, 1.77, 0, body); }
    if (hat === 'beanie') { box(0.62, 0.22, 0.58, '#6fb7ff', 0, 1.7, 0, body); box(0.64, 0.06, 0.6, '#ffffff', 0, 1.61, 0, body); box(0.16, 0.16, 0.16, '#ffffff', 0, 1.88, 0, body); }
    if (hat === 'bunny') [-0.14, 0.14].forEach(x => { box(0.1, 0.34, 0.06, '#ffffff', x, 1.88, 0, body); box(0.05, 0.24, 0.01, '#ffb6c8', x, 1.87, 0.035, body); });
    if (hat === 'cat') [-0.18, 0.18].forEach(x => { box(0.14, 0.14, 0.06, HAIR, x, 1.78, 0.02, body); box(0.07, 0.08, 0.01, '#ff9db4', x, 1.77, 0.055, body); });
    if (hat === 'flowers') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; box(0.1, 0.08, 0.1, ['#ff4040', '#ffd23f', '#ffffff', '#4a7bff'][i % 4], Math.sin(a) * 0.28, 1.72, Math.cos(a) * 0.26, body); }
  }
  if (gl !== 'none') {
    const c = gl === 'hearts' ? '#ff4f9a' : gl === 'star' ? '#ffd23f' : '#2b2140';
    [-0.12, 0.12].forEach(x => {
      if (gl === 'round') { box(0.16, 0.025, 0.02, c, x, 1.44, 0.262, body); box(0.16, 0.025, 0.02, c, x, 1.31, 0.262, body); box(0.025, 0.15, 0.02, c, x - 0.07, 1.375, 0.262, body); box(0.025, 0.15, 0.02, c, x + 0.07, 1.375, 0.262, body); }
      else { box(0.15, 0.1, 0.02, c, x, 1.37, 0.262, body); box(0.06, 0.06, 0.02, c, x - 0.04, 1.43, 0.262, body); box(0.06, 0.06, 0.02, c, x + 0.04, 1.43, 0.262, body); }
    });
    box(0.08, 0.02, 0.02, c, 0, 1.4, 0.262, body);
  }
  // candy blaster, only shown in the arena
  blaster = new THREE.Group();
  arms[1].add(blaster);
  box(0.14, 0.14, 0.42, '#ff6fae', 0, -0.48, 0.12, blaster);
  box(0.16, 0.05, 0.3, '#ffffff', 0, -0.4, 0.12, blaster);
  box(0.1, 0.1, 0.1, '#ffd23f', 0, -0.48, 0.36, blaster);
  box(0.06, 0.2, 0.06, '#ffffff', 0, -0.32, 0.02, blaster);
  box(0.16, 0.16, 0.05, '#9a7bff', 0, -0.2, 0.02, blaster);
  blaster.visible = d === D_ARENA;
  return { body, legs, arms, eyes, crown, blaster };
}
function buildGirl() {
  if (body) girl.remove(body);
  ({ body, legs, arms, eyes, crown, blaster } = buildAvatar(outfit, dim));
  girl.add(body);
}

// first-person view-model of the blaster
const fpGun = new THREE.Group();
box(0.12, 0.12, 0.4, '#ff6fae', 0, 0, 0, fpGun);
box(0.13, 0.04, 0.28, '#ffffff', 0, 0.07, 0, fpGun);
box(0.09, 0.09, 0.08, '#ffd23f', 0, 0, -0.22, fpGun);
fpGun.position.set(0.28, -0.26, -0.55);
fpGun.visible = false;
camera.add(fpGun);

// ---------- wardrobe panel ----------
const wardrobeEl = document.getElementById('wardrobe'), wardrobeList = document.getElementById('wardrobeList');
let wardrobeOpen = false, preWardrobe = null;
function renderWardrobe() {
  wardrobeList.textContent = '';
  Object.entries(WARDROBE).forEach(([cat, def]) => {
    const sec = document.createElement('section');
    const h = document.createElement('h3'); h.textContent = def.title;
    const chips = document.createElement('div'); chips.className = 'chips';
    def.items.forEach(item => {
      const b = document.createElement('button');
      b.className = 'chip' + (outfit[cat] === item.id ? ' on' : '');
      if (item.sw) { const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = item.sw; b.appendChild(sw); }
      b.append(item.name);
      b.addEventListener('click', () => { outfit[cat] = item.id; buildGirl(); renderWardrobe(); scheduleSave(); sfx.click(); netSend({ t: 'outfit', o: outfit }); });
      chips.appendChild(b);
    });
    sec.append(h, chips);
    wardrobeList.appendChild(sec);
  });
}
function openWardrobe() {
  if (wardrobeOpen) return;
  wardrobeOpen = true;
  preWardrobe = { yaw, pitch, dist };
  yaw = pl.facing; pitch = 0.12; dist = innerWidth <= 640 ? 5.4 : 3.6;
  renderWardrobe();
  wardrobeEl.hidden = false;
  playing = false;
  if (document.pointerLockElement) document.exitPointerLock();
}
function closeWardrobe() {
  if (!wardrobeOpen) return;
  wardrobeOpen = false;
  wardrobeEl.hidden = true;
  ({ yaw, pitch, dist } = preWardrobe);
  playing = true;
  canvas.focus({ preventScroll: true });
}
