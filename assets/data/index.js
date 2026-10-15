// 目的地登记表：首页按这里的顺序出卡片。
// iso: ISO 3166 数字代码（地球上高亮国界用，对应 countries-110m.json 的 id）；lonlat: [经度, 纬度]，标记点位置；tz: 时区，首页卡片显示当地时间。
// status: 'live' = 已上线（file 指向数据文件）；'soon' = 筹备中（只出占位卡）。
// 新增国家：写 assets/data/<id>.js（照 japan.js 的结构），在这里把 status 改成 live 并填 file。
window.TRAVEL_INDEX = [
  { id: 'japan', tz: 'Asia/Tokyo', iso: '392', lonlat: [138.5, 36.5], name: '日本', nameLocal: '日本', nameEn: 'Japan', code: 'JP', region: '东亚', status: 'live', file: 'assets/data/japan.js', accent: '#b8321f' },
  { id: 'korea', tz: 'Asia/Seoul', iso: '410', lonlat: [127.8, 36.4], name: '韩国', nameLocal: '대한민국', nameEn: 'South Korea', code: 'KR', region: '东亚', status: 'live', file: 'assets/data/korea.js', accent: '#0f4c81' },
  { id: 'thailand', tz: 'Asia/Bangkok', iso: '764', lonlat: [100.4, 15.2], name: '泰国', nameLocal: 'ประเทศไทย', nameEn: 'Thailand', code: 'TH', region: '东南亚', status: 'soon', accent: '#7a3e9d' },
  { id: 'singapore', tz: 'Asia/Singapore', iso: '702', lonlat: [103.82, 1.35], name: '新加坡', nameLocal: 'Singapura', nameEn: 'Singapore', code: 'SG', region: '东南亚', status: 'soon', accent: '#c8102e' },
  { id: 'vietnam', tz: 'Asia/Ho_Chi_Minh', iso: '704', lonlat: [108.0, 16.2], name: '越南', nameLocal: 'Việt Nam', nameEn: 'Vietnam', code: 'VN', region: '东南亚', status: 'soon', accent: '#b5651d' },
  { id: 'france', tz: 'Europe/Paris', iso: '250', lonlat: [2.3, 46.6], name: '法国', nameLocal: 'France', nameEn: 'France', code: 'FR', region: '欧洲', status: 'soon', accent: '#2b4c8c' },
  { id: 'italy', tz: 'Europe/Rome', iso: '380', lonlat: [12.6, 42.8], name: '意大利', nameLocal: 'Italia', nameEn: 'Italy', code: 'IT', region: '欧洲', status: 'soon', accent: '#2f6b3f' },
  { id: 'australia', tz: 'Australia/Sydney', iso: '036', lonlat: [134.0, -25.5], name: '澳大利亚', nameLocal: 'Australia', nameEn: 'Australia', code: 'AU', region: '大洋洲', status: 'soon', accent: '#c26a1b' }
];
