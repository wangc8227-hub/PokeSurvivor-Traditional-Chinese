/* ============ settings-ui.js — pantalla de Ajustes (PC y móvil) ============
 * Se abre por encima de lo que haya (menú o pausa) y al cerrar vuelve ahí.
 * Pestañas: Sonido · Gráficos · Controles · Cuenta · Acerca de.
 * Los ajustes son de este dispositivo (G.Settings / G.Audio en el navegador).
 */
G.SettingsUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VERSION = '1.2 · 2026-10-09';
  const REPO = 'https://github.com/JPTER78/pokesurvivor';
  let tab = 'sound';

  function init() {
    const labels = { sound: '音效', gfx: '畫面', ctl: '操作', cheat: '金手指', acc: '存檔', about: '關於' };
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => { b.textContent = labels[b.dataset.t] || b.textContent; });
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => { b.onclick = () => { tab = b.dataset.t; render(); }; });
    $('set-close').onclick = close;
    $('btn-settings').innerHTML = G.Icons.html('gear', 20);
    $('btn-settings').onclick = () => open();
    $('btn-pause-settings').onclick = () => open('sound');
    // Pantalla completa (si el navegador la permite; en iPhone, cómo conseguirla).
    if (canFull() || iosTip()) {
      $('btn-full').classList.remove('hidden');
      $('btn-full').innerHTML = G.Icons.html('full', 20);
      $('btn-full').onclick = toggleFull;
    }
  }

  function open(t) {
    if (t) tab = t;
    $('scr-settings').classList.remove('hidden');
    render();
  }
  function close() { $('scr-settings').classList.add('hidden'); }
  const isOpen = () => !$('scr-settings').classList.contains('hidden');

  // ---------------- pantalla completa ----------------
  function canFull() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  // iPhone: Safari no deja poner una web a pantalla completa (por eso a veces
  // no salía la opción). Sí se puede abriéndola desde la pantalla de inicio.
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => !!navigator.standalone || (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);
  function iosTip() { return IOS && !canFull() && !standalone(); }
  const IOS_TIP = 'En iPhone, Safari no deja poner las webs a pantalla completa. Pulsa Compartir y luego "Añadir a pantalla de inicio": abriendo el juego desde ese icono se juega a pantalla completa.';
  function toggleFull() {
    if (!canFull()) { if (iosTip()) G.UI.toast(IOS_TIP, 9000); return; }
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const el = document.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      // En móvil, además se intenta fijar la pantalla en horizontal.
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* nada */ } }).catch(() => {});
    }
    setTimeout(() => { if (isOpen()) render(); }, 300);
  }

  // ---------------- piezas ----------------
  function section(title, sub) { return `<h3 class="set-h">${esc(title)}</h3>${sub ? `<p class="sub">${sub}</p>` : ''}`; }
  function toggle(key, label, desc) {
    const on = !!G.Settings.get(key);
    return `<div class="set-row"><div class="grow"><b>${esc(label)}</b><small>${esc(desc)}</small></div>
      <button class="btn small switch ${on ? 'gold' : ''}" data-k="${key}">${on ? 'Sí' : 'No'}</button></div>`;
  }
  function choice(key, opts) {
    const cur = G.Settings.get(key);
    return `<div class="chips set-chips">${opts.map(([v, l]) => `<button class="chip ${v === cur ? 'on' : ''}" data-k="${key}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
  }

  function cheatCopy() {
    if (G.I18n.lang === 'zh') return {
      title: '金手指', sub: '輸入「神」啟用無限票券、無限金幣與全圖鑑解鎖；輸入後不可反悔。', label: '密語', placeholder: '輸入密語',
      activate: '啟用', enabled: '已啟用', idle: '尚未啟用。', active: '無限票券、無限金幣與全圖鑑解鎖已啟用。', wrong: '密語錯誤，請再試一次。'
    };
    if (G.I18n.lang === 'en') return {
      title: 'Cheats', sub: 'Enter the code to enable unlimited tickets, coins, and the full Pokédex.', label: 'Code', placeholder: 'Enter code',
      activate: 'Activate', enabled: 'Enabled', idle: 'Not enabled.', active: 'Unlimited tickets, coins, and the full Pokédex are enabled.', wrong: 'Incorrect code. Try again.'
    };
    return {
      title: 'Trucos', sub: 'Escribe el código para activar tickets, monedas y la Pokédex completa.', label: 'Código', placeholder: 'Escribe el código',
      activate: 'Activar', enabled: 'Activado', idle: 'Aún no está activado.', active: 'Tickets, monedas y la Pokédex completa activados.', wrong: 'Código incorrecto. Inténtalo de nuevo.'
    };
  }

  function render() {
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const box = $('set-body');
    box.scrollTop = 0;
    if (tab === 'sound') {
      box.innerHTML = section('Sonido') + '<div id="set-sound" class="sound-inline"></div>';
      G.UI.soundControls($('set-sound'));
    } else if (tab === 'gfx') {
      const auto = ['baja', 'media', 'alta'][G.Settings.autoLevel];
      box.innerHTML = section('語言', '目前僅提供繁體中文。')
        + `<div class="set-row"><div class="grow"><b>遊戲語言</b></div><span>繁體中文</span></div>`
        + section('Calidad', 'Cuántos efectos y partículas se dibujan. <b>Auto</b> la baja sola si el juego va a tirones (ahora: ' + auto + ').')
        + choice('quality', [['auto', 'Auto'], ['high', 'Alta'], ['mid', 'Media'], ['low', 'Baja']])
        + section('Pantalla')
        + toggle('dmgNumbers', 'Números de daño', 'Los números que salen al golpear y al recibir daño.')
        + toggle('calm', 'Menos sacudidas y destellos', 'La cámara tiembla menos y los fogonazos son suaves.')
        + toggle('fps', 'Mostrar FPS', 'Fotogramas por segundo, en la esquina de abajo.')
        + (canFull() ? `<div class="set-row"><div class="grow"><b>Pantalla completa</b><small>Sin barras del navegador.</small></div>
             <button class="btn small" id="set-full">${isFull() ? 'Salir' : 'Activar'}</button></div>`
           : iosTip() ? `<div class="set-row"><div class="grow"><b>Pantalla completa</b><small>${esc(IOS_TIP)}</small></div></div>` : '');
    } else if (tab === 'ctl') {
      box.innerHTML = section('En móvil o tablet', 'Pon el dedo en cualquier parte y arrastra para moverte: el joystick aparece donde tocas. Toca un ataque de abajo para cambiarlo y el botón de arriba a la derecha para pausar. Se juega en horizontal.')
        + section('Tamaño del joystick', 'Cuánto hay que arrastrar el dedo.')
        + choice('stick', [[0.8, 'Pequeño'], [1, 'Normal'], [1.25, 'Grande']])
        + section('電腦操作')
        + `<div class="keys">
             <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 或方向鍵</div><span>移動</span>
             <div><kbd>1</kbd>–<kbd>4</kbd> 或點擊攻擊圖示</div><span>選擇攻擊</span>
             <div><kbd>Q</kbd> / <kbd>E</kbd></div><span>切換上一個／下一個攻擊</span>
             <div><kbd>Esc</kbd> 或 <kbd>P</kbd></div><span>暫停</span>
             <div><kbd>1</kbd>–<kbd>3</kbd></div><span>升級時選擇卡片</span>
           </div>`;
    } else if (tab === 'cheat') {
      const copy = cheatCopy(), active = G.Cheat.enabled();
      box.innerHTML = section(copy.title, copy.sub)
        + `<form id="cheat-form" class="cheat-form">
             <label for="cheat-code">${esc(copy.label)}</label>
             <input id="cheat-code" class="field" type="text" placeholder="${esc(copy.placeholder)}" autocomplete="off" autocapitalize="off" spellcheck="false" ${active ? 'disabled' : ''}>
             <button class="btn gold" type="submit" ${active ? 'disabled' : ''}>${esc(active ? copy.enabled : copy.activate)}</button>
           </form>
           <p id="cheat-status" class="sub ${active ? 'gold' : ''}" role="status">${esc(active ? copy.active : copy.idle)}</p>`;
    } else if (tab === 'acc') {
      renderAccount(box);
    } else {
      box.innerHTML = `<div class="about-logo">PokéSurvivor</div><p class="sub center">Versión ${esc(VERSION)}</p>`
        + `<p class="sub">Juego de fans <b>gratuito y sin ánimo de lucro</b>: sin anuncios ni compras. Pokémon y sus personajes son propiedad de Nintendo, Creatures y GAME FREAK; este proyecto no está afiliado a ellos.</p>`
        + section('Créditos')
        + `<ul class="credits">
             <li><b>Sprites:</b> PMD SpriteCollab y sus artistas (CC BY-NC 4.0).</li>
             <li><b>Datos de los Pokémon:</b> PokéAPI.</li>
             <li><b>Música y sonidos:</b> originales, generados por el propio juego.</li>
             <li><b>Fuente:</b> Pixelify Sans (OFL).</li>
           </ul>`
        + `<div class="row wrap" style="justify-content:center;gap:8px">
             ${window.PS_PAGES ? `<a class="btn small" href="${G.I18n.lang === 'en' ? 'en/guide/' : 'guia/'}" target="_blank">Guía y preguntas</a>
             <a class="btn small" href="${G.I18n.lang === 'en' ? 'en/pokedex/' : 'pokedex/'}" target="_blank">Pokédex</a>` : ''}
             <button class="btn small" data-legal>Aviso legal y privacidad</button>
             <a class="btn small" href="contacto/" target="_blank" rel="noopener">Contacto</a>
             <a class="btn small" href="${REPO}" target="_blank" rel="noopener">Código (GitHub)</a>
           </div>`;
    }
    wire(box);
  }

  function renderAccount(box) {
    box.innerHTML = section('本機存檔', '遊戲進度會自動儲存在這個瀏覽器中。重新開始會清除目前存檔並恢復初始狀態。')
      + `<div class="set-row"><div class="grow"><b>儲存位置</b></div><span>此裝置的瀏覽器</span></div>`
      + `<div class="set-row"><div class="grow"><b>同步狀態</b></div><span>離線自動儲存</span></div>`
      + `<div class="set-row"><div class="grow"><b>重新開始</b><small>清除收藏、抽獎券、金幣、成就與冒險紀錄；此操作無法復原。</small></div><button class="btn small gold" id="btn-reset-progress">清除進度並重新開始</button></div>`;
  }

  function wire(box) {
    const cheatForm = box.querySelector('#cheat-form');
    if (cheatForm) cheatForm.onsubmit = event => {
      event.preventDefault();
      const input = $('cheat-code');
      const copy = cheatCopy();
      if (G.Cheat.activate(input.value.trim())) {
        G.DB.unlockAll('cheat');
        G.UI.refreshCoins();
        G.Audio.sfx('confirm');
        render();
      } else {
        $('cheat-status').textContent = copy.wrong;
        input.focus(); input.select();
        G.Audio.sfx('error');
      }
    };
    box.querySelectorAll('.switch[data-k]').forEach(b => { b.onclick = () => { G.Settings.set(b.dataset.k, !G.Settings.get(b.dataset.k)); render(); }; });
    box.querySelectorAll('.chip[data-k]').forEach(b => {
      b.onclick = () => { const v = b.dataset.v; G.Settings.set(b.dataset.k, isNaN(+v) ? v : +v); render(); };
    });
    const full = $('set-full'); if (full) full.onclick = toggleFull;
    const reset = box.querySelector('#btn-reset-progress');
    if (reset) reset.onclick = () => {
      if (!confirm('確定清除目前裝置上的全部遊戲進度並重新開始嗎？此操作無法復原。帳號、繁體中文設定與難度會保留；金手指會恢復為未啟用。')) return;
      reset.disabled = true;
      if (!G.DB.resetProgress()) {
        reset.disabled = false;
        G.UI.toast('無法清除存檔，請確認瀏覽器允許儲存資料。');
        return;
      }
      location.reload();
    };
    const lo = $('set-login'); if (lo) lo.onclick = () => { close(); leave(); };
    const out = $('set-logout'); if (out) out.onclick = () => { close(); leave(); };
    const del = $('set-delete');
    if (del) del.onclick = async () => {
      const ok = await G.UI.confirmDelete();
      if (!ok) return;
      del.disabled = true;
      const r = await G.DB.deleteAccount(ok.pass);
      if (!r.ok) { $('set-msg').textContent = r.error; del.disabled = false; return; }
      close();
      G.UI.toast('Cuenta borrada');
      G.Audio.music(null);
      G.Flow.toLogin();
    };
  }

  /** Cerrar sesión (si estás en una partida, se abandona). */
  function leave() {
    if (G.DB.guest && !confirm('Eres invitado: se perderá todo el progreso. ¿Salir?')) return;
    if (G.Game.state !== 'ui') G.Game.quit && G.Game.quit();
    G.Audio.music(null);
    G.DB.logout().then(() => G.Flow.toLogin());
  }

  return { init, open, close, get isOpen() { return isOpen(); } };
})();

