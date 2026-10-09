import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {eventsFor,snapshot,identity} from '../../src/main/resources/static/atlas/engine.js';
const root=new URL('../../src/main/resources/static/atlas/',import.meta.url);
const books={};
for(const id of ['decagon','christie','kubi'])books[id]={book:JSON.parse(await readFile(new URL(`${id}/events.json`,root))),geometry:await import(new URL(`${id}/geometry.js`,root))};
const state=(id,event,mode='observed')=>{const {book,geometry}=books[id];const i=eventsFor(book,mode).findIndex(e=>e.id===event);assert.ok(i>=0,event);return snapshot(book,geometry,mode,i);};
for(const [id,{book,geometry}]of Object.entries(books)){
 test(`${id}: source references and locations resolve across the full timeline`,()=>{
  assert.equal(new Set(eventsFor(book,'truth').map(e=>e.id)).size,eventsFor(book,'truth').length);
  const location=p=>p===null||p===undefined||geometry.byId(p)||book.offPlaces[p];
  for(const mode of ['observed','truth'])for(let i=0;i<eventsFor(book,mode).length;i++){
   const e=eventsFor(book,mode)[i];assert.ok(e.source,e.id);assert.ok(e.time,e.id);
   for(const [person,p]of Object.entries(e.actors)){assert.ok(book.names[person],`${e.id} ${person}`);assert.ok(location(p.place),`${e.id}: ${p.place}`);}
   for(const c of e.changes)assert.ok(location(c.place),`${e.id}: clue ${c.id} ${c.place}`);
   const s=snapshot(book,geometry,mode,i);
   for(const [person,p]of Object.entries(s.current)){assert.ok(book.names[person]);assert.ok(location(p.place),`${e.id} current ${p.place}`);}
   for(const person of s.dead)assert.ok(book.names[person]);
   for(const room of s.unlocked)assert.ok(geometry.byId(room),`unlocked ${room}`);
  }
 });
 test(`${id}: rewinding reconstructs pristine initial state`,()=>{
  const first=snapshot(book,geometry,'observed',0);snapshot(book,geometry,'truth',9999);
  assert.deepEqual(snapshot(book,geometry,'observed',0),first);assert.equal(first.dead.length,0);
 });
}
test('unobserved living characters are not carried into the next event',()=>{
 const a=state('christie','veraRoom');assert.ok(a.current['0']);assert.equal(a.current['1'],undefined);assert.ok(a.lastSeen['1']);
});
test('Wargrave apparent death is separated from actual death',()=>{
 assert.ok(state('christie','wargraveApparent').dead.includes('2'));
 assert.ok(!state('christie','wargraveApparent','truth').dead.includes('2'));
 assert.ok(state('christie','lastShot','truth').dead.includes('2'));
 assert.equal(state('christie','marstonMove').current['7'].place,'guests');
});
test('kubi patrol distinguishes Futami from the author',()=>{
 const s=state('kubi','departRite');assert.ok(s.current['24']);assert.equal(s.current['23'],undefined);
});
test('kubi body identities and conditional alias preserve physical victims',()=>{
 assert.ok(state('kubi','femaleFound').dead.includes('21'));
 assert.ok(state('kubi','femaleFound','truth').dead.includes('3'));
 assert.ok(!state('kubi','femaleFound','truth').dead.includes('21'));
 assert.ok(state('kubi','maleFound','truth').dead.includes('29'));
 const {book}=books.kubi;assert.equal(identity(book,'truth',29,{day:10,seq:1700}),'29');assert.equal(identity(book,'truth',29,{day:10,seq:1725}),'21');
 assert.equal(state('kubi','forestEvidence','truth').current['29'],undefined);
});
test('hidden decagon spaces only unlock on discovery',()=>{
 const before=state('decagon','arrive'),after=state('decagon','passage');assert.ok(after.unlocked.length>before.unlocked.length);
 assert.equal(before.clues.some(c=>c.actual),false);
});
test('a severed hand does not leave the ring on the missing hand in observed replay',()=>{
 const ring=state('decagon','orczyfound').clues.find(c=>c.id==='ring');assert.equal(ring.place,null);
 const actual=state('decagon','orczyfound','truth').clues.find(c=>c.id==='ring');assert.equal(actual.place,'behind');
});
