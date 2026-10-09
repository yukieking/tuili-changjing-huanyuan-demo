import test from "node:test";
import assert from "node:assert/strict";
import {
  blankPlan,
  emptyPlan,
  addRoute,
  suggestedPath,
  validRoute,
  positionsAt,
  pathPoints,
  conflicts,
  normalizePlan,
  edgeBetween,
  ensureNode,
} from "../../src/main/resources/static/domain.js";
test("personal records have no demo positions or invented events, but accept a confirmed route", () => {
  const p = emptyPlan("读者自己的疑点");
  assert.deepEqual(positionsAt(p, 0), {});
  assert.equal(p.nodes.length, 1);
  assert.equal(p.nodes[0].label, "开始记录");
  addRoute(p, {
    person: 0,
    start: 0,
    end: 10,
    path: suggestedPath("living", "upper0"),
  });
  assert.equal(p.routes.length, 1);
  assert.ok(validRoute(p, p.routes[0]));
  assert.equal(positionsAt(p, 10)[0].room, "upper0");
  assert.deepEqual(conflicts(p), []);
});
test("demo status survives a rename without being applied to empty personal records", () => {
  const demo = blankPlan();
  demo.name = "重命名的结构体验";
  normalizePlan(demo);
  assert.equal(demo.demo, true);
  assert.equal(emptyPlan().demo, false);
});
test("confirmed multi-floor route interpolates through stairwell in both directions", () => {
  let p = blankPlan(),
    path = suggestedPath("living", "upper0");
  assert.ok(path.includes("stairs") && path.includes("upper5"));
  addRoute(p, { person: 0, start: 0, end: 10, path });
  let r = p.routes[0];
  assert.ok(validRoute(p, r));
  assert.equal(positionsAt(p, 0)[0].world.floor, 0);
  assert.equal(positionsAt(p, 10)[0].world.floor, 1);
  assert.ok(
    Array.from(
      { length: 99 },
      (_, i) => positionsAt(p, (i + 1) / 10)[0].world.floor,
    ).some((f) => f > 0 && f < 1),
  );
  addRoute(p, { person: 0, start: 10, end: 20, path: [...path].reverse() });
  assert.equal(positionsAt(p, 20)[0].world.floor, 0);
  assert.ok(pathPoints(p.routes[1]).some((pt) => pt.floor === 0));
});
test("invalid adjacency or invalid duration never silently becomes a route", () => {
  let p = blankPlan();
  assert.throws(() =>
    addRoute(p, { person: 0, start: 0, end: 10, path: ["living", "upper0"] }),
  );
  assert.throws(() =>
    addRoute(p, {
      person: 0,
      start: 10,
      end: 0,
      path: suggestedPath("living", "upper0"),
    }),
  );
  assert.equal(p.routes.length, 0);
});
test("locked doors are evaluated at the route crossing time", () => {
  let p = blankPlan();
  addRoute(p, { person: 0, start: 0, end: 10, path: ["living", "hall"] });
  let id = edgeBetween("living", "hall").id;
  p.nodes[0].environment.doors[id] = "locked";
  assert.ok(conflicts(p).some((s) => s.includes("锁闭")));
  let unlocked = ensureNode(p, 1, "开锁");
  unlocked.environment.doors[id] = "open";
  unlocked.positions[0].room = "living";
  assert.ok(!conflicts(p).some((s) => s.includes("锁闭")));
});
test("stale endpoints stop movement and produce a conflict", () => {
  let p = blankPlan();
  addRoute(p, { person: 0, start: 0, end: 10, path: ["living", "hall"] });
  p.nodes.find((n) => n.t === 10).positions[0].room = "kitchen";
  assert.ok(!validRoute(p, p.routes[0]));
  assert.ok(conflicts(p).some((s) => s.includes("节点位置不一致")));
  assert.ok(!positionsAt(p, 5)[0].moving);
});
test("testimony remains distinct from hypotheses and overlapping actions are flagged", () => {
  let p = blankPlan();
  addRoute(p, { person: 0, start: 0, end: 10, path: ["living", "hall"] });
  addRoute(p, { person: 0, start: 5, end: 15, path: ["living", "dining"] });
  p.intervals.push({
    person: 0,
    room: "living",
    start: 0,
    end: 10,
    type: "testimony",
    approx: true,
  });
  assert.ok(conflicts(p).some((s) => s.includes("重叠的行动")));
  assert.ok(conflicts(p).some((s) => s.includes("证词与假说差异")));
  assert.equal(p.intervals[0].type, "testimony");
});
test("old snapshot is upgraded without losing positions or notes", () => {
  let p = {
    nodes: [
      { t: 0, positions: { 0: { room: "living", u: 0.3, note: "旧备注" } } },
    ],
    routes: {},
    note: "旧笔记",
  };
  normalizePlan(p);
  assert.equal(p.nodes[0].positions[0].note, "旧备注");
  assert.equal(p.note, "旧笔记");
  assert.deepEqual(p.routes, []);
  assert.ok(p.nodes[0].environment);
  assert.equal(p.sceneVersion, "soldier-island-prototype-v1");
});

test("adding a state node during movement snapshots the current route location", () => {
  const p = blankPlan();
  addRoute(p, {
    person: 0,
    start: 0,
    end: 10,
    path: suggestedPath("living", "upper0"),
  });
  const expected = positionsAt(p, 5)[0].room;
  const n = ensureNode(p, 5, "开窗");
  assert.equal(n.positions[0].room, expected);
  assert.equal(n.positions[0].world, undefined);
  assert.ok(!conflicts(p).some((s) => s.includes("快照与行动路线不一致")));
});
