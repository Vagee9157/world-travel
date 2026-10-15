# 环游世界 · 旅行卡片

首页分「环游世界」和「中国游」两个 tab。世界是一个可以拖着转的地球，中国是一张只画海岸线的地图（不画任何国界、省界）。世界页的地球：选出发城市，点国家看直飞时长、季节和当地时间。每个目的地一套卡片：行程、航班、热门城市、人文景点、当地礼仪，再学几句当地话。纯前端，手机电脑都能用，联网打开过一次就能离线看。

**在线地址** → https://vagee9157.github.io/world-travel/

## 已上线

| 目的地 | 城市 | 行程 | 语言 |
|---|---|---|---|
| 🇯🇵 日本 | 13 座：东京、京都、大阪、奈良、富士山·箱根、札幌·小樽、冲绳、镰仓·横滨、日光、金泽·白川乡、神户·姬路、广岛·宫岛、福冈；149 个景点 | 8 条：初访经典 7 天 / 关西深度 / 北海道冬日 / 关西+广岛 / 东京周边 / 大环线 12–14 天 / 冲绳 / 赏樱 | 日语：全套假名、数字、分类词汇、65 句；另有美食、节庆、住宿购物；73 张图 |
| 🇰🇷 韩国 | 10 座：首尔、釜山、济州岛、庆州、全州、水原、仁川、江陵·束草、安东、丽水·统营；99 个景点 | 7 条：首尔经典 / 首尔+釜山 / 济州免签 / 东海岸 6 天 / 韩国一圈 10 天 / 釜山 4 天 / 首尔周边 | 韩语：全套字母与收音、两套数字、分类词汇、65 句；另有美食、节庆、住宿购物；62 张图 |

筹备中：泰国、新加坡、越南、法国、意大利、澳大利亚。

### 中国游

| 城市 | 片区 | 行程 | 语言 |
|---|---|---|---|
| 广州 | 6 个：越秀老城、荔湾西关、天河、海珠·广州塔、番禺·南沙、白云山·黄埔·从化；43 个景点 | 5 条：一日 / 周末 / 三天 / 亲子长隆 / 吃货 | 粤语：粤拼入门、55 句、数字、分类词汇；32 张图 |

筹备中：北京、上海、杭州、西安、成都、重庆、桂林、厦门、大理、哈尔滨、三亚。

## 每个目的地有什么

| 板块 | 内容 |
|---|---|
| 速览 | 基本信息图标格；12 个月推荐度柱图；每日预算区间图；签证 / 出行须知 |
| 景点 | 16 个必去景点照片卡片 + 按城市（片区）逛 + 全部照片；点开直达城市并定位到景点 |
| 行程 | 多条路线：路线串点、按天时间线，当天景点一点直达 |
| 交通 | 出发城市到目的地的时长条形图、机场车站、订票技巧、当地交通 |
| 美食 | 必吃清单配图和价格、吃饭规矩 |
| 人文历史 | 时代色带、大事记、历史人物；当地礼仪（要这样 / 别这样 / 知道一下） |
| 语言 | 字母表、分场景旅行用语（闪卡 / 速查、朗读、学会进度）、数字和常见词 |
| 出发清单 | 通用必备（出国 / 国内两套）+ 目的地专属事项按类归入（📌 标出）；应急和必装 App |

数据里还保留了 festivals / stays / shopping / practical 等字段，页面暂不显示（practical 里「出了问题怎么办」「必装 App」放在出发清单页）。

收藏、学习进度、清单勾选都只存在本机浏览器（localStorage），不上传。

## 图片

只用 Wikimedia Commons 上许可为 公有领域 / CC0 / CC BY / CC BY-SA 的照片（不收 NC、ND），下载后转成 webp（宽 1280、单张 ≤ 260 KB）放在 `assets/img/<国家>/`，在数据的 `images` 里记作者、许可和原图链接。页面上每张图右下角有署名，国家页最后有完整的「图片来源」列表。`tools_validate.js` 会检查文件存在、许可在白名单、引用的 key 都有图。

## 新增一个国家

1. 复制 `assets/data/japan.js` 为 `assets/data/<id>.js`，改内容（结构见下）。
2. 在 `assets/data/index.js` 里把对应条目的 `status` 改成 `'live'`，填上 `file`；没有的话加一条。国外放 `TRAVEL_INDEX`，国内城市放 `CHINA_INDEX`。国内城市可以用 `labels` 改章节名（如「片区」「交通」「粤语」）。
3. 跑自检：`node tools_validate.js`。
4. 在 `sw.js` 的 `CORE` 里加上新文件，并把 `CACHE` 版本号 +1。

图片：每张图要有原图（宽 1280）和 `thumb/` 下的缩略图（宽 640），卡片和相册用缩略图。

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

可选：
city.img / spot.img / foodGuide[].img / stays[].img    图片 key
foodGuide[]: { name, local, img?, desc, where, price }
dining[]: { icon, title, desc }
festivals[]: { name, local, month, city, desc, tip }
stays[]: { icon, type, local, img?, desc, price, tip }
shopping[]: { icon, title, desc, where }
language.numbers[]: { n, local, roman }，language.priceNote，language.vocab[]: { cat, icon, items[]: { local, roman, zh } }
images: { key: { src, alt, credit, license, licenseUrl, source } }   key 'cover' 是国家封面
notice: { title, updated, points[] }   出发前必看；budgetNote 预算说明
itineraries[].plan[].spots[]   当天景点名（要能在该城市 spots 里找到）
topSpots[]   必去景点名单（spot.name），首页卡片取前 4 个
history: { intro, eras[]: { name, years, desc, highlight, spotRefs[]: { city, spot } }, events[]: { year, title, desc, icon, ref? }, people[]: { name, local, years, role, desc, icon, ref? } }
cities[].history[]: { year, text }   城市弹窗「历史上的这里」
```

## 目录

```
index.html               页面骨架
assets/js/app.js         路由与渲染（#/ 首页、#/japan 国家页、#/japan/tokyo 城市详情）
assets/js/globe.js       首页地球（d3-geo 正射投影 + canvas）
assets/vendor/           d3-array / d3-geo / topojson-client（ISC，自托管）
assets/data/countries-110m.json  世界地图（world-atlas，Natural Earth）
assets/data/eastasia-land-50m.json  中国游地图：从 Natural Earth 50m 陆地裁出的东亚海岸线，不含任何边界
assets/css/style.css     样式（跟随系统深浅色）
assets/data/index.js     目的地登记表
assets/data/<id>.js      各国数据
tools_validate.js        数据自检
sw.js / manifest.json    离线缓存 / 添加到主屏幕
```

本地预览：`python3 -m http.server 8777`，打开 http://localhost:8777 。

## 内容说明

内容整理自公开资料，签证政策、票价、开放时间、预约规则经常变化，出发前请以官方信息为准。
