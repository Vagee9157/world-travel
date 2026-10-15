(function () {
  'use strict';

  // ---------- 数据登记 ----------
  // 各国数据文件调用 TRAVEL.register({...})，按需懒加载。
  const TRAVEL = window.TRAVEL = window.TRAVEL || { countries: {} };
  TRAVEL.register = function (data) { TRAVEL.countries[data.id] = data; };
  const INDEX = window.TRAVEL_INDEX || [];
  const byId = Object.fromEntries(INDEX.map((c) => [c.id, c]));

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

  function loadCountry(id) {
    if (TRAVEL.countries[id]) return Promise.resolve(TRAVEL.countries[id]);
    const meta = byId[id];
    if (!meta || meta.status !== 'live' || !meta.file) return Promise.reject(new Error('unknown country'));
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = meta.file + '?v=5';
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
    const prefix = lang.slice(0, 2);
    const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(prefix));
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
  function renderTopnav(active) {
    topnav.replaceChildren(
      el('a', { href: '#/', 'aria-current': active ? null : 'page' }, '全部目的地'),
      ...INDEX.filter((c) => c.status === 'live').map((c) =>
        el('a', { href: '#/' + c.id, 'aria-current': active === c.id ? 'page' : null }, c.name))
    );
  }

  // ---------- 首页 ----------
  let homeRegion = '全部';
  // 出发城市（地球上的航线起点，和各国「航班交通」里的出发地对应）
  const ORIGINS = [
    { name: '北京', lonlat: [116.4, 39.9] }, { name: '上海', lonlat: [121.47, 31.23] },
    { name: '广州', lonlat: [113.26, 23.13] }, { name: '深圳', lonlat: [114.06, 22.54] },
    { name: '成都', lonlat: [104.07, 30.57] }, { name: '香港', lonlat: [114.17, 22.32] }
  ];
  let globe = null;
  let renderToken = 0;

  function renderHome() {
    const token = ++renderToken;
    document.title = '环游世界 · 旅行卡片';
    setTheme(null);
    renderTopnav(null);
    const live = INDEX.filter((c) => c.status === 'live');
    app.replaceChildren(el('div', { class: 'loading' }, '正在展开地图…'));
    Promise.all(live.map((c) => loadCountry(c.id).catch(() => null))).then(() => {
      if (token !== renderToken) return;
      const loaded = live.map((c) => TRAVEL.countries[c.id]).filter(Boolean);
      const sum = (fn) => loaded.reduce((n, c) => n + fn(c), 0);
      const regions = ['全部', ...new Set(INDEX.map((c) => c.region))];

      const grid = el('div', { class: 'postcards' });
      const drawGrid = () => {
        grid.replaceChildren(...INDEX.filter((c) => homeRegion === '全部' || c.region === homeRegion).map(postcard));
      };
      const chips = el('div', { class: 'chips', role: 'group', 'aria-label': '按地区筛选' },
        regions.map((r) => el('button', {
          class: 'chip', type: 'button', 'aria-pressed': String(r === homeRegion),
          onclick: (e) => {
            homeRegion = r;
            chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
            drawGrid();
          }
        }, r)));
      drawGrid();

      // ---- 地球 + 选中目的地卡片
      let origin = ORIGINS.find((o) => o.name === store.get('origin', '上海')) || ORIGINS[1];
      let selId = store.get('globeSel', 'japan');
      if (!byId[selId]) selId = live[0] ? live[0].id : INDEX[0].id;
      const cardHost = el('div', { class: 'dest-host', 'aria-live': 'polite' });
      const pills = el('div', { class: 'dest-pills', role: 'group', 'aria-label': '选择目的地' });
      const showCard = (id) => {
        selId = id;
        store.set('globeSel', id);
        cardHost.replaceChildren(destCard(byId[id], origin));
        pills.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
      };
      pills.append(...INDEX.map((m) => el('button', {
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
        el('section', { class: 'wrap home-hero globe-hero' + (hasGlobe ? '' : ' no-globe') },
          el('div', { class: 'gh-intro' },
            el('div', { class: 'eyebrow' }, 'Around the World · 旅行卡片集'),
            el('h1', null, '转动地球，', el('em', null, '挑下一站')),
            el('p', { class: 'lede' }, '每个国家整理成一套卡片：怎么排行程、怎么飞、去哪些城市、看哪些人文景点、当地有什么讲究，再学几句能用上的当地话。先从日本和韩国开始，后面一个个点亮。'),
            el('label', { class: 'origin' }, '从 ', originSel, ' 出发')),
          hasGlobe ? el('div', { class: 'gh-globe' },
            globeHost,
            el('p', { class: 'globe-hint' }, '拖动旋转 · 点国家看看')) : null,
          el('div', { class: 'gh-card' },
            pills,
            cardHost,
            el('div', { class: 'stats' },
              stat(loaded.length, '个国家已上线'),
              stat(sum((c) => c.cities.length), '座城市'),
              stat(sum((c) => c.itineraries.length), '条行程'),
              stat(sum((c) => c.language.phrases.reduce((n, g) => n + g.items.length, 0)), '句旅行用语')))),
        el('section', { class: 'wrap' }, el('h2', { class: 'home-h2' }, '全部目的地'), chips, grid),
        wishStrip()
      );

      if (hasGlobe) {
        globe = Globe.create(globeHost, {
          places: INDEX, origin, selected: selId,
          onSelect: (p) => showCard(p.id),
          onError: () => { const h = app.querySelector('.globe-hint'); if (h) h.textContent = '世界地图没加载出来，用目的地按钮也能选'; }
        });
        globe.select(selId);
      } else {
        showCard(selId);
      }
    });
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
    const best = c.seasons.filter((x) => x.rating >= 5).map((x) => x.name).join('、');
    return el('a', { class: 'dest-card live' + (cover ? ' has-img' : ''), href: '#/' + meta.id, style: { '--pc': meta.accent } },
      cover ? el('img', { class: 'dc-img', src: thumbOf(cover), alt: '', decoding: 'async' }) : el('div', { class: 'dc-img dc-type', 'aria-hidden': 'true' }, meta.nameLocal),
      el('div', { class: 'dc-body' },
        el('div', { class: 'dc-top' }, el('span', { class: 'dc-local' }, meta.nameLocal), el('span', { class: 'dc-tag' }, '已上线')),
        el('h3', null, meta.name, el('small', null, meta.nameEn)),
        el('p', null, c.tagline),
        el('ul', { class: 'dc-facts' },
          el('li', null, '✈ ', route ? `${origin.name}直飞${route.to}${route.duration}` : `从${origin.name}出发：看攻略里的「航班交通」`),
          el('li', null, `${c.cities.length} 座城市 · ${c.itineraries.length} 条行程`),
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

  function wishStrip() {
    const items = store.get('wish', []).map((k) => {
      const [cid, cityId] = k.split('/');
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
    document.title = `${c.name}旅行卡片 · 环游世界`;
    setTheme(c.theme);
    renderTopnav(c.id);

    // 章节按数据有无决定是否出现，编号自动排
    const secs = [
      ['overview', '速览', '什么时候去、要准备什么、大概花多少钱', overview],
      ['itinerary', '行程', '照着走就行的路线，点城市名看详情', itineraries],
      ['flights', '航班交通', '从国内怎么飞，落地后怎么走', flights],
      ['cities', '城市', '点卡片看景点、美食和住哪', cities],
      c.foodGuide && ['food', '美食', '必吃清单和吃饭的规矩', food],
      c.festivals && ['festivals', '节庆', '一年里的祭典和季节活动', festivals],
      (c.stays || c.shopping) && ['stay', '住宿购物', '住哪种、买什么、怎么免税', staysShopping],
      ['culture', '人文礼仪', '入乡随俗，少踩坑', culture],
      ['language', '语言', `${c.language.name}速成：认字母、学句子、听发音`, language],
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
            el('a', { class: 'back', href: '#/' }, '← 全部目的地'),
            el('h1', null, c.name, el('span', { class: 'en' }, c.nameEn)),
            el('p', { class: 'tagline' }, c.tagline),
            el('p', { class: 'intro' }, c.intro),
            c.notice ? el('div', { class: 'notice', role: 'note' },
              el('div', { class: 'notice-top' }, el('b', null, c.notice.title), c.notice.updated ? el('span', null, '更新于 ' + c.notice.updated) : null),
              el('ul', { class: 'dots' }, c.notice.points.map((t) => el('li', null, t)))) : null),
          cover ? photo(c, 'cover', 'hero-photo') : null)),
      subnav,
      el('div', { class: 'wrap' }, panels)
    );
    let start = store.get(tabKey, 'overview');
    if (!secs.some((x) => x[0] === start)) start = 'overview';
    showTab(start, false);
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
    return [
      el('div', { class: 'grid g-facts' }, c.facts.map((f) =>
        el('div', { class: 'card fact' },
          el('span', { class: 'ico', 'aria-hidden': 'true' }, f.icon),
          el('div', null, el('div', { class: 'k' }, f.label), el('div', { class: 'v' }, f.value))))),
      el('h3', { class: 'sub-h' }, '四季怎么选'),
      el('div', { class: 'grid g-3' }, c.seasons.map((s) =>
        el('div', { class: 'card season' },
          el('div', { class: 'rating', title: `推荐度 ${s.rating}/5`, 'aria-label': `推荐度 ${s.rating}/5` },
            [1, 2, 3, 4, 5].map((i) => el('i', { class: i <= s.rating ? 'on' : null }))),
          el('div', { class: 's-name' }, s.name),
          el('div', { class: 's-months' }, s.months),
          el('p', null, s.desc),
          el('div', { class: 'tags' }, s.highlights.map((h) => el('span', { class: 'tag' }, h)))))),
      el('div', { class: 'grid g-2', style: { 'margin-top': '14px' } },
        el('div', { class: 'card callout' },
          el('h3', null, c.visa.title),
          el('ul', { class: 'dots' }, c.visa.points.map((p) => el('li', null, p)))),
        el('div', { class: 'card' },
          el('h3', { style: { 'font-size': '18px', 'margin-bottom': '4px' } }, '每天花多少'),
          el('p', { class: 'meta-line', style: { 'margin-bottom': '10px' } }, c.budgetNote || '人民币，不含机票'),
          el('div', { class: 'grid', style: { gap: '12px' } }, c.budget.map((b) =>
            el('div', { class: 'budget' },
              el('div', { class: 'lv' }, b.level),
              el('div', { class: 'pd' }, b.perDay),
              el('p', null, b.desc))))))
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
      const route = [];
      it.route.forEach((id, i) => {
        if (i) route.push(el('span', { class: 'arr', 'aria-hidden': 'true' }, '→'));
        route.push(el('button', { class: 'stop', type: 'button', onclick: () => openCity(c, id) }, cityName(c, id)));
      });
      panel.replaceChildren(
        el('div', { class: 'itin-head' },
          el('p', null, it.summary),
          el('div', { class: 'route-line' }, route),
          el('div', { class: 'suits' }, '适合：', it.suits)),
        el('ol', { class: 'timeline' }, it.plan.map((d, i) =>
          el('li', { class: 'day' },
            el('span', { class: 'day-dot', 'aria-hidden': 'true' }, 'D' + (i + 1)),
            el('div', { class: 'card' },
              el('div', { class: 'day-top' },
                el('span', { class: 'day-city' }, `第 ${i + 1} 天 · ${cityName(c, d.city)}`),
                el('h4', null, d.title)),
              el('ul', null, d.items.map((t) => el('li', null, t))),
              el('div', { class: 'day-spots' },
                d.spots && d.spots.length ? el('span', null, '当天景点') : null,
                (d.spots || []).map((name) => el('button', { type: 'button', class: 'chip', onclick: () => openCity(c, d.city, false, name) }, name)),
                el('button', { type: 'button', class: 'day-more', onclick: () => openCity(c, d.city) }, `${cityName(c, d.city)}全部景点 →`)))))));
    };
    draw();
    return [tabs, panel];
  }

  function flights(c) {
    const f = c.flights;
    return [
      el('div', { class: 'grid g-3' }, f.routes.map((r) =>
        el('div', { class: 'card flight' },
          el('div', { class: 'end' }, r.from),
          el('div', { class: 'mid' }, el('span', { class: 'plane', 'aria-hidden': 'true' }), r.duration),
          el('div', { class: 'end to' }, r.to),
          el('div', { class: 'air' }, r.airlines)))),
      el('h3', { class: 'sub-h' }, '主要机场'),
      el('div', { class: 'grid g-2' }, f.airports.map((a) =>
        el('div', { class: 'card airport' },
          el('span', { class: 'iata' }, a.code),
          el('div', null, el('h4', null, a.name, el('small', null, a.city)), el('p', null, a.note))))),
      el('div', { class: 'card tipbox', style: { 'margin-top': '14px' } },
        el('h3', null, '订票小技巧'),
        el('ul', { class: 'dots' }, f.tips.map((t) => el('li', null, t)))),
      el('h3', { class: 'sub-h' }, '当地交通'),
      el('div', { class: 'grid g-2' }, c.transport.map((t) =>
        el('div', { class: 'card transport' },
          el('div', { class: 't-ico', 'aria-hidden': 'true' }, t.icon),
          el('h4', null, t.title),
          el('p', null, t.desc),
          t.tip ? el('div', { class: 'tip' }, t.tip) : null)))
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
        el('p', null, city.intro),
        el('div', { class: 'city-foot' },
          el('span', null, '建议 ', el('b', null, city.days)),
          el('span', { class: 'more' }, `${city.spots.length} 个景点 →`))));
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
              el('span', { class: 'lc', lang: c.lang.code }, f.local)),
            el('p', null, f.desc),
            f.where ? el('p', { class: 'meta-line' }, el('b', null, '去哪吃 '), f.where) : null,
            f.price ? el('p', { class: 'meta-line' }, el('b', null, '人均 '), f.price) : null)))),
      c.dining ? [
        el('h3', { class: 'sub-h' }, '在日本吃饭要知道的'),
        el('div', { class: 'grid g-3' }, c.dining.map((d) =>
          el('div', { class: 'card tipcard' },
            el('div', { class: 'e-ico', 'aria-hidden': 'true' }, d.icon),
            el('h4', null, d.title),
            el('p', null, d.desc))))
      ] : null
    ];
  }

  function festivals(c) {
    return el('div', { class: 'fests' }, c.festivals.map((f) =>
      el('div', { class: 'card fest' },
        el('div', { class: 'fest-month' }, f.month),
        el('h4', null, f.name, el('small', { lang: c.lang.code }, f.local)),
        el('div', { class: 'fest-city' }, f.city),
        el('p', null, f.desc),
        f.tip ? el('p', { class: 'stip' }, f.tip) : null)));
  }

  function staysShopping(c) {
    return [
      c.stays ? [
        el('h3', { class: 'sub-h first' }, '住哪种'),
        el('div', { class: 'grid g-3' }, c.stays.map((s) =>
          el('div', { class: 'card stay has-img' },
            photo(c, s.img, 'stay-photo', true, true) || el('div', { class: 'stay-photo dish-type', 'aria-hidden': 'true' }, s.local),
            el('div', { class: 'stay-text' },
              el('div', { class: 'stay-top' },
                el('span', { class: 'e-ico', 'aria-hidden': 'true' }, s.icon),
                el('h4', null, s.type, el('small', { lang: c.lang.code }, s.local))),
              el('p', null, s.desc),
              s.price ? el('p', { class: 'meta-line' }, el('b', null, '每晚 '), s.price) : null,
              s.tip ? el('p', { class: 'stip' }, s.tip) : null))))
      ] : null,
      c.shopping ? [
        el('h3', { class: 'sub-h' }, '买什么'),
        el('div', { class: 'grid g-3' }, c.shopping.map((s) =>
          el('div', { class: 'card tipcard' },
            el('div', { class: 'e-ico', 'aria-hidden': 'true' }, s.icon),
            el('h4', null, s.title),
            el('p', null, s.desc),
            s.where ? el('p', { class: 'meta-line' }, el('b', null, '去哪买 '), s.where) : null)))
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
    const label = { do: '要这样', dont: '别这样', info: '知道一下' };
    return el('div', { class: 'grid g-3' }, c.culture.map((e) =>
      el('div', { class: 'card etq ' + e.type },
        el('span', { class: 'badge' }, label[e.type] || ''),
        el('div', { class: 'e-ico', 'aria-hidden': 'true' }, e.icon),
        el('h4', null, e.title),
        el('p', null, e.desc))));
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
    return el('div', { class: 'grid g-2' }, c.practical.map((p) =>
      el('div', { class: 'card prac' },
        el('div', { class: 'p-ico', 'aria-hidden': 'true' }, p.icon),
        el('h4', null, p.title),
        el('ul', { class: 'dots' }, p.points.map((t) => el('li', null, t))))));
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
    const spotList = el('div', { class: 'grid' });
    const drawSpots = () => spotList.replaceChildren(...city.spots.filter((s) => type === '全部' || s.type === type).map((s) =>
      el('div', { class: 'card spot' + (imgOf(c, s.img) ? ' has-img' : ''), 'data-spot': s.name },
        photo(c, s.img, 'spot-photo', true, true),
        el('div', { class: 'spot-text' },
          el('div', { class: 'spot-top' },
            el('h5', null, s.name),
            el('span', { class: 'lc', lang: c.lang.code }, s.local),
            el('span', { class: 'type t-' + s.type }, s.type)),
          el('p', null, s.desc),
          s.tip ? el('p', { class: 'stip' }, s.tip) : null))));
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
        el('p', null, city.intro),
        el('div', { class: 'm-meta' },
          el('div', null, el('b', null, '建议停留'), city.days),
          el('div', null, el('b', null, '最佳时间'), city.best),
          el('div', null, el('b', null, '怎么去'), city.access)),
        el('h4', { class: 'sub-h' }, `人文与景点 · ${city.spots.length}`),
        filter,
        spotList,
        el('h4', { class: 'sub-h' }, '必吃'),
        el('div', { class: 'food' }, city.food.map((f) =>
          el('div', { class: 'card' }, el('b', null, f.name), el('small', { lang: c.lang.code }, f.local), el('p', null, f.desc)))),
        el('h4', { class: 'sub-h' }, '住在哪'),
        el('p', null, city.stay),
        city.tips && city.tips.length ? [
          el('h4', { class: 'sub-h' }, '小贴士'),
          el('ul', { class: 'dots' }, city.tips.map((t) => el('li', null, t)))
        ] : null)));
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
      renderHome();
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
