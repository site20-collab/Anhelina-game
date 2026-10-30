// ---------- install as an app ----------
const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const canInstall = 'serviceWorker' in navigator && !/claude/i.test(location.hostname) && (location.protocol === 'https:' || location.hostname === 'localhost');
let installPrompt = null;
if (canInstall) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  $('installBtn').hidden = standalone;
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
addEventListener('appinstalled', () => { $('installBtn').hidden = true; toast('Гру встановлено! Шукай іконку на екрані', 3000); });
function showInstallHelp() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const steps = ios
    ? ['Відкрий гру в <b>Safari</b>.', 'Натисни кнопку <b>Поділитися</b> (квадрат зі стрілкою вгору).', 'Вибери <b>На початковий екран</b>.', 'Натисни <b>Додати</b>.']
    : ['Відкрий гру в <b>Chrome</b>.', 'Натисни меню <b>⋮</b> угорі праворуч.', 'Вибери <b>Встановити застосунок</b> або <b>Додати на головний екран</b>.', 'Підтвердь <b>Встановити</b>.'];
  $('installHow').textContent = 'Гра з\'явиться на екрані телефона з власною іконкою і відкриватиметься на весь екран. Грати можна навіть без інтернету, тільки гра з друзями потребує інтернету.';
  const ol = $('installSteps');
  ol.textContent = '';
  steps.forEach(t => {
    const li = document.createElement('li');
    // the steps are fixed text written here, never user input
    li.innerHTML = t;
    ol.appendChild(li);
  });
  $('installPanel').hidden = false; playing = false;
}
$('installBtn').addEventListener('click', async () => {
  if (installPrompt) {
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch (e) {}
    installPrompt = null;
    return;
  }
  showInstallHelp();
});
$('installClose').addEventListener('click', () => { $('installPanel').hidden = true; playing = true; });
