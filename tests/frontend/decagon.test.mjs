import test from "node:test";
import assert from "node:assert/strict";
import {
  rooms,
  outer,
  inner,
  byId,
  personNames,
  contains,
  constrain,
  freshRecord,
  normalizeRecord,
} from "../../src/main/resources/static/experiments/decagon/data.js";
const area = (p) =>
  Math.abs(
    p.reduce((s, a, i) => {
      const b = p[(i + 1) % p.length];
      return s + a[0] * b[1] - b[0] * a[1];
    }, 0) / 2,
  );
test("ten trapezoids and the central hall cover the decagon without invented rectangular wings", () => {
  const sectors = rooms.filter((r) => r.sector !== undefined);
  assert.equal(sectors.length, 10);
  assert.equal(sectors.filter((r) => r.type === "guest").length, 7);
  assert.ok(
    Math.abs(
      sectors.reduce((s, r) => s + area(r.polygon), area(inner)) - area(outer),
    ) < 1e-8,
  );
  for (const r of sectors) {
    assert.ok(contains(r, ...r.center));
    assert.ok(!contains(byId("hall"), ...r.center));
  }
});
test("source map room order and kitchen opposite the entrance remain intact", () => {
  const order = rooms.filter((r) => r.sector !== undefined).map((r) => r.id);
  assert.deepEqual(order, [
    "kitchen",
    "leroux",
    "carr",
    "agatha",
    "ellery",
    "entry",
    "van",
    "orczy",
    "poe",
    "wash",
  ]);
  assert.equal((byId("entry").sector - byId("kitchen").sector + 10) % 10, 5);
  assert.equal(
    new Set(rooms.filter((r) => r.sector !== undefined).map((r) => r.floor))
      .size,
    1,
  );
});
test("a pawn outside a trapezoid is brought inside; a valid point is preserved", () => {
  const r = byId("orczy"),
    p = constrain(r, r.x - 10, r.z - 10);
  assert.ok(contains(r, p.x, p.z));
  const q = constrain(r, ...r.center);
  assert.deepEqual(q, { x: r.center[0], z: r.center[1] });
});
test("independent reading records begin blank and reject characters belonging to another work", () => {
  const a = freshRecord();
  assert.equal(a.chapter, 1);
  assert.equal(personNames.length, 7);
  assert.deepEqual(a.nodes[0].positions, {});
  a.nodes[0].positions = {
    0: { room: "ellery", u: 0.5, v: 0.5 },
    9: { room: "hall", u: 0.5, v: 0.5 },
    1: { room: "vera", u: 0.5, v: 0.5 },
  };
  const b = normalizeRecord(JSON.parse(JSON.stringify(a)));
  assert.deepEqual(Object.keys(b.nodes[0].positions), ["0"]);
  assert.equal(normalizeRecord({ ...a, chapter: 99 }).chapter, 12);
});
