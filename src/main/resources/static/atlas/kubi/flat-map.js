import {edges,segment} from './geometry.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Numbered architectural plan: names stay in a separate key rather than over the scene.
export function drawPlan(rs,clues,positions,names,dead=[]){
 const pts=rs.flatMap(r=>r.polygon),xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]);
 const xmin=Math.min(...xs),xmax=Math.max(...xs),zmin=Math.min(...zs),zmax=Math.max(...zs),scale=Math.min(590/(xmax-xmin||1),500/(zmax-zmin||1));
 const xy=(x,z)=>[350+(x-(xmin+xmax)/2)*scale,325+(z-(zmin+zmax)/2)*scale];
 let html='<rect width="1000" height="650" fill="#f7f4ec"/><text x="40" y="630" fill="#738a83" font-size="15">● 人物数量　◉ 物证编号　·　尺寸为示意</text><path d="M690 70V610" stroke="#dcd6c8"/>';
 for(const [a,b]of edges)if(rs.some(r=>r.id===a)&&rs.some(r=>r.id===b))html+=`<polyline points="${segment(a,b).map(p=>xy(p.x,p.z).join(',')).join(' ')}" fill="none" stroke="#c6bda9" stroke-width="4" stroke-dasharray="6 5"/>`;
 rs.forEach((r,i)=>{const [x,y]=xy(...r.center),points=r.polygon.map(p=>xy(...p).join(',')).join(' '),column=i>=27?1:0,keyY=95+(i%27)*20,keyX=710+column*145;
 html+=`<g data-room="${r.id}" role="button" tabindex="0" aria-label="查看${esc(r.name)}立体图"><title>${esc(r.name)}</title><polygon points="${points}" fill="${r.type==='passage'?'#ede9dc':'#e6e5d6'}" stroke="#91a39e" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="11" fill="#fffdf7" stroke="#a89a7e"/><text x="${x}" y="${y+4}" font-size="12" text-anchor="middle" fill="#52696a">${i+1}</text><text x="${keyX}" y="${keyY}" font-size="16" fill="#52696a">${String(i+1).padStart(2,'0')} ${esc(r.name)}</text></g>`;
 const actors=Object.entries(positions).filter(([,p])=>p.room===r.id);
 if(actors.length)html+=`<g pointer-events="none"><title>${esc(actors.map(([id])=>names[id]+(dead.includes(id)?'（遗体）':'')).join('、'))}</title><circle cx="${x+17}" cy="${y-17}" r="10" fill="#45696c"/><text x="${x+17}" y="${y-13}" fill="white" font-size="11" text-anchor="middle">${actors.length}</text></g>`;
 clues.filter(c=>c.place===r.id).forEach((c,j)=>{const cx=x-14-(j%4)*19,cy=y+19+Math.floor(j/4)*19;html+=`<g data-clue="${c.id}" role="button" tabindex="0" aria-label="物证${c.number}：${esc(c.title)}"><title>${esc(c.title+'：'+c.state)}</title><circle cx="${cx}" cy="${cy}" r="8" fill="#b46953"/><text x="${cx}" y="${cy+3}" fill="white" text-anchor="middle" font-size="10">${c.number}</text></g>`;});
 });return html;
}
