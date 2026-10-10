// Pure replay: no user-authored placements and no carry-forward alibis.
export function eventsFor(book,mode='observed'){
 return [...book.observed].sort((a,b)=>a.day-b.day||a.seq-b.seq);
}
export function snapshot(book,geometry,mode,index){
 const events=eventsFor(book,mode),i=Math.max(0,Math.min(events.length-1,Math.trunc(Number(index)||0))),event=events[i];
 const clues=new Map(),bodies={},dead=new Set(),lastSeen={},unlocked=new Set(geometry.initialRooms);let fire=false;
 const actors=e=>e.actors;
 for(const step of events.slice(0,i+1)){
  const changes=step.changes;
  for(const c of changes){const old=clues.get(c.id);clues.set(c.id,{...c,source:step.source,at:step.time,history:[...(old?.history||[]),{state:c.state,place:c.place,at:step.time,source:step.source}]});}
  const deaths=step.deaths||{};
  for(const [id,place] of Object.entries(deaths)){bodies[id]={place,note:step.apparentDeaths?.includes(id)?'当时被认定死亡，尚未独立核实':'遗体最后确证位置',source:step.source};dead.add(id);}
  for(const [id,place] of Object.entries(step.moveBodies||{}))if(bodies[id])bodies[id]={...bodies[id],place,source:step.source};
  if(step.clearBodies)for(const id of Object.keys(bodies))delete bodies[id];
  for(const id of step.removeBodies||[])delete bodies[id];
  for(const room of step.unlock||[])unlocked.add(room);
  fire ||= !!step.fire;
  for(const [id,p] of Object.entries(actors(step)))lastSeen[id]={...p,at:step.time};
 }
 const current={};for(const [id,p] of Object.entries(actors(event)))current[id]={...p,at:event.time};
 for(const [id,p] of Object.entries(bodies))current[id]={...p,dead:true};
 const map=event.map===null?null:(event.map??geometry.byId(Object.values(actors(event)).find(p=>geometry.byId(p.place))?.place)?.floor??0);
 return {event,index:i,total:events.length,current,clues:[...clues.values()],unlocked:[...unlocked],lastSeen,dead:[...dead],fire,map};
}
