// Spatial relationships paraphrased from the supplied Chinese edition's maps and chapters 3, 5, 12.
// All coordinates, elevations and dimensions are illustrative, not surveyed measurements.
export const people = [
  ["富堂", "一守家", "族长"],
  ["兵堂", "一守家", "现任户主"],
  ["富贵", "一守家", "兵堂之妻"],
  ["长寿郎", "一守家", "双胞胎哥哥（登场介绍）"],
  ["妃女子", "一守家", "双胞胎妹妹（登场介绍）"],
  ["藏田甲子", "一守家", "乳母"],
  ["佥鸟郁子", "一守家", "家庭教师"],
  ["斧高", "一守家", "用人"],
  ["铃江", "一守家", "用人"],
  ["一枝", "二守家", "富堂之姐"],
  ["纮达", "二守家", "现任户主"],
  ["笛子", "二守家", "纮达之妻"],
  ["纮弌", "二守家", "长子"],
  ["纮弍", "二守家", "次子"],
  ["竹子", "二守家", "长女 / 新娘候选人"],
  ["二枝", "三守家", "富堂之妹"],
  ["克棋", "三守家", "现任户主"],
  ["绫子", "三守家", "克棋之妻"],
  ["华子", "三守家", "次女 / 新娘候选人"],
  ["桃子", "三守家", "华子之妹（正文登场）"],
  ["三枝", "古里家", "富堂之妹"],
  ["毬子", "古里家", "三枝的孙女 / 新娘候选人"],
  ["高屋敷元", "警察", "北守派出所巡警"],
  ["高屋敷妙子", "其他", "高屋敷元之妻"],
  ["二见", "警察", "东守派出所巡查长"],
  ["佐伯", "警察", "南守派出所巡警"],
  ["大江田真八", "警察", "终下市刑警队长"],
  ["岩槻", "警察", "刑警"],
  ["入间", "警察", "正文登场巡警"],
  ["江川兰子", "其他", "作家（登场介绍）"],
  ["丝波小陆", "其他", "作家（登场介绍）"],
  ["刀城言耶", "其他", "怪奇幻想作家"],
  ["阿武隈川乌", "其他", "民俗学者"],
  ["伊势桥", "其他", "村医"],
  ["溜吉", "一守家", "用人"],
  ["宅造", "一守家", "用人"],
].map(([name, group, role], i) => ({
  id: i,
  name,
  group,
  role,
  color: ["#dbab6c", "#81bba9", "#a6a6d9", "#c58283", "#8aadc4", "#bcb277"][
    i % 6
  ],
}));
const place = (id, name, x, z, kind, detail, source = "书前图示 / 第三章") => ({
  id,
  name,
  x,
  z,
  kind,
  detail,
  source,
});
export const places = [
  place(
    "ichimori",
    "一守家",
    4,
    -36,
    "village",
    "位于媛首山北侧，与北鸟居口相对。仅建宅邸轮廓，内部未复原。",
  ),
  place(
    "nimori",
    "二守家",
    42,
    4,
    "village",
    "位于东鸟居口外；与一守家、三守家构成秘守一族。",
  ),
  place(
    "sanmori",
    "三守家",
    4,
    35,
    "village",
    "位于南鸟居口外。宅邸轮廓仅用于辨识方位。",
  ),
  place(
    "jinja",
    "媛守神社",
    29,
    -26,
    "village",
    "独立于媛神堂，位于北守与东守交界处的东北小山。",
    "第十七章 / 村庄示意图",
  ),
  place(
    "ritual",
    "祭祀堂",
    -3,
    -28,
    "building",
    "北鸟居口侧旁的准备场所。内部尺寸与隔间没有建模。",
    "第一章 / 参道图",
  ),
  place(
    "north",
    "北鸟居口",
    2,
    -27,
    "gate",
    "外侧鸟居、石阶与蜿蜒参道，是一守家方向的入口。",
  ),
  place(
    "well",
    "北参道水井",
    3,
    -11,
    "well",
    "仅北路有井；井边祓禊、近旁石碑与藏身树是重要空间关系。井深为展示推定。",
  ),
  place(
    "stone",
    "石碑 / 藏身树",
    -1,
    -11,
    "landmark",
    "参道左侧有可藏身的大石碑，近旁树后构成另一观察点。",
    "第三章",
  ),
  place(
    "northInner",
    "北侧小鸟居",
    5,
    -8,
    "gate",
    "进入玉砂利境内前的第二座鸟居。",
  ),
  place(
    "east",
    "东鸟居口",
    31,
    4,
    "gate",
    "二守家方向的入口，参道途中设马头观音祠。",
  ),
  place(
    "kannon",
    "马头观音祠",
    24,
    0,
    "building",
    "东参道约行至三分之二处的较大祠堂。",
    "第四章 / 参道图",
  ),
  place(
    "eastWater",
    "东侧手水舍",
    19,
    5,
    "landmark",
    "东参道的净身设施；不是北侧水井。",
  ),
  place("eastInner", "东侧小鸟居", 17, 3, "gate", "从东参道进入境内。"),
  place("south", "南鸟居口", 3, 27, "gate", "三守家方向的外侧鸟居、石阶。"),
  place(
    "southWater",
    "南侧手水舍",
    9,
    13,
    "landmark",
    "南参道进入境内前的净身设施。",
  ),
  place("southInner", "南侧小鸟居", 6, 10, "gate", "从南参道进入境内。"),
  place(
    "courtyard",
    "玉砂利境内",
    8,
    -7,
    "ground",
    "建筑群四周铺碎石。声音、目击与出入口监视是推理条件，不能直接等同于物理封闭。",
  ),
  place(
    "shrine",
    "媛神堂",
    10,
    0,
    "building",
    "格子门朝北；堂内有祭坛、媛首冢和御淡供养碑，西侧短走廊接荣螺塔。",
    "第三章、第五章 / 建筑图",
  ),
  place(
    "towerEntry",
    "荣螺塔 · 神堂侧入口",
    1,
    0,
    "tower",
    "从媛神堂侧进入上行斜道；书中为连续木板通道，不是普通分层楼梯。",
    "第五章 / 荣螺塔构造图",
  ),
  place(
    "towerTop",
    "荣螺塔 · 顶部转接",
    -3,
    0,
    "tower",
    "两条独立螺旋通道在顶端转接。圈数、坡度、塔高均为展示推定。",
    "第五章 / 荣螺塔构造图",
  ),
  place(
    "towerExit",
    "荣螺塔 · 婚舍侧入口",
    -7,
    0,
    "tower",
    "婚舍侧的通道与神堂侧通道独立；反向行走同样须先上塔再下塔。",
    "第五章",
  ),
  ...[
    ["front", "前", -13, -7],
    ["middle", "中", -16, 0],
    ["rear", "后", -13, 7],
  ].flatMap(([id, label, x, z]) => [
    place(
      id + "Tea",
      label + "婚舍 · 茶室",
      x,
      z,
      "room",
      "四叠半茶室；通往六叠里间，旁有茶器清洗间。",
      "第五章、第十二章 / 建筑图",
    ),
    place(
      id + "Room",
      label + "婚舍 · 六叠间",
      x - 4,
      z,
      "room",
      "左右纸窗外装木格；门对面为壁龛和壁橱。窗位置关系来自正文，具体大小为推定。",
      "第十二章 / 建筑图",
    ),
  ]),
  place(
    "toilet",
    "外部厕所",
    -22,
    2,
    "building",
    "位于中婚舍背后；正文称需折回媛神堂，再从堂外绕行。未设婚舍直接出口。",
    "第五章",
  ),
];
export const byId = (id) => places.find((p) => p.id === id);
export const edges = [
  ["ichimori", "north"],
  ["ritual", "north"],
  ["north", "well"],
  ["well", "northInner"],
  ["well", "stone"],
  ["northInner", "courtyard"],
  ["nimori", "east"],
  ["east", "kannon"],
  ["kannon", "eastWater"],
  ["eastWater", "eastInner"],
  ["eastInner", "courtyard"],
  ["sanmori", "south"],
  ["south", "southWater"],
  ["southWater", "southInner"],
  ["southInner", "courtyard"],
  ["courtyard", "shrine"],
  ["shrine", "towerEntry"],
  ["towerEntry", "towerTop"],
  ["towerTop", "towerExit"],
  ["towerExit", "frontTea"],
  ["towerExit", "middleTea"],
  ["towerExit", "rearTea"],
  ["frontTea", "frontRoom"],
  ["middleTea", "middleRoom"],
  ["rearTea", "rearRoom"],
  ["courtyard", "toilet"],
];
export function routeBetween(from, to) {
  const q = [[from]],
    seen = new Set([from]);
  while (q.length) {
    const p = q.shift(),
      last = p.at(-1);
    if (last === to) return p;
    for (const [a, b] of edges) {
      const n = a === last ? b : b === last ? a : null;
      if (n && !seen.has(n)) {
        seen.add(n);
        q.push([...p, n]);
      }
    }
  }
  return [];
}
export function helix(lane, t) {
  const theta = (lane === "A" ? 0 : Math.PI) + Math.PI * 4 * t;
  return {
    x: -3 + 4 * Math.cos(theta),
    y: 0.35 + 8 * t,
    z: 4 * Math.sin(theta),
  };
}
export function segment(a, b) {
  if (a === "towerEntry" && b === "towerTop")
    return Array.from({ length: 81 }, (_, i) => helix("A", i / 80));
  if (a === "towerTop" && b === "towerEntry") return segment(b, a).reverse();
  if (a === "towerTop" && b === "towerExit")
    return [
      ...Array.from({ length: 17 }, (_, i) => ({
        x: -3 + 4 * Math.cos((Math.PI * i) / 16),
        y: 8.35,
        z: 4 * Math.sin((Math.PI * i) / 16),
      })),
      ...Array.from({ length: 81 }, (_, i) => helix("B", 1 - i / 80)),
    ];
  if (a === "towerExit" && b === "towerTop") return segment(b, a).reverse();
  const p = byId(a),
    q = byId(b);
  if (!p || !q) return [];
  if (
    (a === "courtyard" && b === "shrine") ||
    (a === "shrine" && b === "courtyard")
  ) {
    const pts = [
      { x: 8, y: 0.35, z: -7 },
      { x: 10.4, y: 0.35, z: -4.5 },
      { x: 10, y: 0.35, z: 0 },
    ];
    return a === "courtyard" ? pts : pts.reverse();
  }
  if (
    (a === "shrine" && b === "towerEntry") ||
    (a === "towerEntry" && b === "shrine")
  ) {
    const pts = [
      { x: 10, y: 0.35, z: 0 },
      { x: 7, y: 0.35, z: -2.5 },
      { x: 5, y: 0.35, z: 0 },
      { x: 1, y: 0.35, z: 0 },
    ];
    return a === "shrine" ? pts : pts.reverse();
  }
  if ((a === "north" && b === "well") || (a === "well" && b === "north")) {
    const pth = [
      { x: 2, y: 0.35, z: -27 },
      { x: 0, y: 0.35, z: -23 },
      { x: 7, y: 0.35, z: -20 },
      { x: 5, y: 0.35, z: -15 },
      { x: 3, y: 0.35, z: -11 },
    ];
    return a === "north" ? pth : pth.reverse();
  }
  if (
    (a === "courtyard" && b === "toilet") ||
    (b === "courtyard" && a === "toilet")
  ) {
    const pth = [
      { x: 8, y: 0.35, z: -7 },
      { x: 0, y: 0.35, z: -12 },
      { x: -23, y: 0.35, z: -12 },
      { x: -25, y: 0.35, z: 2 },
      { x: -22, y: 0.35, z: 2 },
    ];
    return a === "courtyard" ? pth : pth.reverse();
  }
  return [
    { x: p.x, y: 0.35, z: p.z },
    { x: q.x, y: 0.35, z: q.z },
  ];
}
export function routePoints(path) {
  return path.flatMap((id, i) => (i ? segment(path[i - 1], id) : []));
}
export function atDistance(points, t) {
  if (!points.length) return null;
  const lengths = points
    .slice(1)
    .map((p, i) =>
      Math.hypot(p.x - points[i].x, p.y - points[i].y, p.z - points[i].z),
    );
  const total = lengths.reduce((a, b) => a + b, 0);
  let remaining = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) {
      const r = lengths[i] ? remaining / lengths[i] : 0,
        a = points[i],
        b = points[i + 1];
      return {
        x: a.x + (b.x - a.x) * r,
        y: a.y + (b.y - a.y) * r,
        z: a.z + (b.z - a.z) * r,
      };
    }
    remaining -= lengths[i];
  }
  return points.at(-1);
}
export const blankPlan = () => ({
  name: "媛首山 · 假说 A",
  period: "free",
  placements: [],
  routes: [],
  notes: [],
});
export const clock = (t, period = "free") => {
  const mins = (period === "wedding" ? 15 : 18) * 60 + 30 + Number(t);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
};
// Observation labels identify testimony, not independently established identity or location.
export const observations = [
  {
    t: 0,
    person: 3,
    place: "ritual",
    text: "一守家一行进入祭祀堂；此为整理记录中的约时。",
    source: "第六章 · 活动表",
  },
  {
    t: 30,
    person: 3,
    place: "north",
    text: "被记录为长寿郎的人先行入山；斧高随后跟入。",
    source: "第六章 · 活动表",
  },
  {
    t: 45,
    person: 3,
    place: "well",
    text: "斧高报告看见长寿郎在井边进行祓禊。",
    source: "第三章 / 第六章",
  },
  {
    t: 45,
    person: 6,
    place: "ritual",
    text: "佥鸟郁子从祭祀堂窗边开始监视北鸟居口。",
    source: "第六章 · 活动表",
  },
  {
    t: 50,
    person: 3,
    place: "shrine",
    text: "活动表记录长寿郎进入媛神堂。",
    source: "第六章 · 活动表",
  },
  {
    t: 60,
    person: 22,
    place: "east",
    text: "高屋敷在东鸟居口遇见纮弍；不久二见到达。",
    source: "第六章 · 活动表",
  },
  {
    t: 60,
    person: 4,
    place: "well",
    text: "斧高报告第一次看见妃女子在井边，片刻后身影消失。身份只按证词标签显示。",
    source: "第三章 / 第六章",
  },
  {
    t: 65,
    person: 4,
    place: "well",
    text: "斧高报告第二次看见妃女子在井边净身。两次目击不自动视为同一人的确定行动。",
    source: "第五章 / 第六章",
  },
  {
    t: 70,
    person: 4,
    place: "shrine",
    text: "斧高报告随后的人影进入媛神堂。",
    source: "第五章 / 第六章",
  },
  {
    t: 80,
    person: 3,
    place: "towerTop",
    text: "活动表记录长寿郎登上荣螺塔顶。",
    source: "第六章 · 活动表",
  },
  {
    t: 85,
    person: 3,
    place: "shrine",
    text: "活动表记录长寿郎回到媛神堂。",
    source: "第六章 · 活动表",
  },
];
export function positionAt(plan, person, t) {
  const moves = plan.routes.filter(
    (r) => r.person === person && t >= r.start && t <= r.end,
  );
  if (moves.length)
    return atDistance(
      routePoints(moves.at(-1).path),
      (t - moves.at(-1).start) / (moves.at(-1).end - moves.at(-1).start),
    );
  const snapshots = plan.placements
    .filter((p) => p.person === person && p.t <= t)
    .sort((a, b) => a.t - b.t);
  const completed = plan.routes
    .filter((r) => r.person === person && r.end <= t)
    .sort((a, b) => a.end - b.end);
  const p = snapshots.at(-1),
    r = completed.at(-1);
  const loc =
    r && (!p || r.end > p.t) ? byId(r.path.at(-1)) : p && byId(p.place);
  return loc
    ? loc.id === "towerTop"
      ? { x: 1, y: 8.35, z: 0 }
      : { x: loc.x, y: 0.35, z: loc.z }
    : null;
}
export function conflicts(plan) {
  const result = [];
  for (const r of plan.routes) {
    if (
      !r.path.every(byId) ||
      r.path
        .slice(1)
        .some(
          (id, i) =>
            !edges.some(
              ([a, b]) =>
                (a === id && b === r.path[i]) || (b === id && a === r.path[i]),
            ),
        )
    )
      result.push("路线存在未连接的地点。");
    for (const p of plan.placements.filter(
      (p) => p.person === r.person && p.t >= r.start && p.t <= r.end,
    )) {
      if (
        (p.t === r.start && p.place === r.path[0]) ||
        (p.t === r.end && p.place === r.path.at(-1))
      )
        continue;
      result.push(
        `${people[r.person].name}在路线时间内另有位置快照（${clock(p.t, plan.period)}）。请核对。`,
      );
    }
  }
  for (let i = 0; i < plan.routes.length; i++)
    for (let j = i + 1; j < plan.routes.length; j++) {
      const a = plan.routes[i],
        b = plan.routes[j];
      if (
        a.person === b.person &&
        Math.max(a.start, b.start) < Math.min(a.end, b.end)
      )
        result.push(`${people[a.person].name}有两条重叠的行动路线。`);
    }
  return [...new Set(result)];
}
