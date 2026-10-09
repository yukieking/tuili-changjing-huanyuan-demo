// Paraphrased spatial evidence from the user-supplied EPUB. Coordinates are illustrative.
export const rooms = [
  {
    id: "hall",
    name: "入口大厅",
    floor: 0,
    x: 0,
    z: 4,
    w: 5,
    d: 3,
    chapter: 2,
    type: "hall",
    evidence: "第2章：由岩石台阶到平台，再由敞开的房门进入宽敞大厅。",
    inference: "大厅与主楼梯的距离、形状为推定。",
  },
  {
    id: "living",
    name: "休息厅",
    floor: 0,
    x: 0,
    z: 0,
    w: 5,
    d: 4,
    chapter: 3,
    type: "living",
    evidence: "第3章：有壁炉；壁炉旁有门通往邻室。",
    inference: "休息厅在这一侧、尺寸与家具摆放为推定。",
  },
  {
    id: "dining",
    name: "餐厅",
    floor: 0,
    x: 5.3,
    z: 0,
    w: 4.5,
    d: 4,
    chapter: 3,
    type: "dining",
    evidence: "第3章：晚餐在此举行，餐桌上有十个小瓷人。",
    inference: "餐厅与休息厅的相对方位、门的位置没有完整交代。",
  },
  {
    id: "neighbor",
    name: "邻室",
    floor: 0,
    x: -3,
    z: 0,
    w: 2.7,
    d: 4,
    chapter: 3,
    type: "neighbor",
    evidence: "第3章：与休息厅相邻，有门相通；桌上的留声机靠共墙放置。",
    inference: "邻室用途、面积以及墙孔的具体高度未定。",
  },
  {
    id: "kitchen",
    name: "厨房",
    floor: 0,
    x: 5.3,
    z: 4,
    w: 4.5,
    d: 3,
    chapter: 8,
    type: "kitchen",
    evidence: "第8章等：厨房承担日常服务，原文另提小厨房。",
    inference: "厨房、备餐区和储藏空间的分隔与通道未定。",
  },
  {
    id: "stairs",
    name: "主楼梯",
    floor: 0,
    x: 5.3,
    z: 7.3,
    w: 2,
    d: 3,
    chapter: 2,
    type: "stairs",
    evidence: "第2章：女管家带维拉上楼。后文有沿走廊返回楼梯的描述。",
    inference: "楼梯形式、踏步数与此处的位置为推定。",
  },
  {
    id: "corridor",
    name: "客房走廊",
    floor: 1,
    x: 0,
    z: 4,
    w: 9.8,
    d: 2,
    chapter: 2,
    type: "corridor",
    evidence: "第2章：维拉的卧室在甬道尽头。",
    inference: "走廊长度、折向以及其余房间的排列未定。",
  },
  {
    id: "vera",
    name: "维拉的卧室",
    floor: 1,
    x: 0,
    z: 0,
    w: 4,
    d: 4,
    chapter: 2,
    type: "vera",
    evidence: "第2章：走廊尽头的卧室；一扇大窗面海，另一扇向东，有相连浴室。",
    inference: "这里只固定卧室与浴室相连；房间轴向与窗口坐标为示意。",
  },
  {
    id: "bath",
    name: "维拉的浴室",
    floor: 1,
    x: -2.7,
    z: 0,
    w: 2.5,
    d: 4,
    chapter: 2,
    type: "bath",
    evidence: "第2章：卧室另一边有铺浅蓝色瓷砖的浴室，门敞开。",
    inference: "浴缸、洗手台与门位为展示补全。",
  },
  {
    id: "guests",
    name: "其他客房 · 未定",
    floor: 1,
    x: 4.3,
    z: 0,
    w: 5.5,
    d: 4,
    chapter: 2,
    type: "unknown",
    evidence: "第2章：每位来客分配房间。后文反复描写各自卧室。",
    inference: "不把缺少依据的房间顺序画成确定隔间。",
  },
  {
    id: "staff",
    name: "佣人房",
    floor: 2,
    x: 1,
    z: 0,
    w: 5,
    d: 4,
    chapter: 8,
    type: "staff",
    evidence: "第8章：客房楼道另有小楼梯，上行至佣人房附近的小楼道。",
    inference: "上层房间数量、层高和轮廓未定；此图只表达上行关系。",
  },
];
export const floorNames = ["01 / 公共空间", "02 / 客房层", "上层 / 佣人房"];
export const personNames = [
  "维拉",
  "隆巴德",
  "沃格雷夫",
  "阿姆斯特朗",
  "布洛尔",
  "布伦特",
  "麦克阿瑟",
  "马斯顿",
  "罗杰斯",
  "罗杰斯太太",
];
export const roles = [
  "秘书",
  "冒险家",
  "法官",
  "医生",
  "前警探",
  "女士",
  "将军",
  "青年",
  "管家",
  "女管家",
];
export const colors = [
  "#c9a384",
  "#709d99",
  "#a59cc0",
  "#80adb9",
  "#798c9d",
  "#b98b9b",
  "#87917b",
  "#c7ac70",
  "#9b8f7b",
  "#8f839e",
];
export const byId = (id) => rooms.find((r) => r.id === id);
export const visibleRooms = (chapter) =>
  rooms.filter((r) => r.chapter <= chapter);
export const freshRecord = () => ({
  version: 1,
  nodes: [{ id: "start", time: "", label: "开始记录", positions: {} }],
  active: 0,
  note: "",
  chapter: 2,
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
              Number(id) < 10 &&
              byId(p?.room),
          )
          .map(([id, p]) => [
            id,
            {
              room: p.room,
              u: Math.max(0.05, Math.min(0.95, Number(p.u) || 0.5)),
              v: Math.max(0.05, Math.min(0.95, Number(p.v) || 0.5)),
            },
          ]),
      ),
    }));
  if (!nodes.length) return freshRecord();
  return {
    version: 1,
    nodes,
    active: Math.max(0, Math.min(nodes.length - 1, Math.floor(Number(input.active) || 0))),
    note: String(input.note || ""),
    chapter: Math.max(2, Math.min(18, Math.floor(Number(input.chapter) || 2))),
  };
}
