// 首页地球：d3-geo 正射投影画在 canvas 上。
// 用法：Globe.create(host, { places, origin, selected, onSelect }) → { select(id), setOrigin(o), destroy() }
(function () {
  'use strict';

  // 底图：世界用 countries-110m（topojson，带国家，用来高亮）；区域图用裁好的海岸线 GeoJSON（不含任何边界）
  const WORLD_URL = 'assets/data/countries-110m.json?v=1';
  const cache = {};
  function loadLand(url, retry) {
    if (!cache[url]) {
      cache[url] = fetch(url)
        .then((r) => { if (!r.ok) throw new Error('map ' + r.status); return r.json(); })
        .then((d) => (d.type === 'Topology' ? topojson.feature(d, d.objects.countries).features : d.features))
        .catch((e) => {
          delete cache[url];
          if (retry) return new Promise((res) => setTimeout(res, 2000)).then(() => loadLand(url, false));
          throw e;
        });
    }
    return cache[url];
  }

  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n, d) => (cs.getPropertyValue(n).trim() || d);
    return {
      dark: dark.matches,
      ocean: v('--globe-ocean', '#cfdcdd'), oceanHi: v('--globe-ocean-hi', '#eef3ef'),
      land: v('--globe-land', '#f3ecdc'), border: v('--globe-border', '#c3b597'),
      grat: v('--globe-grat', 'rgba(40,70,90,.09)'), glow: v('--globe-glow', 'rgba(140,170,185,.3)'),
      edge: v('--globe-edge', 'rgba(30,45,60,.26)'), hi: v('--globe-hi', 'rgba(255,255,255,.16)'),
      ink: v('--ink', '#23262c'), paper: v('--paper', '#f5f0e6'), sans: v('--sans', 'sans-serif')
    };
  }

  // 暗色下把国家色往白色混亮，深色海面上才看得清
  function tone(hex, c) {
    if (!c.dark || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16), mix = (x) => Math.round(x + (255 - x) * 0.45);
    return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
  }

  // 多块领土（如法国本土 + 海外省）只保留标记点附近的部分来高亮
  function nearPart(feature, lonlat) {
    if (!feature || feature.geometry.type !== 'MultiPolygon') return feature;
    const polys = feature.geometry.coordinates.filter((poly) =>
      d3.geoDistance(d3.geoCentroid({ type: 'Polygon', coordinates: poly }), lonlat) < 0.5);
    return polys.length ? { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: polys } } : feature;
  }

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const AUTO_SPEED = 0.0036;   // 自转：度 / 毫秒（按时间算，60Hz、120Hz 屏一样快）
  const IDLE_FPS = 30;         // 只有自转和装饰动画时限帧，省电

  function create(host, opts) {
    const places = opts.places;
    const view = opts.view || null;   // { center:[lon,lat], zoom, pan, landUrl }：区域地图，不自转、只能小范围拖动
    let origin = opts.origin;
    const canvas = document.createElement('canvas');
    canvas.className = 'globe-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '可以拖动旋转的地球，标出了已上线和筹备中的目的地；旁边的按钮也可以选择目的地');
    host.append(canvas);
    const ctx = canvas.getContext('2d');
    const back = document.createElement('canvas');   // 不随旋转变化的底图层（光晕 + 海洋）
    const front = document.createElement('canvas');  // 球面明暗层

    const projection = d3.geoOrthographic().clipAngle(90).precision(0.6);
    const path = d3.geoPath(projection, ctx);
    const graticule = d3.geoGraticule10();
    const sphere = { type: 'Sphere' };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, R = 0, dpr = 1;
    let rotation = view ? [-view.center[0], -view.center[1], 0] : [-122, -24, 0];
    let land = null, shapes = {};
    let selected = opts.selected || null;
    let colors = readColors();
    let hits = [];
    let raf = 0, running = false, visible = true, lastFrame = 0, lastDraw = 0;
    let drag = null, velocity = 0, lastInteract = -1e9, idleAfter = 5000, fly = null, planeT0 = 0;

    function paintLayers() {
      const size = Math.round(W * dpr);
      for (const cv of [back, front]) { cv.width = size; cv.height = size; }
      const cx = W / 2, cy = W / 2, c = colors;
      let g = back.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (view) {
        // 区域图：整块画布都是海，四角压暗一点
        const sea = g.createRadialGradient(cx - W * 0.2, cy - W * 0.25, W * 0.05, cx, cy, W * 0.8);
        sea.addColorStop(0, c.oceanHi); sea.addColorStop(1, c.ocean);
        g.fillStyle = sea; g.fillRect(0, 0, W, W);
        g = front.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const vig = g.createRadialGradient(cx, cy, W * 0.35, cx, cy, W * 0.75);
        vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, c.edge);
        g.fillStyle = vig; g.fillRect(0, 0, W, W);
        return;
      }
      const glow = g.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.16);
      glow.addColorStop(0, c.glow); glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, R * 1.16, 0, Math.PI * 2); g.fill();
      const ocean = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
      ocean.addColorStop(0, c.oceanHi); ocean.addColorStop(1, c.ocean);
      g.fillStyle = ocean; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g = front.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const shade = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.15, cx, cy, R);
      shade.addColorStop(0, c.hi); shade.addColorStop(0.65, 'rgba(0,0,0,0)'); shade.addColorStop(1, c.edge);
      g.fillStyle = shade; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    }

    function resize() {
      const w = host.clientWidth;
      if (!w) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(W * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = W + 'px';
      R = W / 2 * 0.84 * (view ? view.zoom : 1);
      projection.translate([W / 2, W / 2]).scale(R);
      paintLayers();
      draw(performance.now());
    }

    function center() { return [-rotation[0], -rotation[1]]; }
    function facing(lonlat, margin = 0.08) { return d3.geoDistance(lonlat, center()) < Math.PI / 2 - margin; }

    // 航线：沿大圆取点，中间抬高，画成拱起来的弧
    function arcPoints(a, b) {
      const interp = d3.geoInterpolate(a, b);
      const lift = Math.min(0.22, 0.06 + d3.geoDistance(a, b) * 0.25);
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, ll = interp(t);
        if (!facing(ll, -0.05)) { pts.push(null); continue; }
        const [x, y] = projection(ll);
        if (view) {
          const [ax, ay] = projection(a), [bx, by] = projection(b);
          pts.push([x, y - Math.hypot(bx - ax, by - ay) * 0.22 * Math.sin(Math.PI * t), t]);
          continue;
        }
        const k = 1 + lift * Math.sin(Math.PI * t);
        pts.push([W / 2 + (x - W / 2) * k, W / 2 + (y - W / 2) * k, t]);
      }
      return pts;
    }
    function strokeArc(pts) {
      ctx.beginPath();
      let pen = false;
      for (const p of pts) {
        if (!p) { pen = false; continue; }
        if (pen) ctx.lineTo(p[0], p[1]); else { ctx.moveTo(p[0], p[1]); pen = true; }
      }
      ctx.stroke();
    }

    function draw(now) {
      if (!W) return;
      lastDraw = now;
      projection.rotate(rotation);
      const c = colors;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(back, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.beginPath(); path(graticule);
      ctx.strokeStyle = c.grat; ctx.lineWidth = 0.6; ctx.stroke();

      if (land) {
        ctx.beginPath(); path(land);
        ctx.fillStyle = c.land; ctx.fill();
        ctx.strokeStyle = c.border; ctx.lineWidth = 0.5; ctx.stroke();
        for (const p of places) {
          const f = shapes[p.id];
          if (!f) continue;
          const col = tone(p.accent, c), live = p.status === 'live', sel = selected === p.id;
          ctx.beginPath(); path(f);
          ctx.globalAlpha = live ? (sel ? 0.95 : 0.78) : (sel ? 0.5 : 0.24);
          ctx.fillStyle = col; ctx.fill();
          ctx.globalAlpha = 1;
          if (live || sel) {
            ctx.strokeStyle = col; ctx.lineWidth = sel ? 1.8 : 1;
            if (!live) ctx.setLineDash([3, 3]);
            ctx.stroke(); ctx.setLineDash([]);
          }
        }
      }

      ctx.drawImage(front, 0, 0, W, W);

      // 航线
      if (origin) {
        ctx.lineCap = 'round';
        for (const p of places) {
          if (p.status !== 'live') continue;
          const pts = arcPoints(origin.lonlat, p.lonlat), sel = selected === p.id;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = reduceMotion ? 0 : -(now / 55) % 10;
          ctx.strokeStyle = tone(p.accent, c); ctx.lineWidth = sel ? 2.2 : 1.4;
          ctx.globalAlpha = selected && !sel ? 0.4 : 0.95;
          strokeArc(pts);
          ctx.setLineDash([]); ctx.globalAlpha = 1;
          // 选中的航线上一架小飞机来回飞
          if (sel && !reduceMotion) {
            const t = ((now - planeT0) / 2600) % 1, i = Math.floor(t * 40);
            const a = pts[i], b = pts[Math.min(40, i + 1)];
            if (a && b) {
              const k = t * 40 - i, x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
              ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
              ctx.font = `15px ${c.sans}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.lineWidth = 3; ctx.strokeStyle = c.paper; ctx.strokeText('✈', 0, 0);
              ctx.fillStyle = tone(p.accent, c); ctx.fillText('✈', 0, 0);
              ctx.restore();
            }
          }
        }
      }

      // 标记点
      hits = [];
      const pulse = reduceMotion ? 0.5 : (now / 1600) % 1;
      const order = places.slice().sort((a, b) =>
        (b.id === selected) - (a.id === selected) || (b.status === 'live') - (a.status === 'live'));
      const taken = [];
      const pts = [];
      for (const p of order) {
        if (!facing(p.lonlat)) continue;
        const [x, y] = projection(p.lonlat);
        if (x < -10 || y < -10 || x > W + 10 || y > W + 10) continue;
        pts.push({ p, x, y });
        hits.push({ p, x, y });
        taken.push({ x: x - 6, y: y - 6, w: 12, h: 12 });
      }
      let ox = 0, oy = 0, showOrigin = origin && facing(origin.lonlat);
      if (showOrigin) { [ox, oy] = projection(origin.lonlat); taken.push({ x: ox - 5, y: oy - 5, w: 10, h: 10 }); }

      for (const { p, x, y } of pts.slice().reverse()) {
        const col = tone(p.accent, c), sel = selected === p.id;
        if (p.status === 'live') {
          if (sel && !reduceMotion) {
            ctx.beginPath(); ctx.arc(x, y, 4 + pulse * 11, 0, Math.PI * 2);
            ctx.globalAlpha = 0.5 * (1 - pulse); ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
          }
          ctx.beginPath(); ctx.arc(x, y, sel ? 5.5 : 4, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = c.paper; ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(x, y, sel ? 5 : 3.4, 0, Math.PI * 2);
          ctx.fillStyle = c.paper; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = col; ctx.stroke();
        }
      }
      if (showOrigin) {
        ctx.beginPath(); ctx.rect(ox - 3.5, oy - 3.5, 7, 7);
        ctx.fillStyle = c.ink; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = c.paper; ctx.stroke();
      }

      // 名字：右 → 左 → 上 → 下依次试，挤了就不画；选中的一定画，出发地最后排
      ctx.font = `600 ${W < 360 ? 11 : 12}px ${c.sans}`;
      ctx.textBaseline = 'middle';
      const overlaps = (r) => taken.some((t) => r.x < t.x + t.w && r.x + r.w > t.x && r.y < t.y + t.h && r.y + r.h > t.y);
      const label = (text, x, y, color, force) => {
        const w = ctx.measureText(text).width, h = 15;
        const cands = [[x + 9, y], [x - 9 - w, y], [x - w / 2, y - 14], [x - w / 2, y + 14]];
        let spot = cands.find(([lx, ly]) => !overlaps({ x: lx - 2, y: ly - h / 2, w: w + 4, h }));
        if (!spot && force) spot = cands[0];
        if (!spot) return;
        const [lx, ly] = spot;
        taken.push({ x: lx - 2, y: ly - h / 2, w: w + 4, h });
        ctx.lineWidth = 3.5; ctx.strokeStyle = c.paper; ctx.lineJoin = 'round';
        ctx.strokeText(text, lx, ly); ctx.fillStyle = color; ctx.fillText(text, lx, ly);
      };
      for (const { p, x, y } of pts) {
        const sel = selected === p.id;
        label(p.name, x, y, p.status === 'live' || sel ? c.ink : tone(p.accent, c), sel);
      }
      if (showOrigin) label(origin.name + '出发', ox, oy, c.ink, false);
    }

    function animating() {
      return !!fly || !!drag || Math.abs(velocity) > 0.01 || !reduceMotion;
    }
    // 区域图只能在中心附近拖动
    function limit(rot) {
      if (!view) return rot;
      const p = view.pan || 15;
      return [clamp(rot[0], -view.center[0] - p, -view.center[0] + p), clamp(rot[1], -view.center[1] - p * 0.7, -view.center[1] + p * 0.7), 0];
    }

    function frame(now) {
      raf = 0;
      const dt = Math.min(64, now - (lastFrame || now));
      lastFrame = now;
      let busy = false;
      if (fly) {
        const t = Math.min(1, (now - fly.t0) / fly.dur), k = ease(t);
        rotation = [fly.from[0] + fly.d0 * k, fly.from[1] + (fly.to[1] - fly.from[1]) * k, 0];
        if (t >= 1) fly = null;
        busy = true;
      } else if (!drag) {
        if (Math.abs(velocity) > 0.01) {
          rotation[0] += velocity * dt / 16.7;
          velocity *= Math.pow(0.94, dt / 16.7);
          rotation = limit(rotation);
          busy = true;
        } else if (!view && !reduceMotion && now - lastInteract > idleAfter) {
          rotation[0] += AUTO_SPEED * dt;
        }
      } else busy = true;
      if (busy || now - lastDraw >= 1000 / IDLE_FPS - 2) draw(now);
      schedule();
    }
    function schedule() {
      if (running && visible && !raf && !document.hidden && animating()) raf = requestAnimationFrame(frame);
    }
    function kick() { lastFrame = 0; schedule(); }

    function flyTo(lonlat) {
      const from = rotation.slice();
      const to = view ? limit([-lonlat[0], -lonlat[1]]) : [-lonlat[0], clamp(-lonlat[1] * 0.85, -55, 55)];
      const d0 = ((to[0] - from[0]) % 360 + 540) % 360 - 180;
      lastInteract = performance.now();
      idleAfter = 12000;   // 选中后多停一会儿再继续自转
      if (reduceMotion) { rotation = [from[0] + d0, to[1], 0]; draw(performance.now()); return; }
      fly = { from, to, d0, t0: performance.now(), dur: 900 + Math.abs(d0) * 4 };
      velocity = 0;
      kick();
    }

    function pick(x, y) {
      let best = null, bd = 18;
      for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h.p; } }
      if (best) return best;
      if (!view && Math.hypot(x - W / 2, y - W / 2) > R) return null;
      const ll = projection.invert([x, y]);
      if (!ll) return null;
      return places.find((p) => shapes[p.id] && d3.geoContains(shapes[p.id], ll)) || null;
    }

    function select(id, { flyTo: doFly = true, notify = true } = {}) {
      const p = places.find((x) => x.id === id);
      if (!p) return;
      selected = id;
      planeT0 = performance.now();
      if (doFly) flyTo(p.lonlat);
      if (notify && opts.onSelect) opts.onSelect(p);
      draw(performance.now());
    }

    // 拖动：横向转经度、纵向转纬度；手机上竖向滑动留给页面滚动（touch-action: pan-y）
    function local(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const [x, y] = local(e);
      drag = { x, y, x0: x, y0: y, rot: rotation.slice(), moved: false, id: e.pointerId };
      fly = null; velocity = 0;
      lastInteract = performance.now(); idleAfter = 5000;
      kick();
    });
    canvas.addEventListener('pointermove', (e) => {
      const [x, y] = local(e);
      if (!drag) {
        if (e.pointerType === 'mouse') canvas.style.cursor = pick(x, y) ? 'pointer' : 'grab';
        return;
      }
      const k = 60 / R;
      if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) > 4) {
        drag.moved = true;
        try { canvas.setPointerCapture(drag.id); } catch (err) { /* 已释放 */ }
        canvas.style.cursor = 'grabbing';
      }
      if (!drag.moved) return;
      velocity = (x - drag.x) * k;
      rotation = limit([drag.rot[0] + (x - drag.x0) * k, clamp(drag.rot[1] - (y - drag.y0) * k, -60, 60), 0]);
      drag.x = x; drag.y = y;
      lastInteract = performance.now();
    });
    const end = (e, cancelled) => {
      if (!drag) return;
      const d = drag; drag = null;
      lastInteract = performance.now();
      canvas.style.cursor = '';
      if (!d.moved && !cancelled) {
        const [x, y] = local(e);
        const p = pick(x, y);
        if (p) select(p.id);
      }
      kick();
    };
    canvas.addEventListener('pointerup', (e) => end(e, false));
    canvas.addEventListener('pointercancel', (e) => { velocity = 0; end(e, true); });
    canvas.addEventListener('pointerleave', () => { if (drag && !drag.moved) drag = null; });

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; kick(); });
    io.observe(canvas);
    const onVis = () => kick();
    document.addEventListener('visibilitychange', onVis);
    const onScheme = () => { colors = readColors(); paintLayers(); draw(performance.now()); };
    dark.addEventListener('change', onScheme);

    resize();
    running = true;
    kick();

    loadLand(view ? view.landUrl : WORLD_URL, true).then((features) => {
      if (!running) return;
      land = { type: 'FeatureCollection', features };
      const byIso = Object.fromEntries(features.map((f) => [String(f.id), f]));
      if (!view) for (const p of places) shapes[p.id] = nearPart(byIso[p.iso], p.lonlat);
      draw(performance.now());
    }).catch(() => { if (running && opts.onError) opts.onError(); });

    return {
      select,
      setOrigin(o) { origin = o; draw(performance.now()); },
      destroy() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        dark.removeEventListener('change', onScheme);
      }
    };
  }

  window.Globe = { create, available: () => !!(window.d3 && d3.geoOrthographic && window.topojson) };
})();
