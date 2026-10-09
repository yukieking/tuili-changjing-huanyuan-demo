// All geometry is editorial reconstruction, not measured novel evidence.
export const SCENE_VERSION = "soldier-island-v2";
export const people = [
  ["维拉", "秘书", "#c9d9a3"],
  ["隆巴德", "冒险家", "#d6a77a"],
  ["沃格雷夫", "退休法官", "#ad9cc9"],
  ["阿姆斯特朗", "医生", "#7fb0b2"],
  ["布洛尔", "前警探", "#91bda2"],
  ["布伦特", "女士", "#d7a0a8"],
  ["麦克阿瑟", "将军", "#b7b898"],
  ["马斯顿", "青年", "#87a7cf"],
  ["罗杰斯", "管家", "#c6b5a0"],
  ["罗杰斯太太", "女管家", "#aaaece"],
];
export const rooms = [
  {
    id: "living",
    name: "客厅",
    floor: 0,
    x: 100,
    y: 100,
    w: 230,
    h: 175,
    kind: "lounge",
  },
  {
    id: "dining",
    name: "餐厅",
    floor: 0,
    x: 340,
    y: 100,
    w: 220,
    h: 175,
    kind: "dining",
  },
  {
    id: "kitchen",
    name: "厨房",
    floor: 0,
    x: 570,
    y: 100,
    w: 145,
    h: 175,
    kind: "kitchen",
  },
  { id: "hall", name: "入口大厅", floor: 0, x: 100, y: 285, w: 230, h: 120 },
  {
    id: "corridor",
    name: "一层走廊",
    floor: 0,
    x: 340,
    y: 285,
    w: 220,
    h: 120,
  },
  {
    id: "stairs",
    name: "楼梯间",
    floor: 0,
    x: 570,
    y: 285,
    w: 145,
    h: 120,
    kind: "stairs",
  },
  {
    id: "terrace",
    name: "海侧露台",
    floor: 0,
    x: 100,
    y: 415,
    w: 615,
    h: 75,
    kind: "terrace",
  },
  {
    id: "upper0",
    name: "维拉的房间",
    floor: 1,
    x: 100,
    y: 100,
    w: 180,
    h: 150,
    kind: "bedroom",
  },
  {
    id: "upper1",
    name: "隆巴德的房间",
    floor: 1,
    x: 290,
    y: 100,
    w: 180,
    h: 150,
    kind: "bedroom",
  },
  {
    id: "upper2",
    name: "法官的房间",
    floor: 1,
    x: 480,
    y: 100,
    w: 235,
    h: 150,
    kind: "bedroom",
  },
  { id: "upper5", name: "二层走廊", floor: 1, x: 100, y: 260, w: 615, h: 80 },
  {
    id: "upper3",
    name: "医生的房间",
    floor: 1,
    x: 100,
    y: 350,
    w: 300,
    h: 140,
    kind: "bedroom",
  },
  {
    id: "upper4",
    name: "其他客房",
    floor: 1,
    x: 410,
    y: 350,
    w: 305,
    h: 140,
    kind: "bedroom",
  },
  {
    id: "shore",
    name: "登陆码头",
    floor: 2,
    x: -60,
    y: 440,
    w: 100,
    h: 70,
    kind: "dock",
  },
  {
    id: "cliff",
    name: "海岸岩壁",
    floor: 2,
    x: 810,
    y: 200,
    w: 130,
    h: 180,
    kind: "rock",
  },
];
export const roomById = (id) => rooms.find((r) => r.id === id);
export const windows = [
  { id: "window-living", name: "客厅海侧窗", room: "living", side: "left" },
  { id: "window-dining", name: "餐厅外窗", room: "dining", side: "top" },
  ...["upper0", "upper1", "upper2", "upper3", "upper4"].map((room, i) => ({
    id: "window-" + room,
    name: roomById(room).name + "外窗",
    room,
    side: i < 3 ? "top" : "bottom",
  })),
];
export const connections = [
  ["living", "hall"],
  ["living", "dining"],
  ["hall", "corridor"],
  ["corridor", "dining"],
  ["dining", "kitchen"],
  ["kitchen", "stairs"],
  ["corridor", "stairs"],
  ["hall", "terrace"],
  ["stairs", "upper5"],
  ...["upper0", "upper1", "upper2", "upper3", "upper4"].map((r) => [
    "upper5",
    r,
  ]),
  ["terrace", "shore"],
  ["terrace", "cliff"],
].map(([a, b], i) => ({
  id: "door-" + i,
  a,
  b,
  name:
    a === "stairs" && b === "upper5"
      ? "楼梯连接"
      : roomById(a).name + " ↔ " + roomById(b).name,
  stairs: a === "stairs" && b === "upper5",
  outdoor: roomById(a).floor === 2 || roomById(b).floor === 2,
}));
export const edgeBetween = (a, b) =>
  connections.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
export const neighbors = (id) =>
  connections
    .filter((e) => e.a === id || e.b === id)
    .map((e) => (e.a === id ? e.b : e.a));
export function suggestedPath(from, to) {
  let q = [[from]],
    seen = new Set([from]);
  while (q.length) {
    let p = q.shift();
    if (p.at(-1) === to) return p;
    for (let n of neighbors(p.at(-1)))
      if (!seen.has(n)) {
        seen.add(n);
        q.push([...p, n]);
      }
  }
  return [];
}
export const center = (id) => {
  let r = roomById(id);
  return {
    x: r.x + r.w / 2,
    z: r.y + r.h / 2,
    floor: r.floor === 2 ? 0 : r.floor,
    room: id,
  };
};
export function threshold(from, to) {
  let a = roomById(from),
    b = roomById(to),
    ca = center(from),
    cb = center(to);
  if (a.floor !== b.floor) return { ...ca };
  let dx = cb.x - ca.x,
    dz = cb.z - ca.z;
  if (Math.abs(dx / (a.w + b.w)) > Math.abs(dz / (a.h + b.h)))
    return {
      x: dx > 0 ? a.x + a.w : a.x,
      z: Math.max(a.y + 18, Math.min(a.y + a.h - 18, cb.z)),
      floor: a.floor,
      room: from,
    };
  return {
    x: Math.max(a.x + 18, Math.min(a.x + a.w - 18, cb.x)),
    z: dz > 0 ? a.y + a.h : a.y,
    floor: a.floor,
    room: from,
  };
}
export function pathPoints(route) {
  if (!route.path?.length || route.path.some((id) => !roomById(id))) return [];
  let pts = [center(route.path[0])];
  for (let i = 1; i < route.path.length; i++) {
    let a = route.path[i - 1],
      b = route.path[i],
      e = edgeBetween(a, b);
    if (!e) return [];
    if (e.stairs) {
      let low = { ...center("stairs"), z: 337, floor: 0, room: "stairs" },
        high = { ...low, z: 289, floor: 1, room: "upper5" };
      if (a === "stairs") pts.push({ ...low, door: e.id }, high);
      else pts.push({ ...high, door: e.id }, low);
    } else {
      let pa = threshold(a, b),
        pb = threshold(b, a);
      pts.push(
        pa,
        {
          x: (pa.x + pb.x) / 2,
          z: (pa.z + pb.z) / 2,
          floor: pa.floor,
          room: a,
          door: e.id,
        },
        pb,
      );
    }
    pts.push(center(b));
  }
  return pts;
}
const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.z - b.z, ((a.floor || 0) - (b.floor || 0)) * 114);
export function samplePath(route, t) {
  let pts = pathPoints(route);
  if (!pts.length) return null;
  let lens = pts.slice(1).map((p, i) => distance(pts[i], p)),
    total = lens.reduce((a, b) => a + b, 0),
    at =
      Math.max(0, Math.min(1, (t - route.start) / (route.end - route.start))) *
      total;
  for (let i = 0; i < lens.length; i++) {
    if (at <= lens[i] || i === lens.length - 1) {
      let f = lens[i] ? at / lens[i] : 0,
        a = pts[i],
        b = pts[i + 1];
      return {
        x: a.x + (b.x - a.x) * f,
        z: a.z + (b.z - a.z) * f,
        floor: a.floor + (b.floor - a.floor) * f,
        room: f < 0.5 ? a.room : b.room,
      };
    }
    at -= lens[i];
  }
  return pts[0];
}
export const nodeAt = (p, t) =>
  [...p.nodes]
    .sort((a, b) => a.t - b.t)
    .filter((n) => n.t <= t)
    .at(-1) || p.nodes[0];
export function normalizePlan(p) {
  p.sceneVersion = p.sceneVersion || "soldier-island-prototype-v1";
  p.routes = Array.isArray(p.routes) ? p.routes : [];
  p.intervals = p.intervals || [];
  p.nodes.forEach((n) => {
    n.environment = {
      doors: {},
      windows: {},
      keyHolder: "",
      ...(n.environment || {}),
    };
  });
  return p;
}
export function blankPlan(name = "假说 A · 晚餐之后") {
  let pos = Object.fromEntries(
    people.map((_, i) => [
      i,
      {
        room: i < 6 ? "living" : "dining",
        u: 0.22 + (i % 3) * 0.27,
        v: 0.3 + Math.floor((i % 6) / 3) * 0.4,
        angle: 0,
        note: "",
      },
    ]),
  );
  return normalizePlan({
    id: crypto.randomUUID(),
    sceneVersion: SCENE_VERSION,
    name,
    note: "",
    nodes: [
      { t: 0, label: "晚餐之后", positions: structuredClone(pos) },
      { t: 30, label: "自由调查", positions: structuredClone(pos) },
      { t: 60, label: "集合讨论", positions: structuredClone(pos) },
    ],
    routes: [],
    intervals: [],
  });
}
export function validRoute(p, route) {
  let a = p.nodes.find((n) => n.t === route.start)?.positions[route.person],
    b = p.nodes.find((n) => n.t === route.end)?.positions[route.person];
  return (
    route.end > route.start &&
    a?.room === route.path[0] &&
    b?.room === route.path.at(-1) &&
    pathPoints(route).length > 1
  );
}
export function positionsAt(p, t) {
  let pos = structuredClone(nodeAt(p, t).positions);
  for (let [id, v] of Object.entries(pos)) {
    let r = roomById(v.room);
    if (r) {
      pos[id].world = {
        x: r.x + r.w * (v.u ?? 0.5),
        z: r.y + r.h * (v.v ?? 0.5),
        floor: r.floor === 2 ? 0 : r.floor,
        room: r.id,
      };
    }
  }
  for (let route of p.routes) {
    if (t >= route.start && t < route.end && validRoute(p, route))
      pos[route.person] = {
        ...pos[route.person],
        room: samplePath(route, t).room,
        world: samplePath(route, t),
        moving: true,
      };
  }
  return pos;
}
export function ensureNode(p, t, label) {
  let found = p.nodes.find((n) => n.t === t);
  if (found) return found;
  let base = structuredClone(nodeAt(p, t));
  const positions = positionsAt(p, t);
  for (const position of Object.values(positions)) {
    const room = roomById(position.room);
    if (position.world && room) {
      position.u = Math.max(0, Math.min(1, (position.world.x - room.x) / room.w));
      position.v = Math.max(0, Math.min(1, (position.world.z - room.y) / room.h));
    }
    delete position.world;
    delete position.moving;
  }
  let n = { ...base, t, label, positions };
  p.nodes.push(n);
  return n;
}
export function addRoute(p, route) {
  if (!route.path?.length || route.path.length < 2 || !pathPoints(route).length)
    throw Error("请选择经过相邻空间的完整路线");
  if (route.end <= route.start || route.start < 0 || route.end > 120)
    throw Error("结束时刻必须晚于开始时刻，且在 20:00—22:00 内");
  let start = ensureNode(p, route.start, "出发"),
    end = ensureNode(p, route.end, "到达");
  start.positions[route.person] = {
    ...start.positions[route.person],
    room: route.path[0],
    u: 0.5,
    v: 0.5,
  };
  end.positions[route.person] = {
    ...end.positions[route.person],
    room: route.path.at(-1),
    u: 0.5,
    v: 0.5,
  };
  p.routes.push({ ...route, id: crypto.randomUUID(), type: "hypothesis" });
  p.sceneVersion = SCENE_VERSION;
}
export function conflicts(p) {
  let out = [];
  let sorted = [...p.nodes].sort((a, b) => a.t - b.t);
  for (let route of p.routes) {
    let name = people[route.person]?.[0] || "人物";
    if (!validRoute(p, route)) {
      out.push(`${name}的路线与节点位置不一致，或连接无效；请重新编辑。`);
      continue;
    }
    let pts = pathPoints(route),
      total = pts
        .slice(1)
        .reduce((sum, pt, i) => sum + distance(pts[i], pt), 0),
      travel = 0;
    for (let i = 1; i < pts.length; i++) {
      travel += distance(pts[i - 1], pts[i]);
      if (pts[i].door) {
        let t = route.start + ((route.end - route.start) * travel) / total;
        if (nodeAt(p, t).environment?.doors?.[pts[i].door] === "locked")
          out.push(
            `${name}在约 ${formatTime(t)} 的路线经过锁闭连接「${connections.find((e) => e.id === pts[i].door).name}」；持钥匙不等于已开锁。`,
          );
      }
    }
    for (let n of sorted.filter((n) => n.t > route.start && n.t < route.end)) {
      let expected = samplePath(route, n.t).room,
        actual = n.positions[route.person]?.room;
      if (actual && actual !== expected)
        out.push(`${name}在 ${formatTime(n.t)} 的位置快照与行动路线不一致。`);
    }
  }
  for (let i = 0; i < p.routes.length; i++)
    for (let j = i + 1; j < p.routes.length; j++) {
      let a = p.routes[i],
        b = p.routes[j];
      if (a.person === b.person && a.start < b.end && b.start < a.end)
        out.push(`${people[a.person][0]}有重叠的行动路线。`);
    }
  for (let i = 0; i < p.intervals.length; i++) {
    let a = p.intervals[i];
    for (let j = i + 1; j < p.intervals.length; j++) {
      let b = p.intervals[j];
      if (
        a.person === b.person &&
        a.room !== b.room &&
        a.start < b.end &&
        b.start < a.end
      )
        out.push(
          `${people[a.person][0]}在重叠时间被记录于不同房间（${a.type === "testimony" || b.type === "testimony" ? "涉及人物证词，需核对" : "用户假设冲突"}）。`,
        );
    }
    for (let r of p.routes)
      if (
        r.person === a.person &&
        r.start < a.end &&
        a.start < r.end &&
        r.path.some((id) => id !== a.room)
      )
        out.push(
          `${people[a.person][0]}的行动与「${roomById(a.room)?.name}停留」区间重叠（${a.type === "testimony" ? "证词与假说差异" : "假设冲突"}）。`,
        );
  }
  for (let i = 1; i < sorted.length; i++)
    for (let [id, pos] of Object.entries(sorted[i].positions)) {
      let prev = sorted[i - 1].positions[id];
      if (
        prev &&
        prev.room !== pos.room &&
        !p.routes.some(
          (r) =>
            String(r.person) === id &&
            r.start >= sorted[i - 1].t &&
            r.end <= sorted[i].t,
        )
      )
        out.push(
          `${people[id][0]}在 ${formatTime(sorted[i - 1].t)}—${formatTime(sorted[i].t)} 改变位置，未指定路线。`,
        );
    }
  return [...new Set(out)];
}
export const formatTime = (t) => {
  let total = Math.round(t);
  return `${20 + Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
