import {rooms as original, inner, outer, contains, constrain, personNames, roles, colors} from '../decagon/data.js';
export {inner,outer,contains,constrain,personNames,roles,colors};
export const floorNames={0:'十角馆',1:'角岛',2:'十角馆暗室',3:'蓝屋地下室'};
const extra=[
 ['forecourt','蓝屋前院',1,[[-5,-2],[0,-2],[0,1],[-5,1]],'yard'],
 ['behind','屋后草地',1,[[1,1],[4,1],[4,3],[1,3]],'yard'],
 ['cellar','大厅下方暗室',2,inner,'cellar'],
 ['cellarstairs','厨房下行石阶',2,[inner[0],outer[0],outer[1],inner[1]],'steps'],
 ['passage','地下暗道 · 局部示意',2,[[3.6,-1],[9,-1],[9,1],[3.6,1]],'passage'],
 ['terrace','海湾断崖中腹平台',1,[[-1,7],[1,7],[1,9],[-1,9]],'terrace'],
 ['bluecellar','蓝屋地下室',3,[[-4,-3],[4,-3],[4,3],[-4,3]],'cellar'],
];
export const rooms=[...original,...extra.map(([id,name,floor,polygon,type])=>({id,name,floor,polygon,type,chapter:1,
 x:Math.min(...polygon.map(p=>p[0])),z:Math.min(...polygon.map(p=>p[1])),
 w:Math.max(...polygon.map(p=>p[0]))-Math.min(...polygon.map(p=>p[0])),d:Math.max(...polygon.map(p=>p[1]))-Math.min(...polygon.map(p=>p[1])),
 center:polygon.reduce((a,p)=>[a[0]+p[0]/polygon.length,a[1]+p[1]/polygon.length],[0,0]),
 evidence:id==='bluecellar'?'第7章：地窖入口、台阶和水泥墙；第12章说明其中藏过灯油。':'第9章：厨房储藏柜底板通向大厅下方暗室，木门之后是暗道，出口位于海湾断崖中腹。',
 inference:'仅表达连接或相对位置；路径、大小、高差与家具为示意，不证明距离或通行时间。'
}))];
export const byId=id=>rooms.find(r=>r.id===id);
export const initialRooms=rooms.filter(r=>!['cellar','cellarstairs','passage','terrace','bluecellar'].includes(r.id)).map(r=>r.id);
