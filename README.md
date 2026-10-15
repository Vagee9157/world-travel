# 环游世界 · 旅行卡片

一张卡片一个目的地：行程、航班、热门城市、人文景点、当地礼仪，再学几句当地话。纯前端，手机电脑都能用，联网打开过一次就能离线看。

**在线地址** → https://vagee9157.github.io/world-travel/

## 已上线

| 目的地 | 城市 | 行程 | 语言 |
|---|---|---|---|
| 🇯🇵 日本 | 东京、京都、大阪、奈良、富士山·箱根、札幌·小樽、冲绳 | 初访经典 7 天（东京进大阪出）/ 关西深度 5 天 / 北海道冬日 5 天 | 日语：平假名、片假名、35 句 |
| 🇰🇷 韩国 | 首尔、釜山、济州岛、庆州、全州 | 首尔经典 5 天 / 首尔 + 釜山 7 天 / 济州免签 4 天 | 韩语：韩文字母、35 句 |

筹备中：泰国、新加坡、越南、法国、意大利、澳大利亚。

## 每个目的地有什么

| 板块 | 内容 |
|---|---|
| 速览 | 时差、货币、电源、紧急电话等关键信息；四季推荐度；签证入境；每日预算三档 |
| 行程 | 多条可直接照走的路线，按天排成时间线，点城市名看详情 |
| 航班交通 | 国内主要城市直飞时长和航司、主要机场怎么进城、订票技巧、当地交通 |
| 城市 | 城市卡片，点开看人文与景点（按类型筛选）、必吃、住哪、小贴士；♥ 收藏到首页「我想去的城市」 |
| 人文礼仪 | 要这样 / 别这样 / 知道一下 |
| 语言 | 学习思路、和中文相通的词、字母表（点字母听发音）、分场景旅行用语：闪卡模式翻面自测、速查模式直接看；浏览器朗读；标记学会、看进度 |
| 实用信息 | 必装 App、付钱、退税、上网 |
| 出发清单 | 可勾选，进度存在本机 |

收藏、学习进度、清单勾选都只存在本机浏览器（localStorage），不上传。

## 新增一个国家

1. 复制 `assets/data/japan.js` 为 `assets/data/<id>.js`，改内容（结构见下）。
2. 在 `assets/data/index.js` 里把对应条目的 `status` 改成 `'live'`，填上 `file`；没有的话加一条。
3. 跑自检：`node tools_validate.js`。
4. 在 `sw.js` 的 `CORE` 里加上新文件，并把 `CACHE` 版本号 +1。

数据结构（字段都是必填，除非标了可选）：

```
id / name / nameLocal / nameEn / code / region / tagline / intro
theme: { accent, accent2 }          主题色
lang: { code: 'ja-JP', name }       朗读用的语言代码
facts[]: { icon, label, value }
seasons[]: { name, months, rating(1-5), desc, highlights[] }
visa: { title, points[] }
budget[]: { level, perDay, desc }
flights: { airports[]: { code, name, city, note }, routes[]: { from, to, duration, airlines }, tips[] }
transport[]: { icon, title, desc, tip? }
cities[]: { id, name, local, en, area, color, days, best, vibe[], intro, access,
            spots[]: { name, local, type(人文/自然/美食/购物/体验/夜景), desc, tip? },
            food[]: { name, local, desc }, stay, tips[]? }
itineraries[]: { id, title, length, summary, suits, route[城市id], plan[]: { city, title, items[] } }
culture[]: { icon, type(do/dont/info), title, desc }
language: { name, intro, advantages[]: { word, reading, meaning },
            scripts[]: { title, desc, chars[[字, 读音]] },
            phrases[]: { cat, icon, items[]: { zh, local, roman, note? } } }
practical[]: { icon, title, points[] }
checklist[]: 字符串
```

## 目录

```
index.html               页面骨架
assets/js/app.js         路由与渲染（#/ 首页、#/japan 国家页、#/japan/tokyo 城市详情）
assets/css/style.css     样式（跟随系统深浅色）
assets/data/index.js     目的地登记表
assets/data/<id>.js      各国数据
tools_validate.js        数据自检
sw.js / manifest.json    离线缓存 / 添加到主屏幕
```

本地预览：`python3 -m http.server 8777`，打开 http://localhost:8777 。

## 内容说明

内容整理自公开资料，签证政策、票价、开放时间、预约规则经常变化，出发前请以官方信息为准。
