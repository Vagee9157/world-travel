// 目的地登记表：首页按这里的顺序出卡片。
// status: 'live' = 已上线（file 指向数据文件）；'soon' = 筹备中（只出占位卡）。
// 新增国家：写 assets/data/<id>.js（照 japan.js 的结构），在这里把 status 改成 live 并填 file。
window.TRAVEL_INDEX = [
  { id: 'japan', name: '日本', nameLocal: '日本', nameEn: 'Japan', code: 'JP', region: '东亚', status: 'live', file: 'assets/data/japan.js', accent: '#b8321f' },
  { id: 'korea', name: '韩国', nameLocal: '대한민국', nameEn: 'South Korea', code: 'KR', region: '东亚', status: 'live', file: 'assets/data/korea.js', accent: '#0f4c81' },
  { id: 'thailand', name: '泰国', nameLocal: 'ประเทศไทย', nameEn: 'Thailand', code: 'TH', region: '东南亚', status: 'soon', accent: '#7a3e9d' },
  { id: 'singapore', name: '新加坡', nameLocal: 'Singapura', nameEn: 'Singapore', code: 'SG', region: '东南亚', status: 'soon', accent: '#c8102e' },
  { id: 'vietnam', name: '越南', nameLocal: 'Việt Nam', nameEn: 'Vietnam', code: 'VN', region: '东南亚', status: 'soon', accent: '#b5651d' },
  { id: 'france', name: '法国', nameLocal: 'France', nameEn: 'France', code: 'FR', region: '欧洲', status: 'soon', accent: '#2b4c8c' },
  { id: 'italy', name: '意大利', nameLocal: 'Italia', nameEn: 'Italy', code: 'IT', region: '欧洲', status: 'soon', accent: '#2f6b3f' },
  { id: 'australia', name: '澳大利亚', nameLocal: 'Australia', nameEn: 'Australia', code: 'AU', region: '大洋洲', status: 'soon', accent: '#c26a1b' }
];
