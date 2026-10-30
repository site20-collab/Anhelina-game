// ---------- animals ----------
function legSet(g, spots, w, h, col, y = h) {
  return spots.map(([x, z]) => { const p = pivot(x, y, z, g); box(w, h, w, col, 0, -h / 2, 0, p); return p; });
}
function eyePair(g, y, z, dx, size = 0.05, col = '#1a1a1a') {
  box(size, size * 1.2, 0.02, col, -dx, y, z, g); box(size, size * 1.2, 0.02, col, dx, y, z, g);
}
function buildCat(m) {
  const g = new THREE.Group();
  const [C, C2] = [['#f2a541', '#e08a22'], ['#9a9aa6', '#7c7c88'], ['#2e2a2f', '#f4f4f4']][m.id % 3];
  box(0.32, 0.3, 0.62, C, 0, 0.38, 0, g);
  box(0.34, 0.3, 0.3, C, 0, 0.58, 0.36, g);
  box(0.08, 0.1, 0.06, C, -0.1, 0.77, 0.36, g); box(0.08, 0.1, 0.06, C, 0.1, 0.77, 0.36, g);
  eyePair(g, 0.61, 0.515, 0.08, 0.06, '#3bb54a');
  box(0.06, 0.04, 0.02, '#ff8fa8', 0, 0.54, 0.515, g);
  box(0.07, 0.07, 0.4, C2, 0, 0.56, -0.44, g).rotation.x = -0.6;
  return { g, legs: legSet(g, [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]], 0.09, 0.23, C2) };
}
function buildBunny(m) {
  const g = new THREE.Group();
  const C = m.id % 2 ? '#f7f3ee' : '#b08060';
  box(0.3, 0.28, 0.4, C, 0, 0.26, 0, g);
  box(0.26, 0.24, 0.24, C, 0, 0.44, 0.2, g);
  [-0.07, 0.07].forEach(x => { box(0.06, 0.26, 0.04, C, x, 0.68, 0.18, g); box(0.03, 0.18, 0.01, '#ffb6c8', x, 0.68, 0.205, g); });
  eyePair(g, 0.47, 0.325, 0.08, 0.04);
  box(0.05, 0.04, 0.02, '#ff8fa8', 0, 0.41, 0.325, g);
  box(0.12, 0.12, 0.08, '#ffffff', 0, 0.3, -0.22, g);
  return { g, legs: legSet(g, [[-0.09, 0.12], [0.09, 0.12], [-0.09, -0.12], [0.09, -0.12]], 0.09, 0.12, C) };
}
function buildPenguin() {
  const g = new THREE.Group();
  const K = '#222831', O = '#ff9f1c';
  box(0.4, 0.6, 0.34, K, 0, 0.42, 0, g);
  box(0.3, 0.45, 0.02, '#f5f5f5', 0, 0.38, 0.175, g);
  box(0.34, 0.28, 0.3, K, 0, 0.86, 0, g);
  eyePair(g, 0.9, 0.155, 0.08, 0.07, '#ffffff');
  eyePair(g, 0.9, 0.167, 0.07, 0.035, '#000000');
  box(0.1, 0.06, 0.12, O, 0, 0.82, 0.2, g);
  const arms = [-0.23, 0.23].map(x => { const p = pivot(x, 0.66, 0, g); box(0.06, 0.34, 0.2, K, 0, -0.17, 0, p); return p; });
  const legs = [-0.1, 0.1].map(x => { const p = pivot(x, 0.12, 0, g); box(0.12, 0.12, 0.18, O, 0, -0.06, 0.04, p); return p; });
  return { g, legs, arms, waddle: true };
}
function buildTurtle() {
  const g = new THREE.Group();
  const S = '#8bc34a';
  box(0.6, 0.25, 0.7, '#3e8e41', 0, 0.32, 0, g);
  box(0.46, 0.1, 0.56, '#2f6f33', 0, 0.49, 0, g);
  box(0.56, 0.08, 0.66, '#d9c27c', 0, 0.18, 0, g);
  box(0.2, 0.18, 0.22, S, 0, 0.3, 0.44, g);
  eyePair(g, 0.34, 0.555, 0.06, 0.04);
  return { g, legs: legSet(g, [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]], 0.14, 0.2, S) };
}
function buildUnicorn() {
  const g = new THREE.Group();
  const W = '#fdf7ff', MANE = ['#ff6fae', '#b388ff', '#7cc8ff', '#ffd23f', '#7be0a0'];
  box(0.45, 0.42, 0.9, W, 0, 0.85, 0, g);
  box(0.24, 0.44, 0.26, W, 0, 1.16, 0.4, g).rotation.x = 0.35;
  box(0.28, 0.28, 0.46, W, 0, 1.4, 0.58, g);
  box(0.06, 0.28, 0.06, '#ffd23f', 0, 1.66, 0.64, g);
  box(0.05, 0.07, 0.02, '#3a2f5c', -0.145, 1.44, 0.68, g); box(0.05, 0.07, 0.02, '#3a2f5c', 0.145, 1.44, 0.68, g);
  box(0.12, 0.06, 0.02, '#ffb6d9', 0, 1.33, 0.815, g);
  MANE.forEach((c, i) => box(0.1, 0.13, 0.12, c, 0, 1.56 - i * 0.12, 0.42 - i * 0.07, g));
  MANE.forEach((c, i) => box(0.11, 0.12, 0.11, c, 0, 0.98 - i * 0.11, -0.5 - i * 0.04, g));
  const legs = [[-0.15, 0.32], [0.15, 0.32], [-0.15, -0.32], [0.15, -0.32]].map(([x, z]) => {
    const p = pivot(x, 0.66, z, g);
    box(0.13, 0.58, 0.13, W, 0, -0.29, 0, p);
    box(0.14, 0.08, 0.14, '#c9a8ff', 0, -0.62, 0, p);
    return p;
  });
  return { g, legs };
}
function buildSheep(m) {
  const g = new THREE.Group();
  const wool = m.id % 4 === 3 ? '#fbd3e6' : '#f4f1ea', face = '#4a4448';
  box(0.5, 0.42, 0.7, wool, 0, 0.52, 0, g);
  box(0.54, 0.1, 0.6, wool, 0, 0.76, 0, g);
  box(0.26, 0.28, 0.26, face, 0, 0.64, 0.44, g);
  box(0.3, 0.1, 0.2, wool, 0, 0.8, 0.4, g);
  box(0.1, 0.05, 0.08, face, -0.18, 0.66, 0.42, g); box(0.1, 0.05, 0.08, face, 0.18, 0.66, 0.42, g);
  eyePair(g, 0.67, 0.575, 0.07, 0.05, '#ffffff');
  eyePair(g, 0.67, 0.585, 0.07, 0.025, '#111111');
  return { g, legs: legSet(g, [[-0.15, 0.22], [0.15, 0.22], [-0.15, -0.22], [0.15, -0.22]], 0.1, 0.32, face) };
}
function buildPiglet() {
  const g = new THREE.Group();
  const P = '#ffb6c8', P2 = '#ff8fa8';
  box(0.42, 0.34, 0.6, P, 0, 0.36, 0, g);
  box(0.32, 0.3, 0.28, P, 0, 0.45, 0.38, g);
  box(0.16, 0.1, 0.04, P2, 0, 0.41, 0.54, g);
  box(0.03, 0.04, 0.01, '#8a4a5a', -0.035, 0.41, 0.562, g); box(0.03, 0.04, 0.01, '#8a4a5a', 0.035, 0.41, 0.562, g);
  eyePair(g, 0.52, 0.525, 0.08, 0.04);
  box(0.08, 0.08, 0.04, P2, -0.12, 0.63, 0.36, g); box(0.08, 0.08, 0.04, P2, 0.12, 0.63, 0.36, g);
  box(0.05, 0.05, 0.1, P2, 0, 0.46, -0.33, g);
  return { g, legs: legSet(g, [[-0.12, 0.18], [0.12, 0.18], [-0.12, -0.18], [0.12, -0.18]], 0.1, 0.19, P) };
}
function buildFox(m) {
  const g = new THREE.Group();
  const arctic = m.variant === 'arctic', C = arctic ? '#f4f4f8' : '#f08a30', T = arctic ? '#dfe6f0' : '#ffffff', D = arctic ? '#9aa4b4' : '#2b2140';
  box(0.3, 0.28, 0.6, C, 0, 0.4, 0, g);
  box(0.3, 0.26, 0.28, C, 0, 0.54, 0.38, g);
  box(0.12, 0.1, 0.14, T, 0, 0.48, 0.56, g);
  box(0.04, 0.04, 0.02, '#111111', 0, 0.5, 0.635, g);
  [-0.1, 0.1].forEach(x => { box(0.09, 0.13, 0.05, C, x, 0.72, 0.36, g); box(0.09, 0.04, 0.05, D, x, 0.79, 0.36, g); });
  eyePair(g, 0.58, 0.525, 0.08, 0.04);
  box(0.16, 0.16, 0.42, C, 0, 0.48, -0.48, g).rotation.x = -0.4;
  box(0.17, 0.17, 0.12, T, 0, 0.62, -0.69, g).rotation.x = -0.4;
  return { g, legs: legSet(g, [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]], 0.08, 0.26, D) };
}
function buildHedgehog() {
  const g = new THREE.Group();
  box(0.36, 0.26, 0.42, '#7a5a3a', 0, 0.2, 0, g);
  for (let i = 0; i < 9; i++) box(0.08, 0.1, 0.08, '#5a3e26', ((i % 3) - 1) * 0.12, 0.36, (Math.floor(i / 3) - 1) * 0.13 - 0.02, g);
  box(0.2, 0.16, 0.14, '#e8c9a0', 0, 0.18, 0.26, g);
  box(0.05, 0.05, 0.04, '#111111', 0, 0.17, 0.345, g);
  eyePair(g, 0.23, 0.332, 0.05, 0.035);
  return { g, legs: legSet(g, [[-0.1, 0.12], [0.1, 0.12], [-0.1, -0.12], [0.1, -0.12]], 0.07, 0.08, '#5a3e26') };
}
function buildBear(m) {
  const g = new THREE.Group();
  const polar = m.variant === 'polar', C = polar ? '#f6f6f8' : '#8b5a2b', L = polar ? '#e4e8ee' : '#c9955e';
  box(0.5, 0.45, 0.66, C, 0, 0.52, 0, g);
  box(0.42, 0.38, 0.36, C, 0, 0.84, 0.4, g);
  box(0.2, 0.14, 0.1, L, 0, 0.77, 0.6, g);
  box(0.07, 0.05, 0.02, '#1a1a1a', 0, 0.8, 0.655, g);
  [-0.16, 0.16].forEach(x => { box(0.12, 0.12, 0.08, C, x, 1.06, 0.38, g); box(0.06, 0.06, 0.01, L, x, 1.06, 0.425, g); });
  eyePair(g, 0.9, 0.585, 0.1, 0.05);
  return { g, legs: legSet(g, [[-0.15, 0.2], [0.15, 0.2], [-0.15, -0.2], [0.15, -0.2]], 0.16, 0.3, C) };
}
function buildFlamingo() {
  const g = new THREE.Group();
  const P = '#ff8fb8';
  box(0.3, 0.28, 0.46, P, 0, 0.98, 0, g);
  box(0.06, 0.22, 0.28, '#ff6fa3', -0.17, 1.0, -0.02, g); box(0.06, 0.22, 0.28, '#ff6fa3', 0.17, 1.0, -0.02, g);
  box(0.08, 0.44, 0.08, P, 0, 1.3, 0.2, g);
  box(0.15, 0.15, 0.2, P, 0, 1.55, 0.26, g);
  box(0.07, 0.07, 0.14, '#ffffff', 0, 1.52, 0.42, g);
  box(0.07, 0.07, 0.06, '#1a1a1a', 0, 1.5, 0.51, g);
  eyePair(g, 1.58, 0.365, 0.05, 0.03);
  const legs = [-0.07, 0.07].map(x => { const p = pivot(x, 0.84, 0, g); box(0.04, 0.82, 0.04, '#e86a9a', 0, -0.41, 0, p); box(0.1, 0.03, 0.12, '#e86a9a', 0, -0.82, 0.03, p); return p; });
  return { g, legs };
}
function buildPuppy(m) {
  const g = new THREE.Group();
  const [C, E, S] = [['#f4e3c8', '#b07a4a', '#ffffff'], ['#f7f7f7', '#2b2630', '#ffffff'], ['#c9955e', '#7a5230', '#f4e3c8']][m.id % 3];
  box(0.3, 0.28, 0.5, C, 0, 0.34, 0, g);
  if (m.id % 3 === 1) { box(0.1, 0.02, 0.1, E, 0.08, 0.485, 0.05, g); box(0.08, 0.02, 0.08, E, -0.06, 0.485, -0.12, g); }
  box(0.3, 0.28, 0.28, C, 0, 0.52, 0.32, g);
  box(0.16, 0.12, 0.12, S, 0, 0.45, 0.5, g);
  box(0.06, 0.05, 0.03, '#1a1a1a', 0, 0.49, 0.565, g);
  box(0.05, 0.06, 0.02, '#ff8fa8', 0, 0.39, 0.56, g);
  box(0.08, 0.22, 0.12, E, -0.18, 0.5, 0.3, g); box(0.08, 0.22, 0.12, E, 0.18, 0.5, 0.3, g);
  eyePair(g, 0.56, 0.465, 0.08, 0.05);
  box(0.06, 0.06, 0.24, C, 0, 0.5, -0.32, g).rotation.x = -0.8;
  return { g, legs: legSet(g, [[-0.09, 0.16], [0.09, 0.16], [-0.09, -0.16], [0.09, -0.16]], 0.08, 0.2, C) };
}
function buildPony(m) {
  const g = new THREE.Group(), b = new THREE.Group();
  g.add(b);
  const [W, MANE] = [['#f7d6e8', ['#ff6fae', '#c9a8ff']], ['#c9e6ff', ['#3d7be0', '#ffffff']], ['#fff2b3', ['#ff8a1f', '#ffd23f']], ['#d9c2ff', ['#9a7bff', '#ff9fd2']]][m.id % 4];
  box(0.45, 0.42, 0.85, W, 0, 0.85, 0, b);
  box(0.24, 0.44, 0.26, W, 0, 1.16, 0.38, b).rotation.x = 0.35;
  box(0.28, 0.28, 0.44, W, 0, 1.38, 0.56, b);
  box(0.05, 0.07, 0.02, '#3a2f5c', -0.145, 1.42, 0.66, b); box(0.05, 0.07, 0.02, '#3a2f5c', 0.145, 1.42, 0.66, b);
  box(0.06, 0.1, 0.06, W, -0.08, 1.56, 0.44, b); box(0.06, 0.1, 0.06, W, 0.08, 1.56, 0.44, b);
  for (let i = 0; i < 5; i++) box(0.1, 0.13, 0.12, MANE[i % 2], 0, 1.52 - i * 0.12, 0.4 - i * 0.07, b);
  for (let i = 0; i < 4; i++) box(0.11, 0.12, 0.11, MANE[i % 2], 0, 0.96 - i * 0.11, -0.47 - i * 0.04, b);
  const legs = [[-0.15, 0.3], [0.15, 0.3], [-0.15, -0.3], [0.15, -0.3]].map(([x, z]) => {
    const p = pivot(x, 0.66, z, b);
    box(0.13, 0.58, 0.13, W, 0, -0.29, 0, p);
    box(0.14, 0.08, 0.14, '#7a5230', 0, -0.62, 0, p);
    return p;
  });
  b.scale.setScalar(0.8);
  return { g, legs };
}
const VILLAGER_NAMES = ['Оксанка', 'Марічка', 'Тарасик', 'Петрик', 'Соломійка', 'Іванко', 'Дарка', 'Остапчик', 'Христинка', 'Богданчик', 'Зеня', 'Лукаш'];
const VILLAGER_SAY = ['Привіт, Ангеліно!', 'Гарна сьогодні погода!', 'Заходь у гості!', 'Ти бачила мого котика?', 'У нас найсмачніші пиріжки!', 'Тут поруч є сердечко!', 'Дякую, що завітала!'];
function buildVillager(m) {
  const g = new THREE.Group();
  const o = {};
  Object.keys(WARDROBE).forEach((cat, k) => { const items = WARDROBE[cat].items; o[cat] = items[Math.floor(hash(m.id, k, 901) * items.length)].id; });
  if (o.hat === 'bunny' || o.hat === 'cat') o.hat = 'none';
  const parts = buildAvatar(o, D_MAIN);
  parts.blaster.visible = false;
  g.add(parts.body);
  parts.body.scale.setScalar(0.95 + hash(m.id, 9, 902) * 0.2);
  return { g, legs: parts.legs, arms: [] };
}
const DUCK_BREEDS = [
  { id: 'mallard', name: 'крижень', body: '#a0826d', head: '#2e7d4f', collar: '#ffffff', beak: '#f2c94c', baby: '#e6c25a' },
  { id: 'pekin', name: 'біла пекінська', body: '#f7f4ec', head: '#f7f4ec', beak: '#ff9f1c', baby: '#ffe066' },
  { id: 'mandarin', name: 'мандаринка', body: '#c9763a', head: '#6a4a8c', cheek: '#ff9f40', stripe: '#ffffff', beak: '#e8333a', baby: '#d9b26a' },
  { id: 'cayuga', name: 'чорна каюга', body: '#1f2a24', head: '#1d3b2a', beak: '#2b2b2b', baby: '#4a4a46' },
  { id: 'runner', name: 'індійський бігун', body: '#c8a27a', head: '#a0784f', beak: '#7a9a3a', tall: true, baby: '#f0d890' },
];
function buildDuck(m, baby) {
  const g = new THREE.Group(), b = new THREE.Group();
  g.add(b);
  const br = m.breed || DUCK_BREEDS[1];
  const BODY = baby ? br.baby : br.body, HEAD = baby ? br.baby : br.head, BEAK = baby ? '#ff9f1c' : br.beak, O = '#ff9f1c';
  let arms, legs;
  if (br.tall && !baby) {
    box(0.26, 0.6, 0.3, BODY, 0, 0.6, 0, b);
    box(0.2, 0.22, 0.22, HEAD, 0, 1.0, 0.06, b);
    box(0.1, 0.05, 0.16, BEAK, 0, 0.96, 0.24, b);
    eyePair(b, 1.03, 0.175, 0.07, 0.04);
    arms = [-0.15, 0.15].map(x => { const p = pivot(x, 0.82, 0, b); box(0.04, 0.32, 0.18, BODY, 0, -0.16, 0, p); return p; });
    legs = [-0.07, 0.07].map(x => { const p = pivot(x, 0.3, 0, b); box(0.05, 0.28, 0.05, O, 0, -0.14, 0, p); box(0.1, 0.03, 0.12, O, 0, -0.29, 0.04, p); return p; });
  } else {
    box(0.34, 0.26, 0.46, BODY, 0, 0.3, 0, b);
    box(0.2, 0.22, 0.2, HEAD, 0, 0.56, 0.2, b);
    box(0.12, 0.05, 0.14, BEAK, 0, 0.52, 0.36, b);
    eyePair(b, 0.6, 0.305, 0.07, 0.04);
    box(0.16, 0.1, 0.12, BODY, 0, 0.4, -0.26, b);
    if (!baby && br.collar) box(0.21, 0.04, 0.21, br.collar, 0, 0.46, 0.2, b);
    if (!baby && br.cheek) { box(0.22, 0.1, 0.1, br.cheek, 0, 0.53, 0.2, b); box(0.21, 0.04, 0.12, br.stripe, 0, 0.64, 0.17, b); box(0.06, 0.14, 0.14, br.cheek, -0.16, 0.48, -0.06, b); box(0.06, 0.14, 0.14, br.cheek, 0.16, 0.48, -0.06, b); }
    arms = [-0.18, 0.18].map(x => { const p = pivot(x, 0.42, 0, b); box(0.04, 0.16, 0.3, BODY, 0, -0.08, 0, p); return p; });
    legs = [-0.08, 0.08].map(x => { const p = pivot(x, 0.17, 0, b); box(0.04, 0.14, 0.04, O, 0, -0.07, 0, p); box(0.1, 0.03, 0.12, O, 0, -0.15, 0.04, p); return p; });
  }
  if (baby) b.scale.setScalar(0.55);
  return { g, legs, arms };
}
const MOB_TYPES = {
  cat:      { name: 'Котик',      build: buildCat,     speed: 2.2, hw: 0.22, h: 0.75, say: 'Мур-мур!' },
  bunny:    { name: 'Зайчик',     build: buildBunny,   speed: 2.8, hw: 0.2,  h: 0.6,  say: 'Стриб-стриб!', hop: true },
  penguin:  { name: 'Пінгвін',    build: buildPenguin, speed: 1.4, hw: 0.22, h: 1.0,  say: 'Пі-пі!', swims: true },
  turtle:   { name: 'Черепашка',  build: buildTurtle,  speed: 0.9, hw: 0.3,  h: 0.55, say: 'Повільно, але впевнено!', swims: true },
  unicorn:  { name: 'Єдиноріжка', build: buildUnicorn, speed: 2.6, hw: 0.3,  h: 1.6,  say: 'Іго-го!' },
  sheep:    { name: 'Овечка',     build: buildSheep,   speed: 1.4, hw: 0.26, h: 0.9,  say: 'Бе-е-е!' },
  piglet:   { name: 'Поросятко',  build: buildPiglet,  speed: 1.8, hw: 0.22, h: 0.65, say: 'Рох-рох!' },
  fox:      { name: 'Лисичка',    build: buildFox,     speed: 2.6, hw: 0.2,  h: 0.75, say: 'Фир-фир!' },
  hedgehog: { name: 'Їжачок',     build: buildHedgehog, speed: 1.0, hw: 0.2, h: 0.4,  say: 'Пих-пих!' },
  bear:     { name: 'Ведмежа',    build: buildBear,    speed: 1.6, hw: 0.28, h: 1.1,  say: 'Ур-р-р!' },
  flamingo: { name: 'Фламінго',   build: buildFlamingo, speed: 1.3, hw: 0.2, h: 1.6,  say: 'Ґа-ґа!', swims: true },
  puppy:    { name: 'Цуценя',     build: buildPuppy,   speed: 2.6, hw: 0.2,  h: 0.7,  say: 'Гав-гав!' },
  pony:     { name: 'Поні',       build: buildPony,    speed: 2.2, hw: 0.28, h: 1.3,  say: 'І-го-го!' },
  villager: { name: 'Житель',     build: buildVillager, speed: 1.3, hw: 0.28, h: 1.7, say: '' },
  duck:     { name: 'Качка',      build: m => buildDuck(m, false), speed: 1.6, hw: 0.2, h: 0.6, say: 'Кря-кря!', swims: true },
  duckling: { name: 'Каченя',     build: m => buildDuck(m, true),  speed: 2.4, hw: 0.12, h: 0.35, say: 'Пі-пі-пі!', swims: true },
};
const PET_NAMES = {
  cat: ['Мурка', 'Барсик', 'Рижик', 'Сніжок', 'Пушинка', 'Тигрик'],
  bunny: ['Пухнастик', 'Стрибунець', 'Морквинка', 'Вушко', 'Біляночка', 'Хвостик'],
  penguin: ['Пінгві', 'Льодик', 'Фрачок', 'Ковзанчик'],
  turtle: ['Панцирка', 'Тортилка', 'Повільчик', 'Зелененька'],
  unicorn: ['Веселка', 'Зіронька', 'Мрійка', 'Блискітка'],
  sheep: ['Хмаринка', 'Кучерявка', 'Біляша', 'Пушинка'],
  piglet: ['Хрюша', 'Пятачок', 'Рожевчик', 'Булочка'],
  fox: ['Руденька', 'Хитрунчик', 'Лиска', 'Сніжинка'],
  hedgehog: ['Колючка', 'Ойко', 'Шуршик', 'Яблучко'],
  bear: ['Медок', 'Бурчик', 'Тедді', 'Пломбір'],
  flamingo: ['Фламі', 'Рожевинка', 'Довгоніжка', 'Пір\'ячко'],
  duck: ['Кряка', 'Плюшка', 'Хвилька', 'Пірнайка'],
  duckling: ['Пушок', 'Жовтик', 'Кульбабка', 'Пір\'їнка', 'Крихітка', 'Сонечко'],
  puppy: ['Бім', 'Тузик', 'Ласка', 'Плямка', 'Рекс', 'Булька'],
  pony: ['Зорька', 'Карамелька', 'Іскра', 'Хмаринка'],
  villager: VILLAGER_NAMES,
};
const SPAWN = {
  [MEADOW]: ['cat', 'bunny', 'sheep', 'piglet', 'sheep', 'puppy', 'pony'],
  [FOREST]: ['bunny', 'fox', 'hedgehog', 'bear'],
  [DESERT]: ['turtle', 'flamingo'],
  [SNOWY]: ['penguin', 'penguin', 'fox', 'bear', 'bunny'],
  [CANDYLAND]: ['unicorn', 'unicorn', 'piglet'],
};
const SPAWN_MAX = { cat: 20, bunny: 24, penguin: 18, turtle: 16, unicorn: 18, sheep: 24, piglet: 18, fox: 16, hedgehog: 14, bear: 14, flamingo: 14, puppy: 16, pony: 14 };
let mobs = [], mobGroups = [];
const friends = new Set();
const friendHeartMat = new THREE.MeshLambertMaterial({ color: 0xff6fae, emissive: 0x99204f });
const blobGeo = new THREE.CircleGeometry(0.5, 16), blobMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
function addMob(type, x, z, d = 0, extra = {}) {
  const def = MOB_TYPES[type], id = mobs.length;
  const m = Object.assign({ id, type, def, dim: d, facing: hash(id, 1, 40) * 6.28, dir: 0, timer: 0, walking: false, phase: 0, badge: null,
    nick: PET_NAMES[type][id % PET_NAMES[type].length] }, extra);
  const parts = def.build(m);
  m.g = parts.g; m.legs = parts.legs || []; m.arms = parts.arms || []; m.waddle = !!parts.waddle;
  // a soft round shadow under every animal
  const sh = new THREE.Mesh(blobGeo, blobMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; sh.scale.setScalar(def.hw * 2.6); m.g.add(sh);
  m.g.traverse(o => { o.userData.mobId = id; });
  scene.add(m.g);
  m.e = { p: new THREE.Vector3(x + .5, withDim(d, () => surfaceY(x, z)) + 0.01, z + .5), vel: new THREE.Vector3(), hw: def.hw, h: def.h, onGround: false, blocked: false, jumpV: 7.5, float: true };
  mobs.push(m); mobGroups.push(m.g);
  return m;
}
function mobLabel(m) {
  return m.breed ? `${m.def.name.toLowerCase()} (${m.breed.name})` : m.def.name.toLowerCase();
}
function makeFriendBadge(m) {
  if (m.badge) return;
  m.badge = new THREE.Mesh(heartGeo, friendHeartMat);
  m.badge.scale.setScalar(0.3);
  m.badge.position.y = m.def.h + 0.35 + (m.breed && m.breed.tall && m.type === 'duck' ? 0.5 : 0);
  m.g.add(m.badge);
}
function spawnMobs() {
  mobs.forEach(m => scene.remove(m.g));
  mobs = []; mobGroups = [];
  addMob('cat', CX + 4, CZ + 3);
  addMob('bunny', CX - 5, CZ + 2);
  addMob('sheep', CX + 6, CZ - 6);
  addMob('piglet', CX - 6, CZ - 4);
  addMob('puppy', CX - 3, CZ + 6);
  villages.forEach((v, vi) => { for (let k = 0; k < 5; k++) { const a = k * 1.25 + vi; addMob('villager', Math.round(v.x + Math.cos(a) * 6), Math.round(v.z + Math.sin(a) * 6), 0, { home: v }); } addMob(['puppy', 'cat', 'pony'][vi % 3], v.x + 3, v.z + 7); });
  const count = {};
  let k = 0;
  while (mobs.length < 300 && k < 40000) {
    k++;
    const x = 3 + Math.floor(hash(k, 7, 31) * (SX - 6)), z = 3 + Math.floor(hash(k, 9, 33) * (SZ - 6));
    const bi = biomeMaps[0][x + z * SX], list = SPAWN[bi];
    if (!list) continue;
    const type = list[Math.floor(hash(k, 1, 35) * list.length)];
    if ((count[type] || 0) >= SPAWN_MAX[type]) continue;
    const sy = withDim(0, () => surfaceY(x, z)), below = worlds[0][I(x, sy - 1, z)];
    if (worlds[0][I(x, sy, z)] === WATER || below === LEAVES || below === PINE || below === PINKLEAVES || below === CACTUS) continue;
    if (type === 'flamingo' && below !== SAND) continue;
    if (nearVillage(x, z, 2) || mobs.some(m => Math.abs(m.e.p.x - x) + Math.abs(m.e.p.z - z) < 5)) continue;
    count[type] = (count[type] || 0) + 1;
    addMob(type, x, z, 0, { variant: bi === SNOWY ? (type === 'fox' ? 'arctic' : 'polar') : '' });
  }
  spawnDucks();
  spawnCastleMobs();
  friends.forEach(id => { if (mobs[id]) makeFriendBadge(mobs[id]); });
}
function spawnDucks() {
  const W = worlds[0], families = [];
  let k = 0;
  while (families.length < 16 && k < 40000) {
    k++;
    const x = 4 + Math.floor(hash(k, 2, 51) * (SX - 8)), z = 4 + Math.floor(hash(k, 4, 53) * (SZ - 8));
    if (W[I(x, SEA, z)] !== WATER || W[I(x, SEA - 1, z)] !== WATER) continue;
    let shore = false;
    for (let d = 2; d <= 5 && !shore; d++) shore = OPQ[W[I(x + d, SEA, z)]] || OPQ[W[I(x - d, SEA, z)]] || OPQ[W[I(x, SEA, z + d)]] || OPQ[W[I(x, SEA, z - d)]];
    if (!shore || families.some(f => Math.abs(f[0] - x) + Math.abs(f[1] - z) < 24)) continue;
    families.push([x, z]);
  }
  families.forEach(([x, z], fi) => {
    const breed = DUCK_BREEDS[fi % DUCK_BREEDS.length];
    const mom = addMob('duck', x, z, 0, { breed });
    mom.e.p.y = SEA + 0.4;
    const n = 2 + (fi % 3);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const baby = addMob('duckling', x, z, 0, { breed, mother: mom });
      baby.e.p.set(x + .5 + Math.sin(a) * 0.8, SEA + 0.4, z + .5 + Math.cos(a) * 0.8);
    }
  });
}
function spawnCastleMobs() {
  [[CX - 40, CZ + 70, 'unicorn'], [CX + 42, CZ + 74, 'unicorn'], [CX - 70, CZ - 10, 'unicorn'], [CX + 70, CZ + 6, 'unicorn'], [CX - 60, CZ - 50, 'pony'], [CX + 60, CZ - 52, 'pony'],
   [CX - 50, CZ - 60, 'sheep'], [CX + 52, CZ - 56, 'sheep'], [CX - 8, CZ + 12, 'cat'], [CX + 9, CZ + 16, 'puppy'], [CX - 15, CZ + 22, 'bunny'],
   [CX + 48, CZ + 30, 'flamingo'], [CX - 48, CZ + 28, 'piglet']].forEach(([x, z, t]) => addMob(t, x, z, D_CASTLE));
  addMob('bunny', CX + 4, CZ - 8, D_CASTLE).e.p.y = KH + 1.01;
  const mom = addMob('duck', CX + 39, CZ, D_CASTLE, { breed: DUCK_BREEDS[2] });
  mom.e.p.y = KH + 0.4;
  for (let i = 0; i < 3; i++) { const b = addMob('duckling', CX + 39, CZ, D_CASTLE, { breed: DUCK_BREEDS[2], mother: mom }); b.e.p.set(CX + 39.5, KH + 0.4, CZ + 1 + i * 0.6); }
}
function bringToPlayer(m) {
  const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random();
  let x = pl.p.x + Math.sin(a) * r, z = pl.p.z + Math.cos(a) * r, y = Math.floor(pl.p.y);
  if (solidAt(Math.floor(x), y, Math.floor(z)) || solidAt(Math.floor(x), y + 1, Math.floor(z))) { x = pl.p.x; z = pl.p.z; y = pl.p.y; }
  m.dim = dim;
  m.e.p.set(x, y + 0.01, z); m.e.vel.set(0, 0, 0);
}
const MOB_DRAW = 60;
function updateMob(m, dt) {
  const e = m.e, dx = pl.p.x - e.p.x, dz = pl.p.z - e.p.z, d = Math.hypot(dx, dz);
  const friend = friends.has(m.id), momFriend = !!m.mother && friends.has(m.mother.id);
  m.g.visible = d < MOB_DRAW || friend || momFriend;
  if (d > MOB_DRAW && !friend && !momFriend) return;
  let mx = 0, mz = 0;
  if (friend) {
    if (d > 26) bringToPlayer(m);
    else if (d > 2.8) { mx = dx / d; mz = dz / d; }
  } else if (m.mother) {
    const mo = m.mother.e.p, ddx = mo.x - e.p.x, ddz = mo.z - e.p.z, md = Math.hypot(ddx, ddz);
    if (md > 20) { e.p.set(mo.x + (Math.random() - .5), mo.y + 0.2, mo.z + (Math.random() - .5)); e.vel.set(0, 0, 0); }
    else if (md > 1.1 + (m.id % 4) * 0.35) { mx = ddx / md; mz = ddz / md; }
  } else {
    m.timer -= dt;
    if (m.timer <= 0) {
      m.walking = Math.random() < 0.6; m.dir = Math.random() * Math.PI * 2; m.timer = 1.5 + Math.random() * 3.5;
      // villagers stroll around their own village
      if (m.home && Math.hypot(m.home.x - e.p.x, m.home.z - e.p.z) > 14) m.dir = Math.atan2(m.home.x - e.p.x, m.home.z - e.p.z);
    }
    if (m.walking) {
      mx = Math.sin(m.dir); mz = Math.cos(m.dir);
      const nx = Math.floor(e.p.x + mx * 0.8), nz = Math.floor(e.p.z + mz * 0.8), fy = Math.floor(e.p.y);
      let drop = 0;
      while (drop < 4 && !isOpaque(get(nx, fy - 1 - drop, nz)) && get(nx, fy - 1 - drop, nz) !== WATER) drop++;
      const below = get(nx, fy - 1 - drop, nz);
      if (nx < 1 || nz < 1 || nx > SX - 2 || nz > SZ - 2 || drop >= 3 || (below === WATER && !m.def.swims)) {
        m.dir += Math.PI; m.timer = 1 + Math.random() * 2; mx = mz = 0;
      }
    }
  }
  const moving = Math.hypot(mx, mz) > 0.1;
  stepEntity(e, mx, mz, friend || momFriend ? Math.max(m.def.speed, 4) : m.def.speed, dt, m.def.hop && moving);
  if (e.p.y < -10) { const x = Math.floor(e.p.x), z = Math.floor(e.p.z); e.p.y = surfaceY(x, z) + 0.01; e.vel.set(0, 0, 0); }
  let ta = null;
  if (moving) ta = Math.atan2(mx, mz);
  else if (friend && d < 6) ta = Math.atan2(dx, dz);
  if (ta !== null) m.facing += wrapAngle(ta - m.facing) * Math.min(1, dt * 8);
  if (moving) m.phase += dt * Math.max(m.def.speed, 2) * 4;
  const sw = moving ? Math.sin(m.phase) * 0.6 : 0;
  m.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3) ? sw : -sw; });
  m.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (moving ? 0.25 + Math.sin(m.phase * 2) * 0.25 : 0.1); });
  m.g.position.copy(e.p);
  m.g.rotation.y = m.facing;
  if (m.waddle) m.g.rotation.z = moving ? Math.sin(m.phase) * 0.15 : 0;
  if (m.badge) m.badge.rotation.y += dt * 2;
}
function release(m) {
  if (!friends.delete(m.id)) return;
  if (m.badge) { m.g.remove(m.badge); m.badge = null; }
  m.timer = 0;
  updateStats(); scheduleSave();
}
function pet(m) {
  const p = m.e.p;
  if (m.type === 'villager') {
    m.facing = Math.atan2(pl.p.x - p.x, pl.p.z - p.z); m.timer = 2; m.walking = false;
    sfx.pet();
    toast(`${m.nick}: ${VILLAGER_SAY[(m.id + Math.floor(performance.now() / 4000)) % VILLAGER_SAY.length]}`, 2200);
    return;
  }
  floatHeart(p.x, p.y + m.def.h + 0.2, p.z);
  if (!friends.has(m.id)) {
    friends.add(m.id); makeFriendBadge(m); updateStats(); scheduleSave();
    burst(p.x - .5, p.y, p.z - .5, '#ff6fae', 12);
    sfx.friend();
    toast(`${m.def.name} ${m.nick} тепер дружить з Ангеліною!`, 2200);
  } else {
    sfx.pet();
    toast(m.def.say, 1000);
  }
}
