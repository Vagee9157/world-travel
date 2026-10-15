TRAVEL.register({
  id: 'korea',
  name: '韩国',
  nameLocal: '대한민국',
  nameEn: 'South Korea',
  code: 'KR',
  region: '东亚',
  theme: { accent: '#0f4c81', accent2: '#c60c30' },
  tagline: '宫殿、韩屋、海港和炸鸡啤酒，飞两小时就到',
  intro: '韩国离得近、航班多，适合周末加几天假的短途。首尔能逛宫殿、韩屋、潮流街区和美妆店；釜山有海和海鲜；济州岛是火山海岛。KTX 高铁把首尔、釜山、庆州、全州串在一起。',
  lang: { code: 'ko-KR', name: '韩语' },

  facts: [
    { icon: '🏛️', label: '首都', value: '首尔' },
    { icon: '🕐', label: '时差', value: '比北京快 1 小时' },
    { icon: '💴', label: '货币', value: '韩元 KRW，以实时汇率为准' },
    { icon: '🔌', label: '电源', value: '220V，圆孔两脚（C/F 型），需要转换插头' },
    { icon: '🚗', label: '交通', value: '靠右行驶；地铁、KTX 是主力' },
    { icon: '🆘', label: '紧急电话', value: '112 报警 / 119 急救·火警 / 1330 旅游热线（有中文）' },
    { icon: '💁', label: '小费', value: '不收小费' },
    { icon: '📶', label: '上网', value: 'eSIM 或机场租 Wi-Fi 蛋' }
  ],

  seasons: [
    { name: '春', months: '4 – 5 月', rating: 5, desc: '4 月初樱花季，首尔汝矣岛、庆州、镇海军港节都很美；气温舒服。', highlights: ['樱花', '镇海军港节', '庆州'] },
    { name: '夏', months: '6 – 8 月', rating: 3, desc: '7 月梅雨，之后闷热潮湿；适合去釜山海云台和济州岛玩水。', highlights: ['海云台', '济州海边'] },
    { name: '秋', months: '9 – 11 月', rating: 5, desc: '最推荐的季节，天高气爽。10 月中雪岳山先红，10 月底到 11 月初首尔宫殿和内藏山红叶最好。', highlights: ['枫叶', '景福宫', '雪岳山'] },
    { name: '冬', months: '12 – 2 月', rating: 3, desc: '首尔零下十度很常见，干冷；可以滑雪、逛圣诞灯饰，衣服一定带够。', highlights: ['滑雪', '圣诞灯饰'] }
  ],

  visa: {
    title: '签证与入境',
    points: [
      '中国大陆护照去韩国本土一般需要签证（单次 / 多次），通过韩国驻华使领馆指定的代办机构办理。',
      '直飞济州岛可免签停留 30 天，但只能待在济州，不能转去本土。',
      '韩国曾对中国团体游客试行免签（2025 年 9 月至 2026 年 6 月），是否延续请看最新公告。',
      '入境卡可以在线提前填写（e-Arrival Card）。签证政策常有调整，出发前以韩国驻华使领馆官网为准。'
    ]
  },

  budget: [
    { level: '省钱', perDay: '约 ¥500–800 / 天', desc: '青旅或 Guest House、吃路边摊和平价韩餐、地铁出行。' },
    { level: '舒适', perDay: '约 ¥1000–1500 / 天', desc: '明洞弘大一带的四星酒店、吃烤肉、偶尔打车。' },
    { level: '品质', perDay: '¥2000 起 / 天', desc: '五星酒店、韩牛烤肉和高级韩定食、包车游。' }
  ],

  flights: {
    airports: [
      { code: 'ICN', name: '仁川机场', city: '首尔', note: '主国际机场，坐 AREX 机场快线直达首尔站约 43–51 分钟，也有机场大巴到各酒店区。' },
      { code: 'GMP', name: '金浦机场', city: '首尔', note: '离市区很近，地铁 30 分钟内到弘大。上海虹桥、北京首都有航线飞这里。' },
      { code: 'PUS', name: '金海机场', city: '釜山', note: '釜山门户，轻轨 + 地铁进市区。' },
      { code: 'CJU', name: '济州机场', city: '济州', note: '济州岛门户，在济州市区边上。' }
    ],
    routes: [
      { from: '北京', to: '首尔', duration: '约 2 小时', airlines: '国航、大韩航空、韩亚航空' },
      { from: '上海', to: '首尔', duration: '约 2 小时', airlines: '东航、大韩、韩亚、春秋、吉祥、济州航空' },
      { from: '广州 / 深圳', to: '首尔', duration: '约 3.5–4 小时', airlines: '南航、大韩、韩亚、德威航空' },
      { from: '青岛', to: '首尔', duration: '约 1.5 小时', airlines: '山航、大韩、韩亚' },
      { from: '上海', to: '釜山', duration: '约 1.5–2 小时', airlines: '东航、大韩、济州航空' },
      { from: '上海', to: '济州', duration: '约 1–1.5 小时', airlines: '东航、春秋、吉祥、济州航空' }
    ],
    tips: [
      '首尔 + 釜山可以订开口程：首尔进、釜山出，中间坐 KTX，省回头路。',
      '国庆、春节、樱花季和红叶季票价高；平时廉航有很便宜的特价票。',
      '飞金浦的航班进城比仁川快很多，时间紧就优先选。',
      '想免签去济州，要确认是直飞济州或在韩国境内机场不入境转机，具体按最新规定。'
    ]
  },

  transport: [
    { icon: '🚄', title: 'KTX 高铁', desc: '首尔 → 釜山约 2 小时 30 分，首尔 → 庆州约 2 小时，龙山 → 全州约 1 小时 40 分。在 Korail 官网或 App 订票。', tip: '周末和节假日要提前订，外国人可以看一下 Korea Rail Pass。' },
    { icon: '💳', title: 'T-money 交通卡', desc: '便利店就能买和充值，地铁、公交、出租车、便利店都能刷，全国通用。换乘有优惠。', tip: '充值多半只收现金，卡里剩的钱可以在便利店退。' },
    { icon: '🗺️', title: '用 Naver 或 Kakao 地图', desc: 'Google 地图在韩国导航功能很弱，查步行和公交路线要用 Naver Map 或 KakaoMap，都有中文界面。', tip: '' },
    { icon: '🚕', title: '出租车', desc: '比日本便宜，几个人短途很划算。Kakao T 可以叫车，外国人可以绑国际信用卡用。', tip: '中国大陆驾照在韩国不能直接开车，济州想自驾要另做安排，一般选包车或巴士。' }
  ],

  cities: [
    {
      id: 'seoul', name: '首尔', local: '서울', en: 'Seoul', area: '首都圈', color: '#0f4c81',
      days: '3–5 天', best: '4–5 月、9–11 月',
      vibe: ['宫殿', '潮流', '美妆购物', '韩剧'],
      intro: '六百多年的古都和超现代的大都市叠在一起：上午穿韩服逛朝鲜王朝的宫殿，下午去圣水洞喝咖啡，晚上在汉江边吃炸鸡。',
      access: '仁川机场坐 AREX 到首尔站；金浦机场坐地铁进城。',
      spots: [
        { name: '景福宫', local: '경복궁', type: '人文', desc: '朝鲜王朝的正宫，背后是北岳山。每天有守门将换岗仪式。', tip: '穿韩服可以免费入场，宫门外有很多韩服租赁店。周二闭馆。' },
        { name: '北村韩屋村', local: '북촌한옥마을', type: '人文', desc: '景福宫和昌德宫之间的一片传统韩屋，坡道上能看到韩屋屋顶和远处的首尔塔。', tip: '这里有居民生活，部分区域限定白天开放、晚上禁止游客进入，要小声。' },
        { name: '昌德宫 · 后苑', local: '창덕궁', type: '人文', desc: '世界文化遗产，比景福宫更有园林味。后苑（秘苑）要跟导览团进，名额有限。', tip: '秋天后苑红叶极美，提前在官网预约。' },
        { name: '明洞', local: '명동', type: '购物', desc: '美妆店和服装店最集中的地方，傍晚开始整条街摆满小吃摊。', tip: '' },
        { name: '南山首尔塔', local: 'N서울타워', type: '夜景', desc: '在南山顶上，可以坐缆车上去，栏杆上挂满情侣锁，看首尔全景夜景。', tip: '' },
        { name: '弘大', local: '홍대', type: '体验', desc: '大学区，街头表演、Live House、小众服装店，年轻人的地盘。', tip: '' },
        { name: '圣水洞', local: '성수동', type: '购物', desc: '旧工厂改造的咖啡店和品牌快闪店，被叫作「首尔的布鲁克林」。', tip: '工作日去人少一点。' },
        { name: '广藏市场', local: '광장시장', type: '美食', desc: '百年传统市场，绿豆煎饼、生拌牛肉、紫菜包饭，坐在摊位前现吃。', tip: '' },
        { name: '汉江公园', local: '한강공원', type: '体验', desc: '首尔人周末的客厅。在汉江边铺块垫子，点外卖炸鸡啤酒吃，看夜景和喷泉。', tip: '盘浦大桥的月光彩虹喷泉一般在 4–10 月开。' },
        { name: '东大门设计广场 DDP', local: 'DDP', type: '人文', desc: '扎哈·哈迪德设计的银色曲面建筑，晚上亮灯很有未来感，旁边是通宵营业的服装批发商场。', tip: '' }
      ],
      food: [
        { name: '韩式烤肉', local: '삼겹살', desc: '五花肉、牛排骨，店员会帮你烤，配生菜、泡菜和烧酒。' },
        { name: '炸鸡啤酒', local: '치맥', desc: '「치킨 + 맥주」，调味炸鸡和原味炸鸡各点一半。' },
        { name: '参鸡汤', local: '삼계탕', desc: '整只童子鸡塞糯米和人参炖，夏天韩国人用它补身体。' },
        { name: '辣炒年糕', local: '떡볶이', desc: '街头小吃之王，甜辣口，配鱼饼汤。' },
        { name: '部队锅', local: '부대찌개', desc: '午餐肉、香肠、拉面、芝士煮在一锅。' }
      ],
      stay: '第一次去住明洞（购物 + 交通）、弘大（年轻热闹、近金浦机场）或钟路 / 光化门（离宫殿近）。',
      tips: ['首尔地铁中文标识清楚，用 T-money 刷卡就行。', '很多店在 App 上取号排队，热门店提前看一下要不要预约。']
    },
    {
      id: 'busan', name: '釜山', local: '부산', en: 'Busan', area: '东南海岸', color: '#1b6f8f',
      days: '2–3 天', best: '5–10 月',
      vibe: ['海边', '海鲜', '电影节', '夜景'],
      intro: '韩国第二大城市、最大的港口。有海水浴场、海边寺庙、彩色山城和最新鲜的海鲜，节奏比首尔慢。',
      access: '首尔坐 KTX 约 2 小时 30 分；上海有直飞。',
      spots: [
        { name: '海云台', local: '해운대', type: '自然', desc: '韩国最有名的海水浴场，沿海是高楼和酒店。', tip: '海云台蓝线公园有沿海的天空胶囊列车，很出片，要提前买票。' },
        { name: '广安里 · 广安大桥', local: '광안리', type: '夜景', desc: '海滩正对着广安大桥，晚上大桥亮灯，沙滩边一排咖啡店和酒吧。', tip: '' },
        { name: '甘川洞文化村', local: '감천문화마을', type: '人文', desc: '依山而建的彩色房子，被叫作「韩国的圣托里尼」，小巷里藏着艺术装置。', tip: '买一张地图跟着集章打卡。' },
        { name: '海东龙宫寺', local: '해동용궁사', type: '人文', desc: '少见的建在海边礁石上的寺庙，海浪拍着石阶。', tip: '' },
        { name: '札嘎其市场', local: '자갈치시장', type: '美食', desc: '韩国最大的海鲜市场，一楼挑海鲜，二楼帮你做。', tip: '' },
        { name: '太宗台', local: '태종대', type: '自然', desc: '海边断崖和灯塔，坐小火车环岛。', tip: '' }
      ],
      food: [
        { name: '猪肉汤饭', local: '돼지국밥', desc: '釜山代表美食，浓白的猪骨汤配米饭。' },
        { name: '小麦冷面', local: '밀면', desc: '釜山特色的冷面，夏天必吃。' },
        { name: '鱼饼', local: '어묵', desc: '釜山鱼饼最有名，有专门的鱼饼面包店。' },
        { name: '生鱼片', local: '회', desc: '在市场挑好现切，配辣椒酱和生菜。' }
      ],
      stay: '想看海住海云台或广安里；想交通方便住西面。',
      tips: ['釜山多坡道，穿好走的鞋。']
    },
    {
      id: 'jeju', name: '济州岛', local: '제주도', en: 'Jeju', area: '南部海岛', color: '#2f7d5b',
      days: '3–4 天', best: '4–6 月、9–10 月',
      vibe: ['火山岛', '海景', '徒步', '免签'],
      intro: '火山形成的海岛，有日出峰、熔岩洞和韩国最高的汉拿山，春天油菜花开满全岛。中国游客直飞可免签。',
      access: '上海直飞约 1–1.5 小时；首尔金浦飞约 1 小时，是全世界最繁忙的航线之一。',
      spots: [
        { name: '城山日出峰', local: '성산일출봉', type: '自然', desc: '海边拔地而起的火山口，爬上去约 30 分钟，看日出最经典。世界自然遗产。', tip: '' },
        { name: '汉拿山', local: '한라산', type: '自然', desc: '韩国最高峰，海拔 1947 米。登顶白鹿潭的路线来回约 8–9 小时。', tip: '登顶路线要提前在官网预约。' },
        { name: '牛岛', local: '우도', type: '自然', desc: '济州东边的小岛，坐船 15 分钟，环岛骑电动车，吃花生冰淇淋。', tip: '' },
        { name: '万丈窟', local: '만장굴', type: '自然', desc: '熔岩流出来形成的长长地下洞穴，里面常年凉爽。', tip: '' },
        { name: '涉地可支', local: '섭지코지', type: '自然', desc: '海边草坡和灯塔，很多韩剧在这里取景。', tip: '' },
        { name: '偶来小路', local: '올레길', type: '体验', desc: '环绕济州岛的徒步路线，分成二十多段，挑一段走走海边。', tip: '' },
        { name: '东门市场', local: '동문시장', type: '美食', desc: '济州市区的传统市场，晚上有夜市。', tip: '' }
      ],
      food: [
        { name: '黑猪肉', local: '흑돼지', desc: '济州特产，烤着吃，皮有嚼劲。' },
        { name: '带鱼', local: '갈치', desc: '整条银带鱼烤或炖。' },
        { name: '汉拿峰橘子', local: '한라봉', desc: '济州柑橘，冬天上市。' }
      ],
      stay: '济州市（近机场、方便）或西归浦（南部风景更好），两边各住一段也行。',
      tips: ['岛上公共交通班次少，没驾照建议包车一日游。']
    },
    {
      id: 'gyeongju', name: '庆州', local: '경주', en: 'Gyeongju', area: '东南', color: '#8a5a2b',
      days: '1–2 天', best: '4 月（樱花）、10–11 月',
      vibe: ['千年古都', '没有围墙的博物馆', '古坟'],
      intro: '新罗王朝千年的首都，整座城被叫作「没有围墙的博物馆」。草坡一样的古坟就在市中心，晚上的东宫与月池倒影非常美。',
      access: '首尔坐 KTX 约 2 小时；釜山坐车约 1 小时，适合从釜山一日游。',
      spots: [
        { name: '佛国寺', local: '불국사', type: '人文', desc: '新罗佛教艺术的代表，石阶和石塔都是国宝，世界文化遗产。', tip: '' },
        { name: '石窟庵', local: '석굴암', type: '人文', desc: '山上的石窟，里面有一尊极精美的石佛，世界文化遗产。', tip: '和佛国寺之间有巴士。' },
        { name: '大陵苑', local: '대릉원', type: '人文', desc: '一座座像小山丘的新罗王陵，天马冢可以进去参观。', tip: '' },
        { name: '东宫与月池', local: '동궁과 월지', type: '夜景', desc: '新罗王宫的离宫和池塘，晚上灯光倒映在水里。', tip: '天黑后去。' },
        { name: '瞻星台', local: '첨성대', type: '人文', desc: '东亚现存最古老的天文台之一。', tip: '' }
      ],
      food: [
        { name: '皇南饼', local: '황남빵', desc: '庆州特产红豆馅小饼。' },
        { name: '包饭定食', local: '쌈밥', desc: '一大桌生菜叶子配各种小菜和烤肉，自己包着吃。' }
      ],
      stay: '住一晚看月池夜景最好，可以选韩屋民宿。',
      tips: ['市中心景点集中，可以租自行车逛。']
    },
    {
      id: 'jeonju', name: '全州', local: '전주', en: 'Jeonju', area: '西南', color: '#9a3d3d',
      days: '1 天', best: '4–5 月、9–10 月',
      vibe: ['韩屋村', '拌饭', '韩服'],
      intro: '全州韩屋村有七百多栋传统韩屋，是韩国规模最大的韩屋群之一。这里也是石锅拌饭的故乡。',
      access: '首尔龙山站坐 KTX 约 1 小时 40 分。',
      spots: [
        { name: '全州韩屋村', local: '전주한옥마을', type: '人文', desc: '成片的灰瓦韩屋，穿韩服在巷子里走一走。', tip: '' },
        { name: '庆基殿', local: '경기전', type: '人文', desc: '供奉朝鲜太祖李成桂画像的地方，院里的竹林和古树很安静。', tip: '' },
        { name: '殿洞圣堂', local: '전동성당', type: '人文', desc: '韩屋村对面的红砖罗马式教堂，和韩屋形成有意思的对比。', tip: '' },
        { name: '南部市场夜市', local: '남부시장 야시장', type: '美食', desc: '周末晚上的夜市，各种小吃。', tip: '一般周五、周六晚上开。' }
      ],
      food: [
        { name: '全州拌饭', local: '전주비빔밥', desc: '石锅拌饭的发源地，配料多达二三十种。' },
        { name: '豆芽汤饭', local: '콩나물국밥', desc: '全州人的醒酒早餐。' }
      ],
      stay: '可以住一晚韩屋民宿，体验地暖炕房。',
      tips: []
    }
  ],

  itineraries: [
    {
      id: 'seoul5', title: '首尔经典 · 宫殿与潮流', length: '5 天 4 晚',
      summary: '第一次去韩国，首尔一个城市就能玩满：宫殿韩屋、美妆购物、咖啡街区和汉江夜景。',
      suits: '第一次去韩国、喜欢购物和韩流',
      route: ['seoul'],
      plan: [
        { city: 'seoul', title: '抵达 · 明洞', items: ['仁川机场坐 AREX 进城，入住明洞', '下午明洞逛美妆店', '傍晚坐缆车上南山首尔塔看夜景'] },
        { city: 'seoul', title: '朝鲜王朝一日', items: ['上午租韩服，景福宫（看守门将换岗）', '中午北村韩屋村、三清洞', '下午昌德宫后苑（预约），晚上广藏市场吃绿豆煎饼'] },
        { city: 'seoul', title: '潮流首尔', items: ['上午圣水洞咖啡和快闪店', '下午东大门 DDP', '晚上汉江公园炸鸡啤酒看喷泉'] },
        { city: 'seoul', title: '弘大 · 延南洞', items: ['上午延南洞小巷咖啡店', '下午弘大逛街、看街头表演', '晚上吃一顿韩式烤肉'] },
        { city: 'seoul', title: '回国', items: ['上午补货（乐天免税店、超市买零食）', '下午去机场'] }
      ]
    },
    {
      id: 'seoulbusan7', title: '首尔 + 釜山 · 一路向南', length: '7 天 6 晚',
      summary: '首尔进、釜山出，中间坐 KTX，顺路加上千年古都庆州。城市、古迹、大海都有。',
      suits: '有一周假期、想看更多面的韩国',
      route: ['seoul', 'gyeongju', 'busan'],
      plan: [
        { city: 'seoul', title: '抵达首尔', items: ['入住明洞，南山首尔塔夜景'] },
        { city: 'seoul', title: '宫殿与韩屋', items: ['景福宫、北村韩屋村、广藏市场'] },
        { city: 'seoul', title: '潮流首尔', items: ['圣水洞、弘大，晚上汉江公园'] },
        { city: 'gyeongju', title: 'KTX 去庆州', items: ['上午坐 KTX 到庆州（约 2 小时）', '下午大陵苑、瞻星台，骑自行车', '晚上东宫与月池夜景，住韩屋民宿'] },
        { city: 'gyeongju', title: '佛国寺 → 釜山', items: ['上午佛国寺、石窟庵', '下午坐车去釜山（约 1 小时），晚上广安里看大桥'] },
        { city: 'busan', title: '釜山海边', items: ['上午甘川洞文化村', '中午札嘎其市场吃海鲜', '下午海云台、天空胶囊列车'] },
        { city: 'busan', title: '回国', items: ['上午海东龙宫寺，吃一碗猪肉汤饭', '下午金海机场回国'] }
      ]
    },
    {
      id: 'jeju4', title: '济州岛 · 免签海岛', length: '4 天 3 晚',
      summary: '直飞济州免签，不用办签证说走就走。看日出峰、骑行牛岛、吃黑猪肉。',
      suits: '没来得及办签证、想看海放松',
      route: ['jeju'],
      plan: [
        { city: 'jeju', title: '抵达济州市', items: ['入住济州市', '晚上东门市场夜市'] },
        { city: 'jeju', title: '东线', items: ['清晨城山日出峰看日出', '上午坐船去牛岛，环岛骑电动车', '下午涉地可支，晚上吃黑猪肉烤肉'] },
        { city: 'jeju', title: '中部与南线', items: ['上午万丈窟', '下午去西归浦，走一段偶来小路，看柱状节理带'] },
        { city: 'jeju', title: '回程', items: ['上午买汉拿峰橘子和伴手礼', '下午济州机场回国'] }
      ]
    }
  ],

  culture: [
    { icon: '🙇', type: 'do', title: '尊重长幼', desc: '韩国很重视年龄和辈分。递东西、接东西用双手；和长辈喝酒时晚辈要侧过身去喝。' },
    { icon: '🍚', type: 'info', title: '饭碗不端起来', desc: '和中国、日本不同，韩国吃饭时碗放在桌上，用勺子吃米饭和汤，筷子夹菜。' },
    { icon: '🥢', type: 'do', title: '等长辈先动筷', desc: '一起吃饭时等年长的人先开动。小菜（반찬）一般可以免费续。' },
    { icon: '🖊️', type: 'dont', title: '不用红笔写名字', desc: '红笔写名字代表去世的人，签名、写贺卡都避开红色。' },
    { icon: '🚇', type: 'dont', title: '别坐粉色座位', desc: '地铁里的粉色座位是留给孕妇的，即使空着也不要坐；两端的是老弱专座。' },
    { icon: '💴', type: 'dont', title: '不给小费', desc: '餐厅和出租车都不收小费。' },
    { icon: '👟', type: 'do', title: '进屋脱鞋', desc: '韩屋民宿、部分传统餐厅是坐在地板上吃饭的，进门脱鞋。' },
    { icon: '🗑️', type: 'info', title: '垃圾分类严格', desc: '分一般垃圾、可回收、厨余，酒店和民宿会有说明。' }
  ],

  language: {
    name: '韩语',
    intro: '韩文（한글）是 1443 年世宗大王创制的拼音文字，24 个基本字母拼成一个个方块字。好消息是一个下午就能学会认读：学会了就能念出招牌和菜单，很多词的发音跟中文很像。',
    advantages: [
      { word: '도서관', reading: 'doseogwan', meaning: '图书馆（汉字词，发音很接近）' },
      { word: '운동', reading: 'undong', meaning: '运动' },
      { word: '시간', reading: 'sigan', meaning: '时间' },
      { word: '준비', reading: 'junbi', meaning: '准备' },
      { word: '학생', reading: 'haksaeng', meaning: '学生' },
      { word: '안전', reading: 'anjeon', meaning: '安全' }
    ],
    scripts: [
      { title: '基本辅音', desc: '14 个基本辅音。ㅇ 放在开头不发音，放在末尾读 ng。', chars: [['ㄱ','g/k'],['ㄴ','n'],['ㄷ','d/t'],['ㄹ','r/l'],['ㅁ','m'],['ㅂ','b/p'],['ㅅ','s'],['ㅇ','-/ng'],['ㅈ','j'],['ㅊ','ch'],['ㅋ','k'],['ㅌ','t'],['ㅍ','p'],['ㅎ','h']] },
      { title: '基本元音', desc: '10 个基本元音。辅音 + 元音拼成一个字，比如 ㅎ + ㅏ = 하（ha），ㄴ + ㅏ = 나（na）。', chars: [['ㅏ','a'],['ㅑ','ya'],['ㅓ','eo'],['ㅕ','yeo'],['ㅗ','o'],['ㅛ','yo'],['ㅜ','u'],['ㅠ','yu'],['ㅡ','eu'],['ㅣ','i']] }
    ],
    phrases: [
      { cat: '问候礼貌', icon: '👋', items: [
        { zh: '你好', local: '안녕하세요', roman: 'annyeonghaseyo', note: '任何时间都能用' },
        { zh: '谢谢', local: '감사합니다', roman: 'gamsahamnida' },
        { zh: '谢谢（更口语）', local: '고맙습니다', roman: 'gomapseumnida' },
        { zh: '对不起', local: '죄송합니다', roman: 'joesonghamnida' },
        { zh: '劳驾 / 服务员', local: '저기요', roman: 'jeogiyo', note: '餐厅叫服务员就喊这句' },
        { zh: '是 / 不是', local: '네 / 아니요', roman: 'ne / aniyo' },
        { zh: '没关系 / 不用了', local: '괜찮아요', roman: 'gwaenchanayo' },
        { zh: '我不会说韩语', local: '한국어 못해요', roman: 'hangugeo motaeyo' },
        { zh: '有会说中文的人吗？', local: '중국어 하는 분 있어요?', roman: 'junggugeo haneun bun isseoyo?' }
      ] },
      { cat: '问路交通', icon: '🚇', items: [
        { zh: '……在哪里？', local: '〜 어디예요?', roman: '~ eodiyeyo?', note: '前面接地名' },
        { zh: '洗手间在哪里？', local: '화장실 어디예요?', roman: 'hwajangsil eodiyeyo?' },
        { zh: '地铁站', local: '지하철역', roman: 'jihacheollyeok' },
        { zh: '请到这里（出租车）', local: '여기로 가 주세요', roman: 'yeogiro ga juseyo', note: '同时给司机看地址' },
        { zh: '要多久？', local: '얼마나 걸려요?', roman: 'eolmana geollyeoyo?' }
      ] },
      { cat: '餐厅', icon: '🍖', items: [
        { zh: '两位', local: '두 명이요', roman: 'du myeong-iyo' },
        { zh: '请给我这个', local: '이거 주세요', roman: 'igeo juseyo', note: '指着菜单说，最实用' },
        { zh: '请给我菜单', local: '메뉴판 주세요', roman: 'menyupan juseyo' },
        { zh: '请不要做辣', local: '안 맵게 해 주세요', roman: 'an maepge hae juseyo' },
        { zh: '请给我水', local: '물 좀 주세요', roman: 'mul jom juseyo' },
        { zh: '买单', local: '계산해 주세요', roman: 'gyesanhae juseyo' },
        { zh: '我开动了', local: '잘 먹겠습니다', roman: 'jal meokgetseumnida' },
        { zh: '好吃！', local: '맛있어요!', roman: 'masisseoyo' }
      ] },
      { cat: '购物', icon: '🛍️', items: [
        { zh: '多少钱？', local: '얼마예요?', roman: 'eolmayeyo?' },
        { zh: '可以刷卡吗？', local: '카드 돼요?', roman: 'kadeu dwaeyo?' },
        { zh: '便宜一点吧', local: '깎아 주세요', roman: 'kkakka juseyo', note: '传统市场可以试试，商场不行' },
        { zh: '可以退税吗？', local: '택스 리펀 돼요?', roman: 'taekseu ripeon dwaeyo?' },
        { zh: '不要袋子', local: '봉투 필요 없어요', roman: 'bongtu piryo eopseoyo' }
      ] },
      { cat: '住宿', icon: '🏨', items: [
        { zh: '我要办入住', local: '체크인할게요', roman: 'chekeuinhalgeyo' },
        { zh: '可以寄存行李吗？', local: '짐 맡길 수 있어요?', roman: 'jim matgil su isseoyo?' },
        { zh: 'Wi-Fi 密码是多少？', local: '와이파이 비밀번호 뭐예요?', roman: 'waipai bimilbeonho mwoyeyo?' }
      ] },
      { cat: '紧急', icon: '🆘', items: [
        { zh: '请帮帮我！', local: '도와주세요!', roman: 'dowajuseyo' },
        { zh: '医院在哪里？', local: '병원 어디예요?', roman: 'byeongwon eodiyeyo?' },
        { zh: '我钱包丢了', local: '지갑을 잃어버렸어요', roman: 'jigabeul ireobeoryeosseoyo' },
        { zh: '请叫警察', local: '경찰 불러 주세요', roman: 'gyeongchal bulleo juseyo' },
        { zh: '我不舒服 / 疼', local: '아파요', roman: 'apayo' }
      ] }
    ]
  },

  practical: [
    { icon: '📱', title: '必装 App', points: ['Naver Map 或 KakaoMap：导航必备，Google 地图在韩国不好用', 'Papago：韩国本土的翻译 App，拍照翻译菜单很准', 'Kakao T：叫出租车', 'Korail Talk：订 KTX'] },
    { icon: '💳', title: '付钱', points: ['刷卡非常普及，便利店、出租车都能刷；支付宝、微信在明洞等游客区很多店能用', '传统市场、小摊和 T-money 充值多半要现金，带一些韩元', '明洞的私人换钱所汇率通常比机场好'] },
    { icon: '🧾', title: '退税', points: ['在标有 Tax Free 的店单笔满 15,000 韩元可以退税，要出示护照', '很多店可以现场直接扣掉税额；没扣的在机场或市区退税机办理'] },
    { icon: '📶', title: '上网', points: ['买韩国 eSIM 最省事；也可以机场租 Wi-Fi 蛋', '地铁和咖啡店基本都有免费 Wi-Fi'] },
    { icon: '☎️', title: '1330 旅游热线', points: ['韩国观光公社的 24 小时旅游咨询热线，有中文服务：问路、翻译、投诉都能打', '在韩国直接拨 1330'] }
  ],

  checklist: [
    '护照有效期 6 个月以上',
    '办好韩国签证（只去济州岛直飞可免签）',
    '订好机票（首尔 + 釜山考虑开口程）',
    '订好酒店',
    '买旅行保险（含医疗）',
    '在线填好入境卡',
    '准备 eSIM 或 Wi-Fi 蛋',
    '换一些韩元现金',
    '带转换插头（圆孔两脚）',
    '装好 Naver Map / Papago',
    '提前预约昌德宫后苑、汉拿山登顶',
    '订好 KTX 车票'
  ]
});
