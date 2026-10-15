// 数据自检：node tools_validate.js
// 新增或修改国家数据后跑一遍，检查必填字段、id 重复、行程引用的城市是否存在。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, TRAVEL: null };
ctx.TRAVEL = { countries: {}, register(d) { this.countries[d.id] = d; } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'assets/data/index.js'), 'utf8'), ctx);
const index = ctx.window.TRAVEL_INDEX;

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const need = (obj, keys, where) => keys.forEach((k) => {
  const v = obj[k];
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) err(where, `缺少 ${k}`);
});
const SPOT_TYPES = ['人文', '自然', '美食', '购物', '体验', '夜景'];
const CULTURE_TYPES = ['do', 'dont', 'info'];

const ids = new Set();
for (const meta of index) {
  if (ids.has(meta.id)) err('index', `id 重复：${meta.id}`);
  ids.add(meta.id);
  need(meta, ['id', 'name', 'nameLocal', 'nameEn', 'code', 'region', 'status', 'accent'], `index/${meta.id}`);
  if (meta.status !== 'live') continue;
  const file = path.join(__dirname, meta.file || '');
  if (!meta.file || !fs.existsSync(file)) { err(meta.id, `数据文件不存在：${meta.file}`); continue; }
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: meta.file });
  const c = ctx.TRAVEL.countries[meta.id];
  if (!c) { err(meta.id, '数据文件没有 register 这个 id'); continue; }

  need(c, ['name', 'nameLocal', 'nameEn', 'tagline', 'intro', 'lang', 'theme', 'facts', 'seasons', 'visa', 'budget',
    'flights', 'transport', 'cities', 'itineraries', 'culture', 'language', 'practical', 'checklist'], c.id);

  const cityIds = new Set();
  (c.cities || []).forEach((city, i) => {
    const w = `${c.id}/cities[${i}]`;
    need(city, ['id', 'name', 'local', 'en', 'area', 'color', 'days', 'best', 'vibe', 'intro', 'access', 'spots', 'food', 'stay'], w);
    if (cityIds.has(city.id)) err(w, `城市 id 重复：${city.id}`);
    cityIds.add(city.id);
    (city.spots || []).forEach((s, j) => {
      need(s, ['name', 'local', 'type', 'desc'], `${w}/spots[${j}]`);
      if (!SPOT_TYPES.includes(s.type)) err(`${w}/spots[${j}]`, `type 必须是 ${SPOT_TYPES.join('/')}，现在是 ${s.type}`);
    });
  });

  (c.itineraries || []).forEach((it, i) => {
    const w = `${c.id}/itineraries[${i}]`;
    need(it, ['id', 'title', 'length', 'summary', 'suits', 'route', 'plan'], w);
    (it.route || []).forEach((id) => { if (!cityIds.has(id)) err(w, `route 引用了不存在的城市 ${id}`); });
    (it.plan || []).forEach((d, j) => {
      if (!cityIds.has(d.city)) err(`${w}/plan[${j}]`, `city 不存在：${d.city}`);
      need(d, ['title', 'items'], `${w}/plan[${j}]`);
    });
  });

  (c.culture || []).forEach((e, i) => { if (!CULTURE_TYPES.includes(e.type)) err(`${c.id}/culture[${i}]`, `type 必须是 ${CULTURE_TYPES.join('/')}`); });

  const L = c.language || {};
  need(L, ['name', 'intro', 'advantages', 'scripts', 'phrases'], `${c.id}/language`);
  const seen = new Set();
  (L.phrases || []).forEach((g) => g.items.forEach((p) => {
    need(p, ['zh', 'local', 'roman'], `${c.id}/language/${g.cat}`);
    if (seen.has(p.local)) err(`${c.id}/language/${g.cat}`, `句子重复：${p.local}`);
    seen.add(p.local);
  }));

  // 图片：引用的 key 要在 images 里，文件要存在，许可只收 PD / CC0 / CC BY / CC BY-SA
  const imgs = c.images || {};
  const OK_LICENSE = /^(public domain|pd|cc0|cc by(-sa)? [\d.]+|cc by(-sa)?)/i;
  Object.entries(imgs).forEach(([k, im]) => {
    need(im, ['src', 'alt', 'credit', 'license', 'source'], `${c.id}/images/${k}`);
    if (im.src && !fs.existsSync(path.join(__dirname, im.src))) err(`${c.id}/images/${k}`, `文件不存在：${im.src}`);
    if (im.license && (!OK_LICENSE.test(im.license) || /nc|nd/i.test(im.license.replace(/^cc by(-sa)?/i, '')))) err(`${c.id}/images/${k}`, `许可不在白名单：${im.license}`);
  });
  const refs = [];
  (c.cities || []).forEach((city) => { refs.push([city.img, `cities/${city.id}`]); (city.spots || []).forEach((s) => refs.push([s.img, `cities/${city.id}/${s.name}`])); });
  (c.foodGuide || []).forEach((f) => refs.push([f.img, `foodGuide/${f.name}`]));
  (c.stays || []).forEach((f) => refs.push([f.img, `stays/${f.type}`]));
  refs.forEach(([k, w]) => { if (k && !imgs[k]) err(`${c.id}/${w}`, `img 引用了不存在的图片 ${k}`); });
  (c.festivals || []).forEach((f, i) => need(f, ['name', 'month', 'city', 'desc'], `${c.id}/festivals[${i}]`));
  (c.foodGuide || []).forEach((f, i) => need(f, ['name', 'local', 'desc'], `${c.id}/foodGuide[${i}]`));

  const nCities = (c.cities || []).length;
  const nSpots = (c.cities || []).reduce((n, x) => n + (x.spots || []).length, 0);
  const nPhrases = (L.phrases || []).reduce((n, g) => n + g.items.length, 0);
  console.log(`✓ ${c.name}：${nCities} 城市 / ${nSpots} 景点 / ${(c.itineraries || []).length} 行程 / ${nPhrases} 句 / ${Object.keys(imgs).length} 图`);
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} 个问题：`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log('\n全部通过');
