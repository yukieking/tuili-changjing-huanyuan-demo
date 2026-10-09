// Pure replay: no user-authored placements and no carry-forward alibis.
export function eventsFor(book,mode='observed'){
 return [...book.observed,...(mode==='truth'?book.truthOnly:[])].sort((a,b)=>a.day-b.day||a.seq-b.seq);
}
export function identity(book,mode,id,event){
 id=String(id);if(mode!=='truth')return id;
 if(book.aliases?.[id]!==undefined)id=String(book.aliases[id]);
 for(const r of book.aliasRules||[])if(id===String(r.from)&&(event.day>r.day||event.day===r.day&&event.seq>=r.seq))id=String(r.to);
 return id;
}
export function snapshot(book,geometry,mode,index){
 const events=eventsFor(book,mode),i=Math.max(0,Math.min(events.length-1,Math.trunc(Number(index)||0))),event=events[i];
 const clues=new Map(),bodies={},dead=new Set(),lastSeen={},unlocked=new Set(geometry.initialRooms);let fire=false;
 const actors=e=>mode==='truth'&&e.truthActors!==undefined?e.truthActors:e.actors;
 for(const step of events.slice(0,i+1)){
  const changes=mode==='truth'&&step.truthChanges?[...step.changes.filter(c=>!step.truthChanges.some(t=>t.id===c.id)),...step.truthChanges]:step.changes;
  for(const c of changes){const old=clues.get(c.id);clues.set(c.id,{...c,source:step.source,at:step.time,actual:c.truth?{detail:c.detail,source:step.source}:old?.actual,history:[...(old?.history||[]),{state:c.state,place:c.place,at:step.time,source:step.source}]});}
  const deaths=mode==='truth'&&step.truthDeaths!==undefined?step.truthDeaths:step.deaths||{};
  for(const [id,place] of Object.entries(deaths)){bodies[id]={place,note:mode==='observed'&&step.truthDeaths&&!(id in step.truthDeaths)?'当时被认定死亡，尚未独立核实':'遗体最后确证位置',source:step.source};dead.add(id);}
  for(const [id,place] of Object.entries(step.moveBodies||{}))if(bodies[id])bodies[id]={...bodies[id],place,source:step.source};
  if(step.clearBodies)for(const id of Object.keys(bodies))delete bodies[id];
  for(const id of step.removeBodies||[])delete bodies[id];
  for(const room of step.unlock||[])unlocked.add(room);
  fire ||= !!step.fire;
  for(const [id,p] of Object.entries(actors(step)))lastSeen[identity(book,mode,id,step)]={...p,at:step.time};
 }
 const current={};for(const [id,p] of Object.entries(actors(event)))current[identity(book,mode,id,event)]={...p,at:event.time};
 for(const [id,p] of Object.entries(bodies))current[id]={...p,dead:true};
 const map=event.map===null?null:(event.map??geometry.byId(Object.values(actors(event)).find(p=>geometry.byId(p.place))?.place)?.floor??0);
 return {event,index:i,total:events.length,current,clues:[...clues.values()],unlocked:[...unlocked],lastSeen,dead:[...dead],fire,map};
}
