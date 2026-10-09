import test from "node:test";
import assert from "node:assert/strict";
import { freshRecord, normalizeRecord, visibleRooms, byId } from "../../src/main/resources/static/experiments/reading-house/data.js";
test("reading starts with no implied positions or case chronology", () => {
 const a=freshRecord(), b=freshRecord();
 assert.deepEqual(a.nodes[0].positions, {}); assert.equal(a.nodes[0].time, "");
 a.nodes[0].positions[0]={room:"hall",u:.5,v:.5}; assert.deepEqual(b.nodes[0].positions, {});
});
test("later spaces stay outside early reading scope; adjacent bath and upper staff remain distinct", () => {
 assert.ok(!visibleRooms(2).some(r=>r.id==="neighbor"));
 assert.ok(visibleRooms(3).some(r=>r.id==="neighbor"));
 assert.ok(!visibleRooms(7).some(r=>r.id==="staff"));
 assert.equal(byId("bath").floor,byId("vera").floor);
 assert.ok(byId("staff").floor > byId("vera").floor);
});
test("saving a reading hypothesis preserves later positions while reader changes progress", () => {
 const a=freshRecord(); a.nodes[0].positions[0]={room:"staff",u:.25,v:.8}; a.note="核对楼梯";
 const b=normalizeRecord(JSON.parse(JSON.stringify(a)));
 assert.deepEqual(b.nodes[0].positions,a.nodes[0].positions); assert.equal(b.chapter,2); assert.equal(b.note,a.note);
});
test("malformed stored records recover without unknown rooms or out-of-range active nodes", () => {
 assert.deepEqual(normalizeRecord({version:1,nodes:[null]}),freshRecord());
 const a=freshRecord(); a.active=7.5; a.nodes[0].positions={0:{room:"hall",u:-4,v:4},12:{room:"hall"},1:{room:"fake"}};
 const b=normalizeRecord(a); assert.equal(b.active,0); assert.deepEqual(Object.keys(b.nodes[0].positions),["0"]);
 assert.equal(b.nodes[0].positions[0].u,.05); assert.equal(b.nodes[0].positions[0].v,.95);
});
