/* ============ gacha-ui.js — banners por generación y animación de tirada ============
 * La lógica (probabilidades, pity, shiny, repetidos) está en systems/gacha.js.
 */
G.GachaUI = (() => {
  const $ = G.UI.$;
  let busy = false;
  let gen = 1;
  const REGION_NAMES = ['關都', '城都', '豐緣', '神奧', '合眾', '卡洛斯', '阿羅拉', '伽勒爾', '帕底亞'];

  function init() {
    $('pull-1').onclick = () => pull(1);
    $('pull-10').onclick = () => pull(10, 't1');
    $('pull-10b').onclick = () => pull(10, 't10');
    $('pull-close').onclick = close;

    const tabs = $('gacha-gens');
    G.Gacha.BANNERS.forEach(b => {
      const t = document.createElement('button');
      t.className = 'gen-tab';
      t.dataset.gen = b.gen;
      t.innerHTML = `<b>${REGION_NAMES[b.gen - 1] || b.name}</b><small>第${b.gen}世代</small>`;
      t.onclick = () => { gen = b.gen; refresh(); };
      tabs.appendChild(t);
    });
  }

  function open() {
    G.UI.show('scr-gacha', true);
    refresh();
  }

  function refresh() {
    const s = G.DB.save;
    const banner = G.Gacha.BANNERS[gen - 1];
    document.querySelectorAll('#gacha-gens .gen-tab').forEach(t => t.classList.toggle('on', +t.dataset.gen === gen));

    const all = G.DEX.filter(p => p.gen === gen);
    const owned = all.filter(p => s.owned[p.dex]).length;
    const shinies = all.filter(p => s.shiny && s.shiny[p.dex]).length;
    const [c1, c2, c3] = banner.color;
    $('banner').style.background =
      `radial-gradient(circle at 80% 30%, rgba(255,210,63,.3), transparent 45%),
       radial-gradient(circle at 15% 80%, rgba(196,123,255,.3), transparent 50%),
       linear-gradient(135deg, ${c1}, ${c2} 55%, ${c3})`;
    $('banner-title').textContent = REGION_NAMES[banner.gen - 1] || banner.name;
    $('banner-desc').textContent = G.I18n.lang === 'zh'
      ? `第${gen}世代共有 ${all.length} 隻寶可夢。傳說寶可夢正等著你！`
      : `Los ${all.length} Pokémon de la generación ${gen}. ¡Los legendarios esperan!`;
    $('gacha-owned').innerHTML = `已收集 ${owned} / ${all.length} 隻` +
      (shinies ? ` · ${G.Icons.html('shiny', 12)} 色違 ${shinies}` : '');

    const feat = $('gacha-feat');
    feat.innerHTML = '';
    for (const dex of G.Gacha.featured(gen)) {
      feat.appendChild(G.UI.spriteCanvas(dex, 170, 190, { lively: true, scale: 2, dir: 1 }));
    }

    const pity = (s.pity && s.pity[gen]) || 0;
    $('gacha-pity').textContent = `尚未抽中傳說寶可夢：${pity} / ${G.Gacha.PITY_5}`;

    $('gacha-rates').innerHTML = '<h3>抽中機率</h3>' + G.Gacha.RATES.slice().reverse().map(([r, w]) => `
      <div><span style="color:${G.Gacha.RARITY_COLOR[r]}">${G.UI.stars(r, 10)} ${G.Gacha.RARITY_NAME[r]}</span>
      <span>${w}% · ${G.Gacha.pool(r, gen).length}</span></div>`).join('') +
      `<div><span>${G.Icons.html('shiny', 12)} 色違</span><span>1%</span></div>
      <p class="note">· 十連抽至少會獲得一隻史詩級或更高稀有度的寶可夢。<br>
       · 同一地區連續 ${G.Gacha.PITY_5} 抽未獲得傳說寶可夢時，下一抽必定獲得傳說寶可夢。<br>
       · 重複獲得的寶可夢會轉換成金幣；色違寶可夢不會重複。<br>
       · 抽獎券可透過遊戲取得。</p>`;

    const t = s.tickets;
    $('cost-1').innerHTML = `${G.Icons.html('ticket', 18)} 1`;
    $('cost-10').innerHTML = `${G.Icons.html('ticket', 18)} 10`;
    $('cost-10b').innerHTML = `${G.Icons.html('ticket10', 18)} 1`;
    $('gacha-tickets').innerHTML = `持有 ${G.Icons.html('ticket', 18)} <b>${G.Cheat.enabled() ? '∞' : t.t1}</b> 張抽獎券、${G.Icons.html('ticket10', 18)} <b>${G.Cheat.enabled() ? '∞' : t.t10}</b> 張十連抽獎券`;
    $('pull-1').disabled = !G.Gacha.costOf(s, 1);
    $('pull-10').disabled = !G.Gacha.costOf(s, 10, 't1');
    $('pull-10b').disabled = !G.Gacha.costOf(s, 10, 't10');
    G.UI.refreshCoins();
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function pull(n, use = 't1') {
    if (busy) return;
    const res = G.Gacha.pull(G.DB.save, n, gen, use);
    if (!res) { G.Audio.sfx('error'); G.UI.toast('No tienes tickets suficientes: consíguelos jugando'); return; }
    G.Progress.checkAch();
    G.DB.commit(true);
    busy = true;

    const best = Math.max(...res.map(r => r.rarity));
    const fx = $('pull-fx'), slot = $('slot'), out = $('pull-results');
    out.innerHTML = '';
    $('pull-close').classList.add('hidden');
    slot.style.display = '';
    fx.classList.remove('hidden');

    // La tragaperras (ui/slots.js) y luego las cartas.
    await G.Slots.play(slot, res);
    G.Audio.sfx('burst', { rarity: best });
    slot.style.display = 'none';

    for (const r of res) {
      const mon = G.DEX_BY[r.dex];
      const c = document.createElement('div');
      c.className = 'pcard r' + r.rarity + (r.shiny ? ' shiny' : '');
      c.style.setProperty('--rc', r.shiny ? '#9ae6ff' : G.Gacha.RARITY_COLOR[r.rarity]);
      c.innerHTML = `<div class="stars">${G.UI.stars(r.rarity, 24)}</div>`;
      c.appendChild(G.UI.spriteCanvas(r.dex, 132, 120, { lively: r.rarity >= 4 || r.shiny, scale: 2, shiny: r.shiny }));
      const tag = r.isNew
        ? `<span class="new">${r.shiny ? '全新色違！' : '新獲得！'}</span>`
        : `Repetido · <span class="coin"></span> +${r.refund}`;
      c.insertAdjacentHTML('beforeend', `<b>${r.shiny ? G.Icons.html('shiny', 12) + ' ' : ''}${mon.name}</b><div class="tag">${tag}</div>`);
      out.appendChild(c);
      G.Audio.sfx('reveal', { rarity: r.rarity });
      await wait(n === 10 ? 150 : 0);
    }
    $('pull-close').classList.remove('hidden');
    busy = false;
  }

  function close() {
    $('pull-fx').classList.add('hidden');
    refresh();
  }

  return { init, open, get open_() { return !$('pull-fx').classList.contains('hidden'); } };
})();


