import {drawPlan as kubiPlan} from './kubi/flat-map.js';
import {eventsFor as replayEvents,snapshot as replaySnapshot} from './engine.js';
import {createPlanner} from './planner-ui.js';
import {timeLabel} from './planning.js';
import {characterIcon} from '../character-model.js';
const work=['decagon','christie','kubi'].includes(document.body.dataset.work)?document.body.dataset.work:'decagon';
let book;
for(const url of [`/api/atlas/${work}`,`atlas/${work}/events.json`]){try{const r=await fetch(url);if(r.ok){book=await r.json();break;}}catch{}}
if(!book)throw new Error('作品记录加载失败，请刷新页面。');
const geometry=await import(`./${work}/geometry.js`),{ReadingScene}=await import(`./${work}/scene.js`);
const {rooms,byId,floorNames,roles,colors,constrain}=geometry;
const {names}=book;
const placeName=id=>byId(id)?.name||book.offPlaces[id]||'位置未明';
const observedEvents=replayEvents(book);
let observedIndex=0,personalIndex=0,planner;
const eventsFor=mode=>mode==='personal'?planner.points().map(t=>({id:String(t),day:Math.floor(t/1440),seq:t,time:timeLabel(t)})):observedEvents;
function snapshot(mode,index){
 const base=replaySnapshot(book,geometry,'observed',mode==='personal'?observedIndex:index);
 if(mode!=='personal')return base;
 const points=planner.points(),i=Math.max(0,Math.min(points.length-1,index)),t=points[i],own=planner.current(t),notes=planner.records().filter(r=>r.start===t).map(r=>r.text).filter(Boolean);
 return {...base,...own,index:i,total:points.length,event:{id:String(t),day:Math.floor(t/1440),seq:t,time:timeLabel(t),title:planner.name(),summary:notes.join('；')||'在这个时刻安排人物，或添加证词与随记。',source:'我的假说 · 参考所见：'+base.event.time},map:geometry.byId(Object.values(own.current).find(p=>geometry.byId(p.place))?.place)?.floor??base.map};
}
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mode='observed',index=0,map=snapshot('observed',0).map,focus=null,view='three',scene=null,timer=null,entered=false;
let snap=snapshot(mode,index);
const label=id=>names[id];
planner=createPlanner(book,geometry,()=>{if(mode==='personal')seek(Math.min(index,planner.points().length-1));},()=>replaySnapshot(book,geometry,'observed',observedIndex));
function stop(){clearInterval(timer);timer=null;$('#play').textContent='▶ 播放';}
function seek(n){index=Math.max(0,Math.min(eventsFor(mode).length-1,n));snap=snapshot(mode,index);if($('#follow').checked){map=snap.map;focus=null;}render();}
function choose(place){const r=byId(place);map=r?.floor??null;focus=r?.id??null;render();}
function changeMode(next){stop();if(mode==='observed')observedIndex=index;else personalIndex=index;mode=next;seek(next==='personal'?personalIndex:observedIndex);}
function flat(rs,clues,positions){
 if(!rs.length){$('#flat').innerHTML='';return;}
 if(work==='kubi'){$('#flat').innerHTML=kubiPlan(rs,clues,positions,names,snap.dead);return;}
 const pts=rs.flatMap(r=>r.polygon),xmin=Math.min(...pts.map(p=>p[0])),xmax=Math.max(...pts.map(p=>p[0])),zmin=Math.min(...pts.map(p=>p[1])),zmax=Math.max(...pts.map(p=>p[1]));
 const scale=Math.min(880/(xmax-xmin||1),520/(zmax-zmin||1)),xy=(x,z)=>[500+(x-(xmin+xmax)/2)*scale,325+(z-(zmin+zmax)/2)*scale];
 let html=rs.map(r=>{const [x,y]=xy(...r.center);return `<g data-room="${r.id}" role="button" tabindex="0" aria-label="查看${esc(r.name)}立体图"><polygon points="${r.polygon.map(p=>xy(...p).join(',')).join(' ')}" fill="${r.floor===0?'#e6dec9':'#dbe4e7'}" stroke="#748b91" stroke-width="3" ${r.type==='passage'?'stroke-dasharray="8 6"':''}/><text x="${x}" y="${y-12}" text-anchor="middle" fill="#314e55" font-size="19">${esc(r.name)}</text></g>`;}).join('');
 const counts={};for(const c of clues){const r=rs.find(r=>r.id===c.place);if(!r)continue;const n=counts[r.id]||0;counts[r.id]=n+1;const [x,y]=xy(...r.center);html+=`<g data-clue="${c.id}"><circle cx="${x-24+n%4*24}" cy="${y+18+Math.floor(n/4)*25}" r="11" fill="#b46953"/><text x="${x-24+n%4*24}" y="${y+22+Math.floor(n/4)*25}" fill="white" text-anchor="middle" font-size="13">${c.number}</text><title>${esc(c.title+'：'+c.state)}</title></g>`;}
 for(const [id,p] of Object.entries(positions)){const r=rs.find(r=>r.id===p.room);if(!r)continue;const [x,y]=xy(r.x+p.u*r.w,r.z+p.v*r.d);html+=`<g pointer-events="none" transform="translate(${x},${y})" opacity="${snap.dead.includes(id)?.45:1}">${characterIcon(roles[id],colors[id],work==='kubi')}<title>${esc(label(id))}</title></g><text pointer-events="none" x="${x}" y="${y+30}" font-size="13" text-anchor="middle">${esc(label(id))}</text>`;}
 $('#flat').innerHTML=html;
}
function render(){
 snap=snapshot(mode,index);const e=snap.event,events=eventsFor(mode),clues=snap.clues.map((c,i)=>({...c,number:i+1}));
 for(const m of ['observed','personal'])$('#'+m).classList.toggle('active',mode===m);
 const floors=[...new Set(rooms.filter(r=>snap.unlocked.includes(r.id)).map(r=>r.floor))];
 $('#maps').innerHTML=floors.map(f=>`<button data-map="${f}" class="${map===f?'active':''}">${floorNames[f]}</button>`).join('')+`<button data-map="mainland" class="${map===null?'active':''}">本土／海上记录</button>`;
 const rs=rooms.filter(r=>r.floor===map&&snap.unlocked.includes(r.id)&&(!focus||r.id===focus));
 $('#room-list').innerHTML=rooms.filter(r=>r.floor===map&&snap.unlocked.includes(r.id)).map(r=>`<button data-room="${r.id}" class="${focus===r.id?'active':''}">${esc(r.name)}</button>`).join('');
 $('#breadcrumb').textContent=(floorNames[map]||'本土／海上')+(focus?' / '+placeName(focus):' / 全景');$('#drawing-label').textContent=focus?placeName(focus):floorNames[map]||'叙事地点';
 $('#event-time').textContent=e.time;$('#event-title').textContent=e.title;$('#event-summary').textContent=e.summary;$('#event-source').textContent='依据：'+e.source;
 $('#context-note').textContent=mode==='personal'?'人物来自自己的位置假设；物证保留切换前的当时所见，不将证词自动当作事实。':'本节点仅展示明确描写的位置与截至此时已记录的线索。';
 $('#time-label').textContent=e.time;$('#mode-note').textContent=(mode==='personal'?'自己推理':'当时所见')+' · '+(index+1)+' / '+events.length+' 个事件';
 $('#scrubber').max=events.length-1;$('#scrubber').value=index;$('#scrubber').setAttribute('aria-valuetext',e.time+' '+e.title);$('#previous').disabled=index===0;$('#next').disabled=index===events.length-1;
 $('#days').innerHTML=[...new Set(events.map(e=>e.day))].map(d=>`<button data-day="${d}" class="${e.day===d?'active':''}">${esc(mode==='personal'?'第'+(d+1)+'日':book.dayLabels[d]||String(d))}</button>`).join('');
 const positions={},counts={};for(const [id,p] of Object.entries(snap.current)){const r=byId(p.place);if(!r||!roles[id])continue;const n=counts[r.id]||0;counts[r.id]=n+1;const q=constrain(r,r.center[0]+(n%3-1)*.7,r.center[1]+Math.floor(n/3)*.7);positions[id]={room:r.id,u:(q.x-r.x)/r.w,v:(q.z-r.z)/r.d};}
 $('#scene').hidden=map===null||view!=='three';$('#flat').toggleAttribute('hidden',map===null||view!=='two');$('#offmap').hidden=map!==null;$('#zoom').hidden=map===null||view!=='three';
 if(map===null){const current=Object.entries(snap.current).filter(([,p])=>p.place&&!byId(p.place)&&!p.dead);$('#offmap').innerHTML=`<div><p class="eyebrow">DOCUMENTED LOCATIONS</p><h2>本土与海上</h2><p>原文没有完整平面，不补造建筑或路线。</p>${current.map(([id,p])=>`<article><strong>${esc(label(id))}</strong><p>${esc(placeName(p.place))}</p><small>${esc(p.note)}</small></article>`).join('')||'<p>本节点没有明确定位的本土人物。</p>'}</div>`;}
 else if(view==='three'&&scene)scene.setState({floor:map,chapter:99,focus,showPeople:true,positions,unlocked:snap.unlocked,clues,dead:snap.dead,fire:snap.fire});
 else flat(rs,clues,positions);
 for(const v of ['three','two'])$('#'+v).classList.toggle('active',view===v);
 const personRows=names.map((name,id)=>{const p=snap.current[id],dead=snap.dead.includes(String(id)),last=snap.lastSeen[id];return `<article class="person ${dead?'dead':''}">${roles[id]?'<svg viewBox="-18 -28 36 46" aria-hidden="true">'+characterIcon(roles[id],colors[id],work==='kubi')+'</svg>':'<span class="number-pin">本</span>'}<div><strong>${esc(label(id))}</strong><p>${p?.place?esc(placeName(p.place)):dead?'已遇害 · 本节点不继续定位':'本节点位置未明'}</p><small>${esc(p?.note||'')}</small>${!p&&last?.place?`<details><summary>上次记载（不代表当前位置）</summary><small>${esc(last.at+' · '+placeName(last.place))}</small></details>`:''}</div></article>`;});
 const visibleRows=personRows.filter((_,id)=>snap.current[id]||snap.dead.includes(String(id))),unknownRows=personRows.filter((_,id)=>!snap.current[id]&&!snap.dead.includes(String(id))).filter(Boolean);
 $('#people').innerHTML=visibleRows.join('')+(unknownRows.length?`<details class="unknown-roster"><summary>其他 ${unknownRows.length} 位人物 · 本节点位置未明</summary>${unknownRows.join('')}</details>`:'');
 $('#clue-count').textContent=clues.length+'项';$('#clues').innerHTML=clues.map(c=>`<details class="clue"><summary><span class="number-pin">${c.number}</span><strong>${esc(c.title)}</strong><small>${esc(c.state)}</small></summary><button data-place="${esc(c.place)}">定位：${esc(placeName(c.place))} ↗</button><p>${esc(c.detail)}</p><small>${esc(c.kind+' · '+c.at+' · '+c.source)}</small><ol>${c.history.map(h=>`<li>${esc(h.at+' · '+placeName(h.place)+' · '+h.state)}</li>`).join('')}</ol></details>`).join('')||'<p>此时尚未出现案件物证。</p>';
 $('#legend').textContent=mode==='personal'?'● 我的位置假设　◉ 所见物证　灰色：遗体假设':'● 人物确证位置　◉ 编号物证　灰色：遗体';
 $('#people-note').textContent=mode==='personal'?'人物位置来自自己的安排；证词单独核对，不自动改变位置。':'本节点无确切位置时，不延续上次位置。灰色遗体仅按已记录的搬运改变。';
 $('#planner').hidden=mode!=='personal';if(mode==='personal')planner.render(snap.unlocked);
 $('#timeline-help').textContent=mode==='personal'?'拖动自己的时间线；位置点延续到下一次安排，时间区间结束后停止定位。':'拖动按书中事件顺序切换，刻度不是等时距；同一时段先后不明确时仅作整理排列，不补造具体分钟或移动轨迹。';
}
$('#enter').onclick=()=>{entered=true;$('#spoiler-gate').hidden=true;$('#atlas').hidden=false;try{scene=new ReadingScene($('#scene'),id=>choose(id),()=>{view='two';render();});}catch(error){console.error('三维场景初始化失败',error);view='two';}render();scene?.resize();};
$('#maps').onclick=e=>{const b=e.target.closest('[data-map]');if(b){map=b.dataset.map==='mainland'?null:Number(b.dataset.map);focus=null;render();}};
$('#room-list').onclick=e=>{const b=e.target.closest('[data-room]');if(b){focus=b.dataset.room;render();}};
$('#overview').onclick=()=>{focus=null;render();};$('#clues').onclick=e=>{const b=e.target.closest('[data-place]');if(b)choose(b.dataset.place);};
$('#flat').onclick=e=>{const r=e.target.closest('[data-room]'),c=e.target.closest('[data-clue]');if(r){focus=r.dataset.room;view='three';render();scene?.resize();}else if(c){const clue=snap.clues.find(x=>x.id===c.dataset.clue);if(clue){view='three';choose(clue.place);scene?.resize();}}};
$('#flat').onkeydown=e=>{if(e.key==='Enter')e.target.closest('[data-room]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}));};
for(const v of ['three','two'])$('#'+v).onclick=()=>{view=v;render();if(v==='three')scene?.resize();};
$('#previous').onclick=()=>{stop();seek(index-1);};$('#next').onclick=()=>{stop();seek(index+1);};$('#scrubber').oninput=e=>{stop();seek(Number(e.target.value));};
$('#days').onclick=e=>{const b=e.target.closest('[data-day]');if(b){stop();seek(eventsFor(mode).findIndex(x=>x.day===Number(b.dataset.day)));}};
$('#play').onclick=()=>{if(timer){stop();return;}if(index===eventsFor(mode).length-1)seek(0);$('#play').textContent='Ⅱ 暂停';timer=setInterval(()=>{if(index>=eventsFor(mode).length-1)stop();else seek(index+1);},2200);};
$('#observed').onclick=()=>changeMode('observed');$('#personal').onclick=()=>changeMode('personal');
$('#plus').onclick=()=>scene?.zoom(1.15);$('#minus').onclick=()=>scene?.zoom(1/1.15);$('#reset').onclick=()=>scene?.fit();
render();

$('#work-title').textContent=book.title;$('#work-subtitle').textContent=book.subtitle;$('#basis-text').textContent=book.basis;document.title='推理图鉴 · '+book.title;

$('#enter').disabled=false;
