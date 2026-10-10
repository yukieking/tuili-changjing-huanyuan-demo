// Personal hypotheses are kept separate from the book's observations.
export const timeLabel=t=>`第${Math.floor(t/1440)+1}日 ${String(Math.floor(t%1440/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
export function timeline(plan){return [...new Set([0,...plan.records.flatMap(r=>[r.start,r.end])])].sort((a,b)=>a-b);}
export function validatePlan(plan,names,locations){
 if(!plan||typeof plan.name!=='string'||!plan.name.trim()||plan.name.length>80||!Array.isArray(plan.records)||plan.records.length>500)throw Error('方案格式不正确，最多保留500条记录。');
 const seen=new Set();for(const r of plan.records){
  if(typeof r.id!=='string'||seen.has(r.id)||!['hypothesis','testimony','note','body'].includes(r.type)||!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end<r.start||r.end>142559||typeof r.text!=='string'||r.text.length>2000)throw Error('记录的编号、类型或时间不正确。');seen.add(r.id);
  if(r.type!=='note'&&(!/^\d+$/.test(String(r.person))||Number(r.person)>=names.length||!locations.includes(r.place)))throw Error('记录中有不属于本作品的人物或地点。');
 }
 const clean=structuredClone(plan);for(const r of clean.records)if(r.type!=='note')r.person=String(r.person);return clean;
}
export function plannedState(plan,t){
 const current={},lastSeen={},latest={};
 for(const r of [...plan.records].sort((a,b)=>a.start-b.start))if(r.start<=t&&(r.type==='hypothesis'||r.type==='body'))latest[r.person]=r;
 for(const [id,r]of Object.entries(latest)){
  lastSeen[id]={place:r.place,at:timeLabel(r.start)};
  if(r.end===r.start||t<r.end)current[id]={place:r.place,note:r.text||'我的位置假设',dead:r.type==='body',at:timeLabel(r.start)};
 }
 return {current,lastSeen,dead:Object.keys(current).filter(id=>current[id].dead)};
}
export function conflicts(plan){
 const out=[],rows=plan.records.filter(r=>r.type!=='note');
 const until=r=>r.end>r.start?r.end:r.type==='testimony'?r.start:Math.min(...rows.filter(n=>n.person===r.person&&n.type!=='testimony'&&n.start>r.start).map(n=>n.start),Infinity);
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const a=rows[i],b=rows[j];if(a.person!==b.person||a.place===b.place)continue;
  const ae=until(a),be=until(b),start=Math.max(a.start,b.start),end=Math.min(ae,be);
  const overlaps=start<end||ae===a.start&&a.start>=b.start&&(a.start<be||be===a.start)||be===b.start&&b.start>=a.start&&(b.start<ae||ae===b.start)||a.start===b.start;
  if(overlaps)out.push({a:a.id,b:b.id,person:a.person,start,kind:a.type==='testimony'||b.type==='testimony'?'证词与位置有差异':'同一人物位置重叠',places:[a.place,b.place]});
 }
 return out;
}
