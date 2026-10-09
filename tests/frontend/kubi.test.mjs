import test from "node:test";
import assert from "node:assert/strict";
import {
  places,
  people,
  byId,
  edges,
  routeBetween,
  routePoints,
  helix,
  positionAt,
  blankPlan,
  clock,
  conflicts,
} from "../../src/main/resources/static/works/kubi/data.js";
test("three entrances remain distinct, northern well and separate village shrine", () => {
  assert.equal(people.length, 36);
  assert.ok(byId("north").z < 0 && byId("south").z > 0 && byId("east").x > 0);
  assert.ok(byId("well").z < 0);
  assert.notEqual(byId("jinja").id, byId("shrine").id);
  for (const [a, b] of edges) {
    assert.ok(byId(a) && byId(b));
  }
});
test("all three marriage lodges require both independent spiral lanes", () => {
  for (const id of ["frontRoom", "middleRoom", "rearRoom"]) {
    const path = routeBetween("shrine", id);
    assert.deepEqual(path.slice(0, 4), [
      "shrine",
      "towerEntry",
      "towerTop",
      "towerExit",
    ]);
    assert.ok(routePoints(path).some((p) => p.y > 8));
    const back = routeBetween(id, "shrine");
    assert.ok(back.indexOf("towerExit") < back.indexOf("towerTop"));
    assert.ok(back.indexOf("towerTop") < back.indexOf("towerEntry"));
  }
});
test("double helices remain physically separated at each height", () => {
  for (let i = 0; i <= 100; i++) {
    const a = helix("A", i / 100),
      b = helix("B", i / 100);
    assert.equal(a.y, b.y);
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) > 7.9);
  }
  const path = routePoints(routeBetween("shrine", "frontRoom"));
  for (let i = 1; i < path.length; i++)
    assert.ok(
      Math.hypot(
        path[i].x - path[i - 1].x,
        path[i].y - path[i - 1].y,
        path[i].z - path[i - 1].z,
      ) < 12,
    );
});
test("playback passes above ground through the tower and respects completed routes", () => {
  const p = blankPlan();
  p.routes.push({
    person: 3,
    start: 30,
    end: 60,
    path: routeBetween("shrine", "frontRoom"),
  });
  assert.equal(positionAt(p, 3, 29), null);
  assert.ok(positionAt(p, 3, 45).y > 3);
  assert.equal(positionAt(p, 3, 61).x, byId("frontRoom").x);
  p.placements.push({ person: 3, t: 65, place: "well" });
  assert.equal(positionAt(p, 3, 70).x, byId("well").x);
});
test("outside toilet cannot be reached through a new lodge door", () => {
  const path = routeBetween("middleRoom", "toilet");
  assert.ok(path.includes("shrine") && path.includes("courtyard"));
  assert.ok(path.includes("towerTop"));
});
test("separate ritual periods and overlapping route checks", () => {
  assert.equal(clock(0, "thirteen"), "18:30");
  assert.equal(clock(0, "wedding"), "15:30");
  const p = blankPlan();
  p.routes = [
    { person: 3, start: 0, end: 30, path: routeBetween("shrine", "frontRoom") },
    {
      person: 3,
      start: 20,
      end: 40,
      path: routeBetween("frontRoom", "shrine"),
    },
  ];
  assert.ok(conflicts(p).some((x) => x.includes("重叠")));
  p.routes.pop();
  p.placements = [{ person: 3, t: 10, place: "well" }];
  assert.ok(conflicts(p).some((x) => x.includes("快照")));
});

test("a stationary pawn placed on the tower top stays above ground", () => {
  const p = blankPlan();
  p.placements = [{ person: 3, t: 0, place: "towerTop" }];
  assert.ok(positionAt(p, 3, 20).y > 8);
});
