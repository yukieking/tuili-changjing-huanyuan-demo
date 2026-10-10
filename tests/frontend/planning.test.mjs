import test from 'node:test';
import assert from 'node:assert/strict';
import {timeline,plannedState,conflicts,validatePlan} from '../../src/main/resources/static/atlas/planning.js';
const record=(id,type,start,end,place='hall')=>({id,type,person:'0',place,start,end,text:''});
test('personal points persist until the next placement, intervals stop at their end',()=>{
 const p={name:'A',records:[record('a','hypothesis',480,480),record('b','hypothesis',540,600,'room')]};
 assert.equal(plannedState(p,500).current[0].place,'hall');assert.equal(plannedState(p,540).current[0].place,'room');assert.equal(plannedState(p,600).current[0],undefined);assert.deepEqual(timeline(p),[0,480,540,600]);
});
test('testimony is not a placement and disagreement is detected over its interval',()=>{
 const p={name:'A',records:[record('a','hypothesis',480,540),record('b','testimony',490,520,'room')]};
 assert.equal(plannedState(p,500).current[0].place,'hall');assert.equal(conflicts(p).length,1);
 assert.equal(conflicts({records:[record('a','hypothesis',480,540),record('b','testimony',540,600,'room')]}).length,0);
});
test('overlapping positions and simultaneous points are detected, subsequent moves are allowed',()=>{
 assert.equal(conflicts({records:[record('a','hypothesis',480,520),record('b','hypothesis',490,510,'room')]}).length,1);
 assert.equal(conflicts({records:[record('a','hypothesis',480,480),record('b','hypothesis',480,480,'room')]}).length,1);
 assert.equal(conflicts({records:[record('a','hypothesis',480,480),record('b','hypothesis',490,490,'room')]}).length,0);
});
test('notes do not place anyone; user bodies are separate from observed records',()=>{
 const p={records:[record('a','note',0,0),record('b','body',480,480,'room')]};assert.deepEqual(plannedState(p,0).current,{});assert.deepEqual(plannedState(p,500).dead,['0']);assert.equal(plannedState(p,0).dead.length,0);
});
test('import rejects invalid times, duplicate ids and foreign places without mutation',()=>{
 const p={name:'A',records:[record('a','hypothesis',480,540)]};const copy=validatePlan(p,['A'],['hall']);copy.records[0].place='room';assert.equal(p.records[0].place,'hall');
 for(const records of [[record('a','hypothesis',540,480)],[record('a','hypothesis',480,500,'foreign')],[record('a','hypothesis',480,500),record('a','note',500,500)]])assert.throws(()=>validatePlan({name:'A',records},['A'],['hall']));
});
