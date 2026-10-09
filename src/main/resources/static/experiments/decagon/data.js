// Spatial facts paraphrased from chapters 1 and 3 and the two early maps.
export const personNames = [
  "埃勒里",
  "阿加莎",
  "卡尔",
  "勒鲁",
  "范达因",
  "奥希兹",
  "爱伦·坡",
];
export const roles = [
  "青年 · 法学",
  "青年 · 文学",
  "青年 · 法学",
  "青年 · 文学",
  "青年 · 理科",
  "学生 · 日本画",
  "医学生 · 青年",
];
export const colors = [
  "#b99c70",
  "#c3ac53",
  "#7e8d91",
  "#d0b774",
  "#cfcbc0",
  "#616577",
  "#6995ae",
];
export const floorNames = { 0: "十角馆 · 单层", 1: "角岛 · 周边" };
const vertex = (radius, i) => {
  const a = ((-108 + i * 36) * Math.PI) / 180;
  return [Math.cos(a) * radius, Math.sin(a) * radius];
};
export const inner = Array.from({ length: 10 }, (_, i) => vertex(4, i));
export const outer = Array.from({ length: 10 }, (_, i) => vertex(8, i));
const specs = [
  ["kitchen", "厨房", "kitchen"],
  ["leroux", "勒鲁的客房", "guest"],
  ["carr", "卡尔的客房", "guest"],
  ["agatha", "阿加莎的客房", "guest"],
  ["ellery", "埃勒里的客房", "guest"],
  ["entry", "玄关", "entry"],
  ["van", "范达因的客房", "guest"],
  ["orczy", "奥希兹的客房", "guest"],
  ["poe", "爱伦·坡的客房", "guest"],
  ["wash", "盥洗区 · 浴室 / 卫生间", "wash"],
];
export const rooms = [
  {
    id: "hall",
    name: "中央大厅",
    floor: 0,
    polygon: inner,
    chapter: 1,
    type: "hall",
    evidence:
      "第1章与图一：中央为正十角大厅，蓝色瓷砖、十角白桌、十把蓝布白椅，上方有十角天窗。",
    inference: "内外十角形比例、层高和桌椅尺寸为示意。",
  },
  ...specs.map(([id, name, type], i) => ({
    id,
    name,
    type,
    sector: i,
    floor: 0,
    chapter: 1,
    polygon: [inner[i], outer[i], outer[(i + 1) % 10], inner[(i + 1) % 10]],
    evidence:
      type === "guest"
        ? "第1章与图一：七间客房按原图排列，各自通向中央大厅；房间基本造型一致。"
        : type === "entry"
          ? "第1章与图一：由外向内逐渐收窄；玄关外侧蓝色双门，内侧白色双门通大厅。"
          : type === "kitchen"
            ? "第1章与图一：厨房位于玄关对面，白色玻璃双门通大厅，有水龙头、煤气炉与餐具架。"
            : "图一：一个梯形区域分为洗脸台、浴室和卫生间，浴室与卫生间各由盥洗区进入。",
    inference:
      type === "guest"
        ? "窗与房门依据图一；床、书桌、衣柜与镜子依据第3章概括，仅第3章后显示。具体尺寸和放置角度为示意。"
        : "比例、门窗尺寸与设施位置为示意。",
  })),
  {
    id: "island-house",
    name: "十角馆",
    floor: 1,
    chapter: 1,
    type: "house",
    polygon: [
      [1, 3],
      [4, 3],
      [4, 6],
      [1, 6],
    ],
    evidence: "第1章与图二：十角馆位于岛上南部，白墙蓝瓦的单层建筑。",
    inference: "岛图朝向按图二近似，地点轮廓与距离不用于测量。",
  },
  {
    id: "ruins",
    name: "蓝屋废墟",
    floor: 1,
    chapter: 1,
    type: "ruins",
    polygon: [
      [-5, -6],
      [0, -6],
      [0, -2],
      [-5, -2],
    ],
    evidence: "第1章与图二：十角馆以北的松林通往蓝屋废墟。",
    inference: "仅画现存废墟轮廓，不复原蓝屋室内，也不标记案件结果。",
  },
  {
    id: "pier",
    name: "西岸海湾 · 栈桥",
    floor: 1,
    chapter: 1,
    type: "pier",
    polygon: [
      [-6, 6],
      [-2, 6],
      [-2, 9],
      [-6, 9],
    ],
    evidence: "第1章：西岸海湾内有栈桥、小船坞；陡峭石阶通向上方庭院。",
    inference: "台阶长度与路径为示意，不能推算步行或航行时间。",
  },
  {
    id: "rocks",
    name: "西侧岩场",
    floor: 1,
    chapter: 1,
    type: "rocks",
    polygon: [
      [-9, -3],
      [-6, -3],
      [-6, 2],
      [-9, 2],
    ],
    evidence: "第1章与图二：废墟西侧悬崖下有岩区，有台阶通海边。",
    inference: "不添加后续人物行动、发现物或案件标记。",
  },
];
for (const r of rooms) {
  const xs = r.polygon.map((p) => p[0]),
    zs = r.polygon.map((p) => p[1]);
  r.x = Math.min(...xs);
  r.z = Math.min(...zs);
  r.w = Math.max(...xs) - r.x;
  r.d = Math.max(...zs) - r.z;
  r.center = r.polygon.reduce(
    (a, p) => [a[0] + p[0] / r.polygon.length, a[1] + p[1] / r.polygon.length],
    [0, 0],
  );
}
export function contains(r, x, z) {
  let inside = false;
  const p = r.polygon;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if (
      p[i][1] > z !== p[j][1] > z &&
      x < ((p[j][0] - p[i][0]) * (z - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]
    )
      inside = !inside;
  return inside;
}
// A bounding rectangle alone can put a pawn through a trapezoid wall.
export function constrain(r, x, z) {
  if (contains(r, x, z)) return { x, z };
  const [cx, cz] = r.center;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 30; i++) {
    const t = (lo + hi) / 2;
    if (contains(r, cx + (x - cx) * t, cz + (z - cz) * t)) lo = t;
    else hi = t;
  }
  const t = lo * 0.96;
  return { x: cx + (x - cx) * t, z: cz + (z - cz) * t };
}
export const byId = (id) => rooms.find((r) => r.id === id);
export const visibleRooms = (chapter) =>
  rooms.filter((r) => r.chapter <= chapter);
export const freshRecord = () => ({
  version: 1,
  nodes: [{ id: "start", time: "", label: "开始记录", positions: {} }],
  active: 0,
  note: "",
  chapter: 1,
});
export function normalizeRecord(input) {
  if (
    input?.version !== 1 ||
    !Array.isArray(input.nodes) ||
    !input.nodes.length
  )
    return freshRecord();
  const nodes = input.nodes
    .filter(
      (n) =>
        n &&
        typeof n.id === "string" &&
        n.positions &&
        typeof n.positions === "object",
    )
    .map((n) => ({
      ...n,
      time: String(n.time || ""),
      label: String(n.label || "位置记录"),
      positions: Object.fromEntries(
        Object.entries(n.positions)
          .filter(
            ([id, p]) =>
              Number.isInteger(Number(id)) &&
              Number(id) >= 0 &&
              Number(id) < personNames.length &&
              byId(p?.room),
          )
          .map(([id, p]) => {
            const r = byId(p.room);
            const u = Math.max(0.05, Math.min(0.95, Number(p.u) || 0.5));
            const v = Math.max(0.05, Math.min(0.95, Number(p.v) || 0.5));
            const q = constrain(r, r.x + u * r.w, r.z + v * r.d);
            return [
              id,
              { room: p.room, u: (q.x - r.x) / r.w, v: (q.z - r.z) / r.d },
            ];
          }),
      ),
    }));
  if (!nodes.length) return freshRecord();
  return {
    version: 1,
    nodes,
    active: Math.max(
      0,
      Math.min(nodes.length - 1, Math.floor(Number(input.active) || 0)),
    ),
    note: String(input.note || ""),
    chapter: Math.max(1, Math.min(12, Math.floor(Number(input.chapter) || 1))),
  };
}
