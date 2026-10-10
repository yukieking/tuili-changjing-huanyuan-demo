import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPlan} from '../../src/main/resources/static/atlas/kubi/flat-map.js';
import {rooms} from '../../src/main/resources/static/atlas/kubi/geometry.js';
test('crowded Kubi locations use one count badge while retaining all character names',()=>{
 const room=rooms.find(r=>r.id==='middleRoom'),names=['甲','乙','丙','丁','戊'];
 const positions=Object.fromEntries(names.map((_,i)=>[String(i),{room:room.id}]));
 const html=drawPlan([room],[],positions,names);
 assert.equal((html.match(/fill="#45696c"/g)||[]).length,1);
 for(const name of names)assert.ok(html.includes(name));
 assert.ok(html.includes('>5</text>'));
 assert.ok(html.includes('查看中婚舍'));
});
test('numbered maps preserve accessible room and evidence selection without injecting note text',()=>{
 const room=rooms.find(r=>r.id==='shrine');
 const html=drawPlan([room],[{id:'test',place:'shrine',number:1,title:'<危险>',state:'已记录'}],{},[]);
 assert.ok(html.includes('data-room="shrine"'));
 assert.ok(html.includes('data-clue="test"'));
 assert.ok(html.includes('&lt;危险&gt;'));
 assert.ok(!html.includes('<危险>'));
});
