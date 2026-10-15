(function () {
  'use strict';

  // ---------- 数据登记 ----------
  // 各国数据文件调用 TRAVEL.register({...})，按需懒加载。
  const TRAVEL = window.TRAVEL = window.TRAVEL || { countries: {} };
  TRAVEL.register = function (data) { TRAVEL.countries[data.id] = data; };
  const INDEX = window.TRAVEL_INDEX || [];
  const CHINA = window.CHINA_INDEX || [];
  INDEX.forEach((c) => { c.scope = 'world'; });
  CHINA.forEach((c) => { c.scope = 'china'; });
  const byId = Object.fromEntries([...INDEX, ...CHINA].map((c) => [c.id, c]));

  // 两个 tab：环游世界 / 中国游，各自一套目的地、地图和文案
  const SCOPES = {
    world: {
      list: INDEX, path: '#/', tab: '环游世界', title: '环游世界 · 旅行卡片', back: '← 环游世界',
      eyebrow: 'Around the World · 旅行卡片集', h1: ['转动地球，', '挑下一站'],
      lede: '每个国家整理成一套卡片：怎么排行程、怎么飞、去哪些城市、看哪些人文景点、当地有什么讲究，再学几句能用上的当地话。先从日本和韩国开始，后面一个个点亮。',
      hint: '拖动旋转 · 点国家看看', selKey: 'globeSel', defaultSel: 'japan',
      stats: ['个国家已上线', '座城市', '条行程', '句旅行用语'], view: null
    },
    china: {
      list: CHINA, path: '#/china', tab: '中国游', title: '中国游 · 旅行卡片', back: '← 中国游',
      eyebrow: 'China · 一城一套卡片', h1: ['走遍中国，', '一城一站'],
      lede: '国内城市也整理成一套卡片：怎么去、住哪一片、吃什么、逛哪些老街和博物馆，再学几句当地话。先从广州开始。',
      hint: '拖动看看 · 点城市', selKey: 'chinaSel', defaultSel: 'guangzhou',
      stats: ['座城市已上线', '个片区', '条行程', '句当地话'],
      view: { center: [108.5, 33], zoom: 2.4, pan: 14, landUrl: 'assets/data/eastasia-land-50m.json?v=1' }
    }
  };

  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const modalCard = document.getElementById('modal-card');
  const topnav = document.getElementById('topnav');

  // ---------- 小工具 ----------
  // 所有文本走 textContent，不拼 HTML 字符串。
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'style') for (const [p, val] of Object.entries(v)) n.style.setProperty(p, val);
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      n.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return n;
  }

  const store = {
    get(k, d) { try { const v = localStorage.getItem('wt:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('wt:' + k, JSON.stringify(v)); } catch (e) { /* 隐私模式等情况下忽略 */ } }
  };

  // ---------- 图片 ----------
  // 图片清单在各国数据的 images 里，按 key 引用；每张都带作者、许可和出处。
  function imgOf(c, key) { return key && c && c.images && c.images[key] ? c.images[key] : null; }
  function credit(im) {
    return el('a', {
      class: 'credit', href: im.source, target: '_blank', rel: 'noopener noreferrer',
      title: `图片：${im.credit} · ${im.license}`, onclick: (e) => e.stopPropagation()
    }, '© ', im.credit, ' · ', im.license);
  }
  // 缩略图在同目录的 thumb/ 下（宽 640），卡片里用缩略图，看大图时才加载原图
  function thumbOf(im) { return im.src.replace(/\/([^/]+)$/, '/thumb/$1'); }
  function photo(c, key, cls, withCredit, small) {
    const im = imgOf(c, key);
    if (!im) return null;
    const open = (e) => { e.stopPropagation(); openLightbox([im], 0, e.currentTarget); };
    return el('figure', {
      class: 'photo zoomable' + (cls ? ' ' + cls : ''), tabindex: '0', role: 'button', 'aria-label': `看大图：${im.alt || ''}`,
      onclick: open,
      onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } }
    },
      el('img', { src: small ? thumbOf(im) : im.src, alt: im.alt || '', loading: 'lazy', decoding: 'async' }),
      withCredit === false ? null : credit(im));
  }

  // ---------- 精简展示：图标卡默认只露标题，点开看详情 ----------
  function fold(cls, summary, body, open) {
    return el('details', { class: 'fold' + (cls ? ' ' + cls : ''), open: !!open },
      el('summary', null, summary),
      el('div', { class: 'fold-body' }, body));
  }
  function tile(icon, title, extra, body, cls) {
    return fold('tile' + (cls ? ' ' + cls : ''), [
      icon ? el('span', { class: 't-ico', 'aria-hidden': 'true' }, icon) : null,
      el('span', { class: 't-title' }, title),
      extra || null,
      el('span', { class: 'chev', 'aria-hidden': 'true' })
    ], body);
  }
  const bullets = (list) => el('ul', { class: 'dots' }, list.map((t) => el('li', null, t)));

  // 「3 月下旬 – 5 月」「12 – 2 月」→ 覆盖的月份
  function monthRange(text) {
    const n = (String(text).match(/\d{1,2}/g) || []).map(Number).filter((x) => x >= 1 && x <= 12);
    if (!n.length) return [];
    const a = n[0], b = n[n.length - 1], out = [];
    for (let m = a, i = 0; i < 12; i++) { out.push(m); if (m === b) break; m = m % 12 + 1; }
    return out;
  }
  // 节庆写的月份：「1–2 月」「4 月 14–15 日 / 10 月 9–10 日」→ [1] / [4, 10]
  function festMonths(text) {
    const t = String(text), out = [];
    const re = /(\d{1,2})\s*(?:[–-]\s*(\d{1,2})\s*)?月/g;
    let m;
    while ((m = re.exec(t))) { const v = +m[1]; if (v >= 1 && v <= 12 && !out.includes(v)) out.push(v); }
    return out.slice(0, 2);
  }
  // 「约 3.5–4 小时」「30–40 分钟」「1 小时 25 分」→ 分钟
  function minutesOf(text) {
    const t = String(text).replace(/,/g, '');
    const avg = (m) => (m ? (parseFloat(m[1]) + parseFloat(m[2] || m[1])) / 2 : 0);
    const h = avg(t.match(/([\d.]+)\s*(?:[–-]\s*([\d.]+)\s*)?(?:个)?小时/));
    const mi = avg(t.match(/([\d.]+)\s*(?:[–-]\s*([\d.]+)\s*)?分/));
    const total = h * 60 + mi;
    return total > 0 ? total : null;
  }
  // 「约 600–900 元 / 天」「2500 元起」→ [低, 高, 是否上不封顶]
  function moneyRange(text) {
    const n = (String(text).replace(/,/g, '').match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((x) => x >= 10);
    if (!n.length) return null;
    const open = /起|以上|\+/.test(text);
    return [n[0], n.length > 1 ? n[n.length - 1] : n[0], open];
  }
  // 单色横向条形图：rows = [{ label, sub, value, lo, hi, open, text, tip }]
  function barChart(rows, { range = false, unit = '' } = {}) {
    const max = Math.max(...rows.map((r) => (range ? r.hi * (r.open ? 1.35 : 1) : r.value))) * 1.08;
    return el('div', { class: 'bars' + (range ? ' range' : ''), role: 'list' }, rows.map((r) => {
      const left = range ? (r.lo / max) * 100 : 0;
      const width = range ? Math.max(2, ((r.hi * (r.open ? 1.35 : 1) - r.lo) / max) * 100) : Math.max(2, (r.value / max) * 100);
      return el('div', { class: 'bar-row', role: 'listitem', title: r.tip || '' },
        el('div', { class: 'bar-label' }, el('b', null, r.label), r.sub ? el('small', null, r.sub) : null),
        el('div', { class: 'bar-track' },
          el('span', { class: 'bar' + (r.open ? ' open' : ''), style: { left: left + '%', width: width + '%' } })),
        el('div', { class: 'bar-val' }, r.text || (r.value + unit)));
    }));
  }

  function loadCountry(id) {
    if (TRAVEL.countries[id]) return Promise.resolve(TRAVEL.countries[id]);
    const meta = byId[id];
    if (!meta || meta.status !== 'live' || !meta.file) return Promise.reject(new Error('unknown country'));
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = meta.file + '?v=11';
      s.onload = () => TRAVEL.countries[id] ? resolve(TRAVEL.countries[id]) : reject(new Error('not registered'));
      s.onerror = () => reject(new Error('load failed'));
      document.head.append(s);
    });
  }

  // ---------- 朗读 ----------
  const canSpeak = 'speechSynthesis' in window;
  function speak(text, lang) {
    if (!canSpeak) return;
    const u = new SpeechSynthesisUtterance(text.replace(/（[^）]*）|\([^)]*\)/g, '').replace(/〜|~/g, ''));
    u.lang = lang;
    const norm = (x) => x.replace('_', '-').toLowerCase(), want = norm(lang), voices = speechSynthesis.getVoices();
    // 粤语只认 zh-HK / yue，找不到就交给浏览器，不拿普通话顶替
    const voice = voices.find((v) => norm(v.lang) === want)
      || (want === 'zh-hk' ? voices.find((v) => /^(yue|zh-hk)/.test(norm(v.lang))) : voices.find((v) => norm(v.lang).startsWith(want.slice(0, 2))));
    if (voice) u.voice = voice;
    u.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  // ---------- 收藏 ----------
  const wishKey = (cid, cityId) => cid + '/' + cityId;
  function isWished(cid, cityId) { return store.get('wish', []).includes(wishKey(cid, cityId)); }
  function toggleWish(cid, cityId) {
    const list = store.get('wish', []);
    const k = wishKey(cid, cityId);
    const i = list.indexOf(k);
    if (i >= 0) list.splice(i, 1); else list.push(k);
    store.set('wish', list);
    return i < 0;
  }
  function wishButton(c, city) {
    const b = el('button', {
      class: 'wish-btn', type: 'button', 'aria-pressed': String(isWished(c.id, city.id)),
      'aria-label': '加入想去清单', title: '想去'
    }, '♥');
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const on = toggleWish(c.id, city.id);
      document.querySelectorAll(`.wish-btn[data-k="${c.id}-${city.id}"]`).forEach((x) => x.setAttribute('aria-pressed', String(on)));
    });
    b.dataset.k = c.id + '-' + city.id;
    return b;
  }

  // ---------- 顶部导航 ----------
  function renderTopnav(active, scope) {
    topnav.replaceChildren(
      ...Object.entries(SCOPES).map(([k, sc]) => el('a', { href: sc.path, class: 'scope-link', 'aria-current': !active && scope === k ? 'page' : null }, sc.tab)),
      el('span', { class: 'nav-sep', 'aria-hidden': 'true' }),
      ...SCOPES[scope].list.filter((c) => c.status === 'live').map((c) =>
        el('a', { href: '#/' + c.id, 'aria-current': active === c.id ? 'page' : null }, c.name))
    );
  }

  // ---------- 首页 ----------
  const homeRegion = { world: '全部', china: '全部' };
  // 出发城市（地球上的航线起点，和各国「航班交通」里的出发地对应）
  const ORIGINS = [
    { name: '北京', lonlat: [116.4, 39.9] }, { name: '上海', lonlat: [121.47, 31.23] },
    { name: '广州', lonlat: [113.26, 23.13] }, { name: '深圳', lonlat: [114.06, 22.54] },
    { name: '成都', lonlat: [104.07, 30.57] }, { name: '香港', lonlat: [114.17, 22.32] }
  ];
  let globe = null;
  let renderToken = 0;

  function renderHome(scope) {
    const token = ++renderToken;
    const SC = SCOPES[scope], LIST = SC.list;
    document.title = SC.title;
    setTheme(null);
    renderTopnav(null, scope);
    const live = LIST.filter((c) => c.status === 'live');
    app.replaceChildren(el('div', { class: 'loading' }, '正在展开地图…'));
    Promise.all(live.map((c) => loadCountry(c.id).catch(() => null))).then(() => {
      if (token !== renderToken) return;
      const loaded = live.map((c) => TRAVEL.countries[c.id]).filter(Boolean);
      const sum = (fn) => loaded.reduce((n, c) => n + fn(c), 0);
      const regions = ['全部', ...new Set(LIST.map((c) => c.region))];
      if (!regions.includes(homeRegion[scope])) homeRegion[scope] = '全部';

      const grid = el('div', { class: 'postcards' });
      const drawGrid = () => {
        grid.replaceChildren(...LIST.filter((c) => homeRegion[scope] === '全部' || c.region === homeRegion[scope]).map(postcard));
      };
      const chips = el('div', { class: 'chips', role: 'group', 'aria-label': '按地区筛选' },
        regions.map((r) => el('button', {
          class: 'chip', type: 'button', 'aria-pressed': String(r === homeRegion[scope]),
          onclick: (e) => {
            homeRegion[scope] = r;
            chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
            drawGrid();
          }
        }, r)));
      drawGrid();

      // ---- 地球 + 选中目的地卡片
      let origin = ORIGINS.find((o) => o.name === store.get('origin', '深圳')) || ORIGINS[3];
      let selId = store.get(SC.selKey, SC.defaultSel);
      if (!LIST.some((m) => m.id === selId)) selId = live[0] ? live[0].id : LIST[0].id;
      const cardHost = el('div', { class: 'dest-host', 'aria-live': 'polite' });
      const pills = el('div', { class: 'dest-pills', role: 'group', 'aria-label': '选择目的地' });
      const showCard = (id) => {
        selId = id;
        store.set(SC.selKey, id);
        cardHost.replaceChildren(destCard(byId[id], origin));
        pills.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
      };
      pills.append(...LIST.map((m) => el('button', {
        type: 'button', class: 'pill' + (m.status === 'live' ? ' live' : ''), 'data-id': m.id, style: { '--pc': m.accent },
        onclick: () => { if (globe) globe.select(m.id); else showCard(m.id); }
      }, el('i', { 'aria-hidden': 'true' }), m.name)));
      const originSel = el('select', {
        'aria-label': '出发城市',
        onchange: (e) => {
          origin = ORIGINS.find((o) => o.name === e.target.value) || origin;
          store.set('origin', origin.name);
          if (globe) globe.setOrigin(origin);
          showCard(selId);
        }
      }, ORIGINS.map((o) => el('option', { value: o.name, selected: o.name === origin.name }, o.name)));
      const globeHost = el('div', { class: 'globe-host' });
      const hasGlobe = window.Globe && Globe.available();

      app.replaceChildren(
        el('section', { class: 'wrap home-hero globe-hero scope-' + scope + (hasGlobe ? '' : ' no-globe') },
          el('div', { class: 'gh-intro' },
            el('nav', { class: 'scope-tabs', 'aria-label': '切换' }, Object.entries(SCOPES).map(([k, x]) =>
              el('a', { href: x.path, 'aria-current': k === scope ? 'page' : null }, x.tab))),
            el('div', { class: 'eyebrow' }, SC.eyebrow),
            el('h1', null, SC.h1[0], el('em', null, SC.h1[1])),
            el('p', { class: 'lede' }, SC.lede),
            el('label', { class: 'origin' }, '从 ', originSel, ' 出发')),
          hasGlobe ? el('div', { class: 'gh-globe' },
            globeHost,
            el('p', { class: 'globe-hint' }, SC.hint)) : null,
          el('div', { class: 'gh-card' },
            pills,
            cardHost,
            el('div', { class: 'stats' },
              stat(loaded.length, SC.stats[0]),
              stat(sum((c) => c.cities.length), SC.stats[1]),
              stat(sum((c) => c.itineraries.length), SC.stats[2]),
              stat(sum((c) => c.language.phrases.reduce((n, g) => n + g.items.length, 0)), SC.stats[3])))),
        el('section', { class: 'wrap' }, el('h2', { class: 'home-h2' }, scope === 'china' ? '全部城市' : '全部目的地'), chips, grid),
        wishStrip(LIST)
      );

      if (hasGlobe) {
        globe = Globe.create(globeHost, {
          places: LIST, origin, selected: selId, view: SC.view,
          onSelect: (p) => showCard(p.id),
          onError: () => { const h = app.querySelector('.globe-hint'); if (h) h.textContent = '世界地图没加载出来，用目的地按钮也能选'; }
        });
        globe.select(selId);
      } else {
        showCard(selId);
      }
    });
  }

  // 热门景点：数据里有 topSpots 就按它；否则按「被行程提到的次数 + 有没有照片」排，并保证每个城市都有代表
  function topSpots(c, n) {
    const all = [];
    c.cities.forEach((city) => city.spots.forEach((s) => all.push({ s, city })));
    if (c.topSpots && c.topSpots.length) {
      return c.topSpots.map((name) => all.find((x) => x.s.name === name)).filter(Boolean).slice(0, n);
    }
    const count = {};
    c.itineraries.forEach((it) => it.plan.forEach((d) => (d.spots || []).forEach((name) => { count[d.city + '/' + name] = (count[d.city + '/' + name] || 0) + 1; })));
    const score = (x) => (count[x.city.id + '/' + x.s.name] || 0) * 2 + (x.s.img ? 3 : 0) + (x.s.type === '人文' || x.s.type === '自然' ? 0.5 : 0);
    const ranked = all.map((x, i) => ({ ...x, sc: score(x) - i * 0.001 })).sort((a, b) => b.sc - a.sc);
    const pick = [], seenCity = new Set();
    for (const x of ranked) if (!seenCity.has(x.city.id)) { pick.push(x); seenCity.add(x.city.id); }
    for (const x of ranked) if (pick.length < n && !pick.includes(x)) pick.push(x);
    return pick.slice(0, n).sort((a, b) => b.sc - a.sc);
  }

  // 当地时间和与北京的时差
  function localTime(meta) {
    if (!meta.tz) return null;
    try {
      const now = new Date();
      const fmt = (tz) => new Intl.DateTimeFormat('zh-CN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
      const off = (tz) => { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(now).find((x) => x.type === 'timeZoneName').value; const m = p.match(/([+-])(\d+):?(\d+)?/); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] + (+m[3] || 0) / 60) : 0; };
      const d = off(meta.tz) - 8;
      const diff = d === 0 ? '和北京同一时间' : `比北京${d > 0 ? '快' : '慢'} ${Math.abs(d)} 小时`;
      return `🕐 当地 ${fmt(meta.tz)}，${diff}`;
    } catch (e) { return null; }
  }

  function destCard(meta, origin) {
    const c = TRAVEL.countries[meta.id];
    if (meta.status !== 'live' || !c) {
      return el('div', { class: 'dest-card soon', style: { '--pc': meta.accent } },
        el('div', { class: 'dc-body' },
          el('div', { class: 'dc-top' }, el('span', { class: 'dc-local' }, meta.nameLocal), el('span', { class: 'dc-tag' }, '筹备中')),
          el('h3', null, meta.name, el('small', null, meta.nameEn)),
          el('p', null, `${meta.region} · 这一站还在整理，很快点亮。`),
          localTime(meta) ? el('ul', { class: 'dc-facts' }, el('li', null, localTime(meta))) : null));
    }
    const cover = imgOf(c, 'cover');
    const route = c.flights.routes.find((r) => r.from.includes(origin.name));
    const china = meta.scope === 'china';
    const routeLine = china
      ? (origin.name === meta.name ? '📍 就在本地，直接开逛' : route ? `🚄 ${origin.name}出发：${route.duration}（${route.airlines}）` : `🚄 从${origin.name}出发：看攻略里的「交通」`)
      : '✈ ' + (route ? `${origin.name}直飞${route.to}${route.duration}` : `从${origin.name}出发：看攻略里的「航班交通」`);
    const best = c.seasons.filter((x) => x.rating >= 5).map((x) => x.name).join('、');
    return el('a', { class: 'dest-card live' + (cover ? ' has-img' : ''), href: '#/' + meta.id, style: { '--pc': meta.accent } },
      cover ? el('img', { class: 'dc-img', src: thumbOf(cover), alt: '', decoding: 'async' }) : el('div', { class: 'dc-img dc-type', 'aria-hidden': 'true' }, meta.nameLocal),
      el('div', { class: 'dc-body' },
        el('div', { class: 'dc-top' }, el('span', { class: 'dc-local' }, meta.nameLocal), el('span', { class: 'dc-tag' }, '已上线')),
        el('h3', null, meta.name, el('small', null, meta.nameEn)),
        el('p', null, c.tagline),
        el('ul', { class: 'dc-facts' },
          el('li', null, routeLine),
          el('li', null, `${c.cities.length} ${china ? '个片区' : '座城市'} · ${c.itineraries.length} 条行程`),
          el('li', null, '📍 热门：' + topSpots(c, 4).map((x) => x.s.name.split(' · ')[0]).join(' · ')),
          best ? el('li', null, `最舒服的季节：${best}`) : null,
          localTime(meta) ? el('li', null, localTime(meta)) : null),
        el('span', { class: 'dc-go' }, '打开攻略 →')));
  }

  function stat(n, label) { return el('div', { class: 'stat' }, el('b', null, n), el('span', null, label)); }

  function postcard(meta) {
    const c = TRAVEL.countries[meta.id];
    const inner = [
      el('div', { class: 'stamp', 'aria-hidden': 'true' }, el('div', null, meta.code, el('small', null, meta.region))),
      el('div', null,
        el('div', { class: 'pc-local' }, meta.nameLocal),
        el('div', { class: 'pc-name' }, meta.name),
        el('div', { class: 'pc-en' }, meta.nameEn))
    ];
    if (meta.status === 'live' && c) {
      const cover = imgOf(c, 'cover');
      if (cover) inner.unshift(el('img', { class: 'pc-bg', src: thumbOf(cover), alt: '', loading: 'lazy', decoding: 'async' }));
      inner.push(el('div', { class: 'pc-meta' },
        el('span', null, el('b', null, c.cities.length), ' 座城市'),
        el('span', null, el('b', null, c.itineraries.length), ' 条行程'),
        el('span', null, el('b', null, c.language.name))));
      return el('a', { class: 'postcard' + (cover ? ' has-img' : ''), href: '#/' + meta.id, style: { '--pc': meta.accent } }, inner);
    }
    inner.push(el('span', { class: 'soon-tag' }, '筹备中'));
    return el('div', { class: 'postcard soon', style: { '--pc': meta.accent }, 'aria-disabled': 'true' }, inner);
  }

  function wishStrip(list) {
    const items = store.get('wish', []).map((k) => {
      const [cid, cityId] = k.split('/');
      if (!list.some((m) => m.id === cid)) return null;
      const c = TRAVEL.countries[cid];
      const city = c && c.cities.find((x) => x.id === cityId);
      return city ? el('a', { href: `#/${cid}/${cityId}` }, '♥ ', c.name, ' · ', city.name) : null;
    }).filter(Boolean);
    return el('section', { class: 'wrap wish-strip' },
      el('h2', null, '我想去的城市'),
      items.length ? el('div', { class: 'wish-list' }, items)
        : el('p', { class: 'empty' }, '在城市卡片上点 ♥，想去的地方会收集在这里（只存在这台设备的浏览器里）。'));
  }

  // ---------- 国家页 ----------
  let current = null;
  function setTheme(theme) {
    const r = document.documentElement.style;
    // 只写基色，浅色/暗色下实际用的 --accent 在 CSS 里按配色方案换算
    if (theme) { r.setProperty('--accent-base', theme.accent); r.setProperty('--accent2-base', theme.accent2); }
    else { r.removeProperty('--accent-base'); r.removeProperty('--accent2-base'); }
  }

  function renderCountry(c) {
    current = c.id;
    setTheme(c.theme);
    const scope = (byId[c.id] && byId[c.id].scope) || 'world';
    document.title = `${c.name}旅行卡片 · ${SCOPES[scope].tab}`;
    renderTopnav(c.id, scope);
    // 数据可以改章节名，比如广州把「城市」叫「片区」、「语言」叫「粤语」
    const L = (id, title, desc) => { const o = (c.labels || {})[id] || {}; return [o.title || title, o.desc || desc]; };

    // 章节按数据有无决定是否出现，编号自动排
    const secs = [
      ['overview', '速览', '什么时候去、要准备什么、大概花多少钱', overview],
      ['top', '必去景点', '最值得去的地方，点卡片看详情', topSection],
      c.history && ['history', '历史', '时代、大事记和人物，点开看相关景点', historySection],
      ['itinerary', '行程', '照着走就行的路线，点城市名看详情', itineraries],
      ['flights', ...L('flights', '航班交通', '从国内怎么飞，落地后怎么走'), flights],
      ['cities', ...L('cities', '城市', '点卡片看景点、美食和住哪'), cities],
      c.foodGuide && ['food', '美食', '必吃清单和吃饭的规矩', food],
      c.festivals && ['festivals', '节庆', '一年里的祭典和季节活动', festivals],
      (c.stays || c.shopping) && ['stay', '住宿购物', '住哪种、买什么、怎么免税', staysShopping],
      ['culture', '人文礼仪', '入乡随俗，少踩坑', culture],
      ['language', ...L('language', '语言', `${c.language.name}速成：认字母、学句子、听发音`), language],
      ['practical', '实用信息', 'App、付钱、上网、看病', practical],
      ['checklist', '出发清单', '勾选进度保存在本机浏览器', checklist],
      c.images && ['credits', '相册', '点开看大图，图片均为 Wikimedia Commons 上的自由许可作品', credits]
    ].filter(Boolean);
    const navLabel = { credits: '相册' };
    const label = (sec) => navLabel[sec[0]] || sec[1];
    const tabKey = 'tab:' + c.id;
    const navWrap = el('div', { class: 'wrap', role: 'tablist', 'aria-label': '章节' });
    const subnav = el('nav', { class: 'subnav' }, navWrap);
    const navButtons = secs.map((sec) => el('button', {
      type: 'button', role: 'tab', 'data-sec': sec[0], 'aria-controls': 'sec-' + sec[0],
      onclick: () => showTab(sec[0], true)
    }, label(sec)));
    navWrap.append(...navButtons);

    // 章节做成标签页：一次只显示一个，底部有上一章 / 下一章
    const panels = secs.map(([id, title, desc, fn], i) => {
      const panel = section(id, i + 1, title, desc, fn(c));
      panel.setAttribute('role', 'tabpanel');
      const prev = secs[i - 1], next = secs[i + 1];
      panel.append(el('div', { class: 'pager' },
        prev ? el('button', { type: 'button', class: 'pg prev', onclick: () => showTab(prev[0], true, true) }, el('small', null, '上一章'), '← ' + label(prev)) : el('span'),
        next ? el('button', { type: 'button', class: 'pg next', onclick: () => showTab(next[0], true, true) }, el('small', null, '下一章'), label(next) + ' →') : el('span')));
      return panel;
    });

    function showTab(id, byUser, focusPanel) {
      store.set(tabKey, id);
      panels.forEach((p) => { p.hidden = p.id !== 'sec-' + id; });
      navButtons.forEach((b) => {
        const on = b.dataset.sec === id;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      const btn = navButtons.find((b) => b.dataset.sec === id);
      if (btn) {
        const wr = navWrap.getBoundingClientRect(), br = btn.getBoundingClientRect();
        navWrap.scrollTo({ left: navWrap.scrollLeft + (br.left - wr.left) - (navWrap.clientWidth - br.width) / 2, behavior: byUser ? 'smooth' : 'auto' });
      }
      if (byUser) {
        // 已经往下滚了就回到标签栏下方，从新章节开头看（用不吸顶的头图底边来算位置）
        const hero = app.querySelector('.c-hero');
        const top = hero.getBoundingClientRect().bottom + window.scrollY - document.querySelector('.topbar').offsetHeight;
        if (window.scrollY > top + 1) window.scrollTo({ top, behavior: 'auto' });
        if (focusPanel) {
          const h = document.querySelector('#sec-' + id + ' h2');
          if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
        }
      }
    }
    // 左右方向键在标签之间切换
    navWrap.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = navButtons.findIndex((b) => b.classList.contains('on'));
      const n = navButtons[(i + (e.key === 'ArrowRight' ? 1 : -1) + navButtons.length) % navButtons.length];
      n.focus(); showTab(n.dataset.sec, true);
    });

    const cover = imgOf(c, 'cover');
    app.replaceChildren(
      el('section', { class: 'c-hero' + (cover ? ' has-img' : ''), 'data-local': c.nameLocal },
        el('div', { class: 'wrap c-hero-in' },
          el('div', { class: 'c-hero-text' },
            el('a', { class: 'back', href: SCOPES[scope].path }, SCOPES[scope].back),
            el('h1', null, c.name, el('span', { class: 'en' }, c.nameEn)),
            el('p', { class: 'tagline' }, c.tagline),
            clampText('intro', c.intro),
            c.notice ? fold('notice', [
              el('span', { class: 't-ico', 'aria-hidden': 'true' }, '⚠️'),
              el('span', { class: 'notice-title' }, el('b', null, c.notice.title), el('small', null, `${c.notice.points.length} 条${c.notice.updated ? ' · 更新于 ' + c.notice.updated : ''}`), el('span', { class: 'notice-first' }, c.notice.points[0])),
              el('span', { class: 'chev', 'aria-hidden': 'true' })
            ], bullets(c.notice.points)) : null),
          cover ? photo(c, 'cover', 'hero-photo') : null)),
      subnav,
      el('div', { class: 'wrap' }, panels)
    );
    let start = store.get(tabKey, 'overview');
    if (!secs.some((x) => x[0] === start)) start = 'overview';
    showTab(start, false);
  }

  // 长段落只露几行，点「展开」看全文
  function clampText(cls, text) {
    const p = el('p', { class: cls + ' clamp' }, text);
    const btn = el('button', { type: 'button', class: 'linkbtn more-btn', onclick: () => { const on = p.classList.toggle('clamp'); btn.textContent = on ? '展开' : '收起'; } }, '展开');
    return el('div', { class: 'clamp-wrap' }, p, btn);
  }

  function section(id, n, title, desc, ...body) {
    return el('section', { class: 'section', id: 'sec-' + id },
      el('div', { class: 'sec-head' },
        el('span', { class: 'sec-num' }, String(n).padStart(2, '0')),
        el('h2', null, title),
        el('p', null, desc)),
      body);
  }

  function overview(c) {
    // 一年 12 个月的推荐度：每个月归到它所在的季节
    const byMonth = {};
    c.seasons.forEach((se) => monthRange(se.months).forEach((m) => { if (!byMonth[m]) byMonth[m] = se; }));
    const nowM = new Date().getMonth() + 1;
    const detail = el('div', { class: 'season-detail', 'aria-live': 'polite' });
    const cols = [];
    const pick = (se, m) => {
      cols.forEach((col) => col.classList.toggle('sel', byMonth[col.dataset.m] === se));
      detail.replaceChildren(
        el('div', { class: 'sd-head' },
          el('b', null, se.name), el('span', null, se.months),
          el('span', { class: 'stars', 'aria-label': `推荐度 ${se.rating}/5` }, '★'.repeat(se.rating) + '☆'.repeat(5 - se.rating))),
        el('p', null, se.desc),
        el('div', { class: 'tags' }, se.highlights.map((h) => el('span', { class: 'tag' }, h))));
    };
    for (let m = 1; m <= 12; m++) {
      const se = byMonth[m], r = se ? se.rating : 0;
      const col = el('button', {
        type: 'button', class: 'm-col' + (m === nowM ? ' now' : ''), 'data-m': m,
        style: { '--h': (r / 5) * 100 + '%', '--o': (0.25 + r * 0.15).toFixed(2) },
        title: se ? `${m} 月 · ${se.name} · 推荐 ${r}/5` : `${m} 月`,
        'aria-label': se ? `${m} 月，${se.name}，推荐度 ${r}` : `${m} 月`,
        onclick: () => se && pick(se, m)
      }, el('span', { class: 'm-bar' }), el('span', { class: 'm-num' }, m), m === nowM ? el('span', { class: 'm-now' }, '现在') : null);
      cols.push(col);
    }
    const first = byMonth[nowM] || c.seasons[0];
    pick(first, nowM);

    const budgets = c.budget.map((b) => ({ b, r: moneyRange(b.perDay) })).filter((x) => x.r);
    return [
      el('div', { class: 'facts-tiles' }, c.facts.map((f) =>
        tile(f.icon, f.label, el('span', { class: 't-val' }, f.value.split(/[；;（(]/)[0]), el('p', null, f.value)))),
      el('div', { class: 'ov-grid' },
        el('div', { class: 'card chart-card' },
          el('h3', { class: 'card-h' }, '🗓 什么时候去'),
          el('div', { class: 'months', role: 'group', 'aria-label': '每月推荐度，点柱子看那个季节' }, cols),
          detail),
        el('div', { class: 'card chart-card' },
          el('h3', { class: 'card-h' }, '💰 每天花多少'),
          el('p', { class: 'meta-line' }, c.budgetNote || '人民币，不含机票'),
          budgets.length === c.budget.length
            ? barChart(budgets.map(({ b, r }) => ({ label: b.level, lo: r[0], hi: r[1], open: r[2], text: b.perDay.replace(/^约\s*/, ''), tip: b.desc })), { range: true })
            : bullets(c.budget.map((b) => `${b.level}：${b.perDay}`)),
          fold('mini', '三档分别怎么花', bullets(c.budget.map((b) => `${b.level}：${b.desc}`))))),
      fold('callout-fold', [el('span', { class: 't-ico', 'aria-hidden': 'true' }, '🛂'), el('span', { class: 't-title' }, c.visa.title), el('span', { class: 't-val' }, `${c.visa.points.length} 条`), el('span', { class: 'chev', 'aria-hidden': 'true' })],
        bullets(c.visa.points))
    ];
  }

  function topSection(c) {
    const list = topSpots(c, 16);
    return el('div', { class: 'tops' }, list.map(({ s, city }, i) => {
      const im = imgOf(c, s.img) || imgOf(c, city.img);
      return el('button', {
        type: 'button', class: 'top-card', style: { '--cc': city.color },
        onclick: () => openCity(c, city.id, false, s.name), 'aria-label': `${s.name}，${city.name}，看详情`
      },
        im ? el('img', { src: thumbOf(im), alt: '', loading: 'lazy', decoding: 'async' }) : el('span', { class: 'top-type', 'aria-hidden': 'true' }, s.local),
        el('span', { class: 'top-rank' }, String(i + 1)),
        el('span', { class: 'top-cap' },
          el('b', null, s.name),
          el('small', null, `${city.name} · ${s.type}`),
          el('span', { class: 'top-desc' }, s.desc)));
    }));
  }

  // 历史：时代色带（从古到今由浅到深）→ 大事记时间轴 → 人物卡
  function historySection(c) {
    const H = c.history;
    const refBtn = (r) => r && r.city && r.spot ? el('button', { type: 'button', class: 'chip ref', onclick: () => openCity(c, r.city, false, r.spot) }, '📍 ' + r.spot) : null;
    const eraDetail = el('div', { class: 'era-detail', 'aria-live': 'polite' });
    const segs = [];
    const pickEra = (e, btn) => {
      segs.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      eraDetail.replaceChildren(
        el('div', { class: 'sd-head' }, el('b', null, e.name), el('span', null, e.years), e.highlight ? el('span', { class: 'pill-s' }, '✦ ', e.highlight) : null),
        el('p', null, e.desc),
        (e.spotRefs || []).length ? el('div', { class: 'day-spots' }, e.spotRefs.map(refBtn)) : null);
    };
    const n = H.eras.length;
    const ribbon = el('div', { class: 'eras', role: 'group', 'aria-label': '历史时代，从古到今' }, H.eras.map((e, i) => {
      const b = el('button', {
        type: 'button', class: 'era', 'aria-pressed': 'false',
        style: { '--o': (0.18 + 0.82 * (n > 1 ? i / (n - 1) : 1)).toFixed(2) },
        title: `${e.name} · ${e.years}`, onclick: () => pickEra(e, b)
      }, el('span', { class: 'era-bar' }), el('b', null, e.name), el('small', null, e.years));
      segs.push(b);
      return b;
    }));
    pickEra(H.eras[n - 1], segs[n - 1]);

    return [
      H.intro ? el('p', { class: 'hist-intro' }, H.intro) : null,
      el('div', { class: 'card chart-card' },
        el('h3', { class: 'card-h' }, '🏯 时代'),
        ribbon,
        eraDetail),
      el('h3', { class: 'sub-h' }, '📜 大事记', el('small', { class: 'count' }, H.events.length)),
      el('ol', { class: 'events' }, H.events.map((ev) => el('li', null,
        fold('event', [
          el('span', { class: 'ev-year' }, ev.year),
          el('span', { class: 'ev-ico', 'aria-hidden': 'true' }, ev.icon || '•'),
          el('span', { class: 't-title' }, ev.title),
          el('span', { class: 'chev', 'aria-hidden': 'true' })
        ], [el('p', null, ev.desc), ev.ref ? el('div', { class: 'day-spots' }, refBtn(ev.ref)) : null])))),
      el('h3', { class: 'sub-h' }, '👤 历史人物', el('small', { class: 'count' }, H.people.length)),
      el('div', { class: 'people' }, H.people.map((p) =>
        fold('person tile', [
          el('span', { class: 'avatar', 'aria-hidden': 'true' }, p.icon || p.name.slice(0, 1)),
          el('span', { class: 'p-main' },
            el('b', null, p.name),
            el('small', null, [p.years, p.role].filter(Boolean).join(' · '))),
          el('span', { class: 'chev', 'aria-hidden': 'true' })
        ], [p.local && p.local !== p.name ? el('p', { class: 'lc', lang: c.lang.code }, p.local) : null, el('p', null, p.desc), p.ref ? el('div', { class: 'day-spots' }, refBtn(p.ref)) : null])))
    ];
  }

  function cityName(c, id) { const x = c.cities.find((k) => k.id === id); return x ? x.name : id; }

  function itineraries(c) {
    let active = c.itineraries[0].id;
    const tabs = el('div', { class: 'tabs', role: 'tablist' });
    const panel = el('div', { role: 'tabpanel' });
    const draw = () => {
      const it = c.itineraries.find((x) => x.id === active);
      tabs.replaceChildren(...c.itineraries.map((x) => el('button', {
        class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(x.id === active),
        onclick: () => { active = x.id; draw(); }
      }, el('b', null, x.title), el('span', null, x.length))));
      // 路线串点：每座城市一个点，旁边写住几天
      const days = {};
      it.plan.forEach((d) => { days[d.city] = (days[d.city] || 0) + 1; });
      panel.replaceChildren(
        el('div', { class: 'itin-head' },
          el('ol', { class: 'stepper' }, it.route.map((id) => el('li', null,
            el('button', { type: 'button', onclick: () => openCity(c, id) },
              el('i', { 'aria-hidden': 'true' }), el('b', null, cityName(c, id)), el('small', null, days[id] ? `${days[id]} 天` : ''))))),
          el('div', { class: 'itin-meta' },
            el('span', { class: 'pill-s' }, '🗓 ', it.length),
            el('span', { class: 'pill-s' }, '👥 ', it.suits)),
          el('p', { class: 'itin-sum' }, it.summary)),
        el('ol', { class: 'timeline' }, it.plan.map((d, i) =>
          el('li', { class: 'day' },
            el('span', { class: 'day-dot', 'aria-hidden': 'true' }, 'D' + (i + 1)),
            el('div', { class: 'card' },
              el('div', { class: 'day-top' },
                el('span', { class: 'day-city' }, cityName(c, d.city)),
                el('h4', null, d.title)),
              el('div', { class: 'day-spots' },
                (d.spots || []).map((name) => el('button', { type: 'button', class: 'chip', onclick: () => openCity(c, d.city, false, name) }, '📍 ' + name)),
                el('button', { type: 'button', class: 'day-more', onclick: () => openCity(c, d.city) }, '全部景点 →')),
              fold('mini', `当天安排 · ${d.items.length} 条`, el('ul', { class: 'steps' }, d.items.map((t) => el('li', null, t)))))))));
    };
    draw();
    return [tabs, panel];
  }

  function flights(c) {
    const f = c.flights;
    const rows = f.routes.map((r) => ({ r, m: minutesOf(r.duration) }));
    const charted = rows.filter((x) => x.m).sort((a, b) => a.m - b.m);
    const china = byId[c.id] && byId[c.id].scope === 'china';
    return [
      el('div', { class: 'card chart-card' },
        el('h3', { class: 'card-h' }, china ? '🚄 从哪儿来要多久' : '✈️ 直飞要多久'),
        charted.length ? barChart(charted.map(({ r, m }) => ({
          label: `${r.from} → ${r.to}`, sub: r.airlines, value: m,
          text: r.duration.replace(/^约\s*/, ''), tip: r.airlines
        }))) : null,
        rows.filter((x) => !x.m).map(({ r }) => el('p', { class: 'meta-line' }, `${r.from} → ${r.to}：${r.duration}（${r.airlines}）`))),
      el('h3', { class: 'sub-h' }, china ? '🚉 车站和机场' : '🛬 主要机场'),
      el('div', { class: 'tiles' }, f.airports.map((a) =>
        tile(null, a.name, [el('span', { class: 'iata' }, a.code), el('span', { class: 't-val' }, a.city)], el('p', null, a.note), 'airport-tile'))),
      fold('callout-fold', [el('span', { class: 't-ico', 'aria-hidden': 'true' }, '💡'), el('span', { class: 't-title' }, china ? '订票小技巧' : '订票小技巧'), el('span', { class: 't-val' }, `${f.tips.length} 条`), el('span', { class: 'chev', 'aria-hidden': 'true' })], bullets(f.tips)),
      el('h3', { class: 'sub-h' }, '🚇 当地交通'),
      el('div', { class: 'tiles' }, c.transport.map((t) =>
        tile(t.icon, t.title, null, [el('p', null, t.desc), t.tip ? el('p', { class: 'stip' }, t.tip) : null])))
    ];
  }

  function cityHead(c, city, Tag, withCredit) {
    const im = imgOf(c, city.img);
    return el('div', { class: 'city-head' + (im ? ' has-img' : '') },
      im ? el('img', { class: 'head-bg', src: withCredit ? im.src : thumbOf(im), alt: im.alt || '', loading: withCredit ? 'eager' : 'lazy', decoding: 'async' }) : null,
      im && withCredit ? credit(im) : null,
      el('span', { class: city.local.length > 3 ? 'big long' : 'big', 'aria-hidden': 'true' }, city.local),
      el('span', { class: 'area' }, city.area),
      el(Tag, null, city.name),
      el('span', { class: 'en' }, city.en),
      wishButton(c, city));
  }

  function cities(c) {
    return el('div', { class: 'cities' }, c.cities.map((city) => {
      const card = el('div', {
        class: 'city', role: 'button', tabindex: '0', style: { '--cc': city.color },
        'aria-label': `${city.name}，查看详情`,
        onclick: () => openCity(c, city.id),
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCity(c, city.id); } }
      },
      cityHead(c, city, 'h3'),
      el('div', { class: 'city-body' },
        el('div', { class: 'tags' }, city.vibe.map((v) => el('span', { class: 'tag' }, v))),
        el('div', { class: 'city-foot' },
          el('span', null, '🗓 ', el('b', null, city.days)),
          el('span', null, '📍 ', el('b', null, city.spots.length), ' 个景点'),
          el('span', { class: 'more' }, '→'))));
      return card;
    }));
  }

  function food(c) {
    return [
      el('div', { class: 'foods' }, c.foodGuide.map((f) =>
        el('div', { class: 'card dish has-img' },
          photo(c, f.img, 'dish-photo', true, true) || el('div', { class: 'dish-photo dish-type', 'aria-hidden': 'true' }, f.local),
          el('div', { class: 'dish-text' },
            el('div', { class: 'dish-top' },
              el('h4', null, f.name),
              el('span', { class: 'lc', lang: c.lang.code }, f.local),
              f.price ? el('span', { class: 'price' }, f.price.replace(/^大约\s*|^约\s*/, '')) : null),
            fold('mini', '吃法和去哪吃', [el('p', null, f.desc), f.where ? el('p', { class: 'meta-line' }, '📍 ', f.where) : null]))))),
      c.dining ? [
        el('h3', { class: 'sub-h' }, `🍽 在${c.name}吃饭要知道的`),
        el('div', { class: 'tiles' }, c.dining.map((d) => tile(d.icon, d.title, null, el('p', null, d.desc))))
      ] : null
    ];
  }

  // 节庆月历：12 个月一格一格，点节日看详情
  function festivals(c) {
    const detail = el('div', { class: 'fest-detail card', 'aria-live': 'polite' });
    const chips = [];
    const show = (f, btn) => {
      chips.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      detail.replaceChildren(
        el('div', { class: 'sd-head' }, el('b', null, f.name), el('span', { lang: c.lang.code }, f.local), el('span', { class: 'pill-s' }, '🗓 ', f.month), el('span', { class: 'pill-s' }, '📍 ', f.city)),
        el('p', null, f.desc),
        f.tip ? el('p', { class: 'stip' }, f.tip) : null);
    };
    const cells = [];
    for (let m = 1; m <= 12; m++) cells.push({ m, items: [] });
    const other = [];
    c.festivals.forEach((f) => {
      const ms = festMonths(f.month);
      if (!ms.length) other.push(f); else ms.forEach((m) => cells[m - 1].items.push(f));
    });
    const nowM = new Date().getMonth() + 1;
    const mk = (f) => { const b = el('button', { type: 'button', class: 'fest-chip', 'aria-pressed': 'false', onclick: () => show(f, b) }, f.name); chips.push(b); return b; };
    const grid = el('div', { class: 'cal' }, cells.map((cell) => {
      cell.btns = cell.items.map(mk);
      return el('div', { class: 'cal-cell' + (cell.items.length ? ' has' : '') + (cell.m === nowM ? ' now' : '') },
        el('span', { class: 'cal-m' }, cell.m + ' 月'), cell.btns);
    }),
      other.length ? el('div', { class: 'cal-cell has wide' }, el('span', { class: 'cal-m' }, '全年 / 其他'), other.map(mk)) : null);
    const upcoming = cells.slice(nowM - 1).concat(cells.slice(0, nowM - 1)).find((x) => x.items.length);
    if (upcoming) show(upcoming.items[0], upcoming.btns[0]);
    return [grid, detail];
  }

  function staysShopping(c) {
    return [
      c.stays ? [
        el('h3', { class: 'sub-h first' }, '🛏 住哪种'),
        el('div', { class: 'foods' }, c.stays.map((s) =>
          el('div', { class: 'card stay has-img' },
            photo(c, s.img, 'stay-photo', true, true) || el('div', { class: 'stay-photo dish-type', 'aria-hidden': 'true' }, s.icon),
            el('div', { class: 'stay-text' },
              el('div', { class: 'dish-top' },
                el('h4', null, s.type),
                el('span', { class: 'lc', lang: c.lang.code }, s.local),
                s.price ? el('span', { class: 'price' }, s.price.replace(/^大约\s*|^约\s*/, '')) : null),
              fold('mini', '适合谁、注意什么', [el('p', null, s.desc), s.tip ? el('p', { class: 'stip' }, s.tip) : null])))))
      ] : null,
      c.shopping ? [
        el('h3', { class: 'sub-h' }, '🛍 买什么'),
        el('div', { class: 'tiles' }, c.shopping.map((s) =>
          tile(s.icon, s.title, null, [el('p', null, s.desc), s.where ? el('p', { class: 'meta-line' }, '📍 ', s.where) : null])))
      ] : null
    ];
  }

  // 相册：所有图片直接铺开，按类型筛选，点开在页内看大图
  function credits(c) {
    const kindOf = (k) => k === 'cover' || k.startsWith('city/') ? '城市' : k.startsWith('food/') ? '美食' : k.startsWith('stay/') ? '住宿' : '景点';
    const all = Object.entries(c.images).map(([k, im]) => ({ ...im, kind: kindOf(k) }));
    const kinds = ['全部', ...['城市', '景点', '美食', '住宿'].filter((k) => all.some((x) => x.kind === k))];
    let kind = '全部';
    const grid = el('div', { class: 'gallery' });
    const draw = () => {
      const list = all.filter((x) => kind === '全部' || x.kind === kind);
      grid.replaceChildren(...list.map((im, i) => el('button', {
        type: 'button', class: 'g-item', onclick: (e) => openLightbox(list, i, e.currentTarget), 'aria-label': `看大图：${im.alt}`
      },
        el('img', { src: thumbOf(im), alt: '', loading: 'lazy', decoding: 'async' }),
        el('span', { class: 'g-cap' }, el('b', null, im.alt), el('small', null, `${im.credit} · ${im.license}`)))));
    };
    const chips = el('div', { class: 'chips' }, kinds.map((k) => el('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(k === kind),
      onclick: (e) => {
        kind = k;
        chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
        draw();
      }
    }, k === '全部' ? `全部 ${all.length}` : `${k} ${all.filter((x) => x.kind === k).length}`)));
    draw();
    return [chips, grid,
      el('p', { class: 'meta-line', style: { 'margin-top': '14px' } }, '图片作者和许可写在每张图下方，大图里可以打开原图页面查看许可全文。')];
  }

  function culture(c) {
    const label = { do: '✓ 要这样', dont: '✕ 别这样', info: 'ℹ 知道一下' };
    const groups = ['do', 'dont', 'info'].map((t) => [t, c.culture.filter((e) => e.type === t)]).filter(([, l]) => l.length);
    return groups.map(([t, list]) => [
      el('h3', { class: 'sub-h etq-h ' + t }, label[t], el('small', null, list.length)),
      el('div', { class: 'tiles' }, list.map((e) => tile(e.icon, e.title, null, el('p', null, e.desc), 'etq ' + e.type)))
    ]);
  }

  function language(c) {
    const L = c.language;
    const code = c.lang.code;
    const learnedKey = 'learned:' + c.id;
    const all = L.phrases.flatMap((g) => g.items.map((it) => ({ ...it, cat: g.cat, icon: g.icon })));
    let cat = '全部';
    let mode = store.get('langmode', 'cards');

    const progress = el('div', { class: 'progress' });
    const drawProgress = () => {
      const got = store.get(learnedKey, []).filter((k) => all.some((p) => p.local === k)).length;
      progress.replaceChildren(
        el('span', { class: 'bar' }, el('i', { style: { width: (got / all.length * 100).toFixed(1) + '%' } })),
        `已学会 ${got} / ${all.length}`);
    };

    const grid = el('div', { class: 'phrases' });
    const drawCards = () => {
      const learned = store.get(learnedKey, []);
      grid.replaceChildren(...all.filter((p) => cat === '全部' || p.cat === cat).map((p) => {
        const gotIt = learned.includes(p.local);
        const card = el('div', {
          class: 'phrase' + (mode === 'list' ? ' list' : ''), tabindex: mode === 'list' ? null : '0',
          role: mode === 'list' ? null : 'button', 'aria-label': mode === 'list' ? null : `${p.zh}，点击翻面`
        });
        const actions = el('div', { class: 'ph-actions' },
          canSpeak ? el('button', {
            type: 'button', onclick: (e) => { e.stopPropagation(); speak(p.local, code); }
          }, '🔊 朗读') : null,
          el('button', {
            type: 'button', class: gotIt ? 'got' : null,
            onclick: (e) => {
              e.stopPropagation();
              const list = store.get(learnedKey, []);
              const i = list.indexOf(p.local);
              if (i >= 0) list.splice(i, 1); else list.push(p.local);
              store.set(learnedKey, list);
              e.currentTarget.classList.toggle('got', i < 0);
              e.currentTarget.textContent = i < 0 ? '✓ 学会了' : '标记学会';
              drawProgress();
            }
          }, gotIt ? '✓ 学会了' : '标记学会'));
        card.append(el('div', { class: 'phrase-inner' },
          el('div', { class: 'face front' },
            el('span', { class: 'cat-ico', 'aria-hidden': 'true' }, p.icon),
            el('div', { class: 'zh' }, p.zh),
            el('div', { class: 'hint' }, gotIt ? '✓ 已学会 · 点击翻面' : '先想想怎么说，再点击翻面')),
          el('div', { class: 'face back' },
            el('div', { class: 'zh' }, p.zh),
            el('div', { class: 'local', lang: code }, p.local),
            el('div', { class: 'roman' }, p.roman),
            p.note ? el('div', { class: 'note' }, p.note) : null,
            actions)));
        if (mode !== 'list') {
          const front = card.querySelector('.face.front'), back = card.querySelector('.face.back');
          back.inert = true;
          const flip = () => {
            card.classList.toggle('flipped');
            const on = card.classList.contains('flipped');
            front.inert = on; back.inert = !on;
            if (card.classList.contains('flipped') && canSpeak && store.get('autospeak', false)) speak(p.local, code);
          };
          card.addEventListener('click', flip);
          card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
        }
        return card;
      }));
    };

    const cats = ['全部', ...L.phrases.map((g) => g.cat)];
    const chips = el('div', { class: 'chips', role: 'group', 'aria-label': '场景' }, cats.map((name) => {
      const g = L.phrases.find((x) => x.cat === name);
      return el('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(name === cat),
        onclick: (e) => {
          cat = name;
          chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
          drawCards();
        }
      }, g ? g.icon + ' ' + name : name);
    }));
    const modeBox = el('div', { class: 'mode', role: 'group', 'aria-label': '显示方式' },
      [['cards', '闪卡'], ['list', '速查']].map(([m, label]) => el('button', {
        type: 'button', 'aria-pressed': String(m === mode),
        onclick: (e) => {
          mode = m; store.set('langmode', m);
          modeBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
          drawCards();
        }
      }, label)));

    drawProgress();
    drawCards();

    return [
      el('div', { class: 'lang-intro' },
        el('div', { class: 'card' },
          el('h3', { style: { 'font-size': '18px', 'margin-bottom': '8px' } }, `怎么学${L.name}`),
          el('p', { style: { 'font-size': '14px' } }, L.intro),
          el('div', { class: 'words' }, L.advantages.map((w) =>
            el('div', { class: 'word' }, el('b', { lang: code }, w.word), el('span', null, w.reading), el('span', null, w.meaning))))),
        el('div', { class: 'card scripts' }, L.scripts.map((s, i) =>
          el('details', { class: 'script', open: i === 0 },
            el('summary', null, s.title, el('small', null, `${s.chars.length} 个`)),
            el('p', null, s.desc, canSpeak ? '（点字母听发音）' : ''),
            el('div', { class: 'kana' }, s.chars.map(([ch, ro]) =>
              el('button', { type: 'button', lang: code, 'aria-label': `${ch} ${ro}`, onclick: () => speak(ch, code) },
                el('b', null, ch), el('small', null, ro)))))))),
      el('div', { class: 'lang-bar' }, chips, progress, modeBox),
      grid,
      (L.numbers || L.vocab) ? el('h3', { class: 'sub-h' }, '数字和常见词') : null,
      (L.numbers || L.vocab) ? el('div', { class: 'lang-extra' },
        L.numbers ? el('div', { class: 'card nums-card' },
          el('h4', null, '数字'),
          el('div', { class: 'nums' }, L.numbers.map((n) =>
            el('button', { type: 'button', onclick: () => speak(n.local, code), 'aria-label': `${n.n} ${n.roman}` },
              el('b', null, n.n), el('span', { lang: code }, n.local), el('small', null, n.roman)))),
          L.priceNote ? el('p', { class: 'meta-line', style: { 'margin-top': '10px' } }, L.priceNote) : null) : null,
        (L.vocab || []).map((g) => el('details', { class: 'card vocab' },
          el('summary', null, el('span', { 'aria-hidden': 'true' }, g.icon), ' ', g.cat, el('small', null, `${g.items.length} 个`)),
          el('ul', null, g.items.map((w) => el('li', null,
            el('button', { type: 'button', class: 'say', 'aria-label': '朗读', onclick: () => speak(w.local, code), hidden: !canSpeak }, '🔊'),
            el('b', { lang: code }, w.local),
            el('span', { class: 'roman' }, w.roman),
            el('span', { class: 'zh' }, w.zh))))))) : null,

      canSpeak ? null : el('p', { class: 'empty', style: { 'margin-top': '10px' } }, '这个浏览器不支持朗读，换 Safari 或 Chrome 试试。')
    ];
  }

  function practical(c) {
    return el('div', { class: 'tiles' }, c.practical.map((p, i) =>
      tile(p.icon, p.title, el('span', { class: 't-val' }, `${p.points.length} 条`), bullets(p.points), i === 0 && /问题|紧急|求助/.test(p.title) ? 'urgent' : '')));
  }

  function checklist(c) {
    const key = 'check:' + c.id;
    const meta = el('div', { class: 'check-meta' });
    const list = el('div', { class: 'checklist' });
    const drawMeta = () => {
      const done = store.get(key, []);
      meta.replaceChildren(
        el('span', null, `已完成 ${done.length} / ${c.checklist.length}`),
        ...(done.length ? [el('button', { class: 'linkbtn', type: 'button', onclick: () => { store.set(key, []); draw(); } }, '清空')] : []));
    };
    const draw = () => {
      const done = store.get(key, []);
      drawMeta();
      list.replaceChildren(...c.checklist.map((t, i) => el('label', { class: 'check' },
        el('input', {
          type: 'checkbox', checked: done.includes(i),
          onchange: (e) => {
            const cur = store.get(key, []).filter((x) => x !== i);
            if (e.target.checked) cur.push(i);
            store.set(key, cur);
            drawMeta();
          }
        }),
        el('span', null, t))));
    };
    draw();
    return [meta, list];
  }

  // ---------- 看大图 ----------
  const lb = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': '看大图' });
  lb.hidden = true;
  document.body.append(lb);
  let lbList = [], lbIdx = 0, lbFocus = null, touchX = null;
  let lbPushed = false;
  function openLightbox(list, i, from) {
    lbList = list; lbIdx = i; lbFocus = from || document.activeElement;
    drawLightbox();
    if (!lbPushed) { history.pushState({ lb: 1 }, '', location.href); lbPushed = true; }
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    syncInert();
    lb.querySelector('.lb-close').focus();
  }
  function drawLightbox() {
    const im = lbList[lbIdx];
    const many = lbList.length > 1;
    lb.replaceChildren(
      el('div', { class: 'lb-backdrop', onclick: closeLightbox }),
      el('figure', { class: 'lb-fig' },
        lbImage(im),
        el('figcaption', null,
          el('b', null, im.alt),
          el('span', null, (many ? `${lbIdx + 1} / ${lbList.length} · ` : '') + `图：${im.credit} · ${im.license} · `,
            el('a', { href: im.source, target: '_blank', rel: 'noopener noreferrer' }, '原图与许可')))),
      el('button', { class: 'lb-close', type: 'button', 'aria-label': '关闭', onclick: closeLightbox }, '✕'),
      ...(many ? [
        el('button', { class: 'lb-nav prev', type: 'button', 'aria-label': '上一张', onclick: () => stepLightbox(-1) }, '‹'),
        el('button', { class: 'lb-nav next', type: 'button', 'aria-label': '下一张', onclick: () => stepLightbox(1) }, '›')
      ] : []));
  }
  // 先放缩略图（已缓存，马上出来），原图下载完再换上
  function lbImage(im) {
    const img = el('img', { src: thumbOf(im), alt: im.alt || '' });
    const full = new Image();
    full.onload = () => { if (img.isConnected) img.src = im.src; };
    full.src = im.src;
    return img;
  }
  function stepLightbox(d) {
    const was = document.activeElement && document.activeElement.classList;
    const keep = was && (was.contains('prev') ? '.lb-nav.prev' : was.contains('next') ? '.lb-nav.next' : '.lb-close');
    lbIdx = (lbIdx + d + lbList.length) % lbList.length;
    drawLightbox();
    const f = lb.querySelector(keep || '.lb-close');
    if (f) f.focus();
  }
  function closeLightbox() {
    if (lb.hidden) return;
    hideLightbox();
    if (lbPushed) { lbPushed = false; history.back(); }
  }
  function hideLightbox() {
    lb.hidden = true;
    document.body.style.overflow = modal.hidden ? '' : 'hidden';
    syncInert();
    if (lbFocus && document.contains(lbFocus)) lbFocus.focus();
  }
  window.addEventListener('popstate', () => {
    if (!lb.hidden && lbPushed) { lbPushed = false; hideLightbox(); }
  });
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX == null || lbList.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
    touchX = null;
  });

  // ---------- 城市详情弹窗 ----------
  let lastFocus = null;
  // 弹窗打开时背景不可操作（inert），焦点只在弹窗里转
  function syncInert() {
    const lbOpen = !lb.hidden, mOpen = !modal.hidden;
    [document.querySelector('.topbar'), app, document.querySelector('.foot')].forEach((n) => { if (n) n.inert = lbOpen || mOpen; });
    modal.inert = lbOpen && mOpen;
  }

  // 自己打开的弹窗记一条历史，手机返回键 / 侧滑能关掉它
  let cityPushed = false;
  function openCity(c, cityId, fromRoute, focusSpot) {
    const city = c.cities.find((x) => x.id === cityId);
    if (!city) return;
    if (!fromRoute) {
      if (cityPushed) history.replaceState(null, '', `#/${c.id}/${city.id}`);
      else { history.pushState(null, '', `#/${c.id}/${city.id}`); cityPushed = true; }
    }
    lastFocus = document.activeElement;

    const types = ['全部', ...new Set(city.spots.map((s) => s.type))];
    let type = '全部';
    const spotList = el('div', { class: 'spot-grid' });
    const drawSpots = () => spotList.replaceChildren(...city.spots.filter((s) => type === '全部' || s.type === type).map((s) =>
      el('div', { class: 'card spot' + (imgOf(c, s.img) ? ' has-img' : ' no-img'), 'data-spot': s.name },
        photo(c, s.img, 'spot-photo', true, true),
        el('div', { class: 'spot-text' },
          el('div', { class: 'spot-top' },
            el('h5', null, s.name),
            el('span', { class: 'type t-' + s.type }, s.type)),
          s.local && s.local !== s.name ? el('span', { class: 'lc', lang: c.lang.code }, s.local) : null,
          fold('mini', '介绍和贴士', [el('p', null, s.desc), s.tip ? el('p', { class: 'stip' }, s.tip) : null])))));
    const filter = el('div', { class: 'chips spot-filter' }, types.map((t) => el('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(t === type),
      onclick: (e) => {
        type = t;
        filter.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
        drawSpots();
      }
    }, t)));
    drawSpots();

    const head = cityHead(c, city, 'h3', true);
    head.querySelector('h3').id = 'modal-title';
    modalCard.style.setProperty('--cc', city.color);
    modalCard.replaceChildren(
      el('button', { class: 'modal-close', type: 'button', 'aria-label': '关闭', onclick: closeCity }, '✕'),
      el('div', { class: 'modal-scroll' },
      el('span', { class: 'grab', 'aria-hidden': 'true' }),
      head,
      el('div', { class: 'm-body' },
        clampText('m-intro', city.intro),
        el('div', { class: 'm-meta' },
          el('div', null, el('b', null, '🗓 建议停留'), city.days),
          el('div', null, el('b', null, '🌤 最佳时间'), city.best),
          fold('mini m-access', '🚆 怎么去', el('p', null, city.access))),
        el('h4', { class: 'sub-h' }, `📍 人文与景点 · ${city.spots.length}`),
        filter,
        spotList,
        el('h4', { class: 'sub-h' }, `🍜 必吃 · ${city.food.length}`),
        el('div', { class: 'tiles' }, city.food.map((f) =>
          tile(null, f.name, el('span', { class: 't-val', lang: c.lang.code }, f.local), el('p', null, f.desc)))),
        el('div', { class: 'tiles', style: { 'margin-top': '18px' } },
          city.history && city.history.length ? tile('📜', '历史上的这里', el('span', { class: 't-val' }, `${city.history.length} 条`),
            el('ol', { class: 'mini-tl' }, city.history.map((h) => el('li', null, el('b', null, h.year), el('span', null, h.text))))) : null,
          tile('🛏', '住在哪', null, el('p', null, city.stay)),
          city.tips && city.tips.length ? tile('💡', '小贴士', el('span', { class: 't-val' }, `${city.tips.length} 条`), bullets(city.tips)) : null))));
    modal.hidden = false;
    modalCard.style.transform = '';
    document.body.style.overflow = 'hidden';
    syncInert();
    const scroller = modalCard.querySelector('.modal-scroll');
    scroller.scrollTop = 0;
    modalCard.querySelector('.modal-close').focus();
    // 从行程点进来的：滚到那个景点并闪一下
    const target = focusSpot && [...spotList.children].find((n) => n.dataset.spot === focusSpot);
    if (target) {
      requestAnimationFrame(() => {
        scroller.scrollTop = target.offsetTop - 70;
        target.classList.add('flash');
        const d = target.querySelector('details'); if (d) d.open = true;
        setTimeout(() => target.classList.remove('flash'), 1600);
      });
    }
  }

  function hideCity() {
    modal.hidden = true;
    document.body.style.overflow = '';
    syncInert();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function closeCity() {
    if (modal.hidden) return;
    hideCity();
    if (cityPushed) { cityPushed = false; history.back(); }
    else if (current) history.replaceState(null, '', '#/' + current);
  }

  // 手机上在弹窗顶部往下拉可以关闭
  let pull = null;
  modalCard.addEventListener('touchstart', (e) => {
    const sc = modalCard.querySelector('.modal-scroll');
    pull = sc && sc.scrollTop <= 0 ? { y: e.touches[0].clientY, dy: 0 } : null;
  }, { passive: true });
  modalCard.addEventListener('touchmove', (e) => {
    if (!pull) return;
    pull.dy = Math.max(0, e.touches[0].clientY - pull.y);
    modalCard.style.transform = pull.dy ? `translateY(${pull.dy}px)` : '';
  }, { passive: true });
  modalCard.addEventListener('touchend', () => {
    if (!pull) return;
    const dy = pull.dy; pull = null;
    modalCard.style.transform = '';
    if (dy > 110) closeCity();
  });

  modal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeCity(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') stepLightbox(1);
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
      return;
    }
    if (e.key === 'Escape') closeCity();
  });

  // ---------- 路由 ----------
  // #/            首页
  // #/japan       国家页
  // #/japan/tokyo 国家页 + 打开城市详情
  function route() {
    if (globe) { globe.destroy(); globe = null; }
    renderToken++;
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const [cid, cityId] = parts;
    if (!lb.hidden) { lb.hidden = true; lbPushed = false; document.body.style.overflow = ''; syncInert(); }
    if (!modal.hidden && !(parts[1] && parts[0] === current)) hideCity();
    if (!parts[1]) cityPushed = false;
    if (!cid || !byId[cid] || byId[cid].status !== 'live') {
      current = null;
      renderHome(cid === 'china' ? 'china' : 'world');
      window.scrollTo(0, 0);
      return;
    }
    loadCountry(cid).then((c) => {
      if (current !== cid || !document.getElementById('sec-overview')) { renderCountry(c); window.scrollTo(0, 0); }
      if (cityId) openCity(c, cityId, true);
    }).catch(() => {
      app.replaceChildren(el('div', { class: 'wrap loading' }, '这个目的地的数据没加载出来，刷新试试。'));
    });
  }

  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
