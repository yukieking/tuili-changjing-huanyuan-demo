// Original paraphrases. No novel text or EPUB assets are distributed.
import {byId,initialRooms} from './geometry.js';
export const names=['埃勒里','阿加莎','卡尔','勒鲁','范达因','奥希兹','爱伦·坡','江南孝明','岛田洁','守须恭一','中村红次郎'];
export const offPlaces={oHome:'O市 · 守须住处',jHome:'O市 · 江南住处',redHome:'铁轮 · 红次郎家',ajimu:'安心院 · 吉川政子家',shore:'S区海岸',cape:'J岬角',sea:'角岛—J岬角海上',port:'S区渔业组合',club:'K大学研究会',oCity:'O市',prep:'本土 · 准备地点未细分'};
export const placeName=id=>byId(id)?.name||offPlaces[id]||'位置未明';
const positions=(ids,place,note='叙述确认')=>Object.fromEntries(ids.map(id=>[id,{place,note}]));
const clue=(id,title,place,state,detail,kind='物证',truth=false)=>({id,title,place,state,detail,kind,truth});
const event=(id,day,seq,time,title,summary,source,actors={},changes=[],extra={})=>({id,day,seq,time,title,summary,source,actors,changes,...extra});
const all=[0,1,2,3,4,5,6], six=[0,1,2,3,5,6], living6=[0,1,2,3,4,6], five=[0,1,3,4,6];
export const observed=[
 event('arrive',26,20,'3/26 · 11点刚过','六人登岛','六人在西岸栈桥上岸；范已先到岛上，稍后迎接。','第1章·第1–2节',positions(six,'pier')),
 event('mainletter',26,21,'3/26 · 上午11点','本土收到怪信','江南在住处发现署名中村青司的信。这个时间与六人上岛接近，先后不作定论。','第2章·第1节',positions([7],'jHome'),[clue('letters','死者来信','jHome','江南收到','寄信人身份尚未证实；信中的指控不是鉴定结论。','文书')],{map:null}),
 event('rooms',26,30,'3/26 · 登岛后','分配客房','七人入住；仅这个入住节点把人物放入各自客房，不把此位置沿用到后续空白时段。','第1章·第2–3节',{...positions([0],'ellery'),...positions([1],'agatha'),...positions([2],'carr'),...positions([3],'leroux'),...positions([4],'van'),...positions([5],'orczy'),...positions([6],'poe')}),
 event('tour',26,40,'3/26 · 午前','四人查看蓝屋','埃勒里、勒鲁、范、爱伦·坡查看蓝屋废墟；两位女生在厨房。卡尔独自出门，具体地点未明。','第1章·第3节',{...positions([0,3,4,6],'ruins'),...positions([1,5],'kitchen'),2:{place:null,note:'独自外出，原文未定位'}}),
 event('ring',26,42,'3/26 · 午前，岛上探访期间','戒指被注意到','阿加莎注意到奥希兹左手中指的戒指；这里不赋予其尚未揭示的意义。','第1章·第3节',{...positions([1,5],'kitchen')},[clue('ring','奥希兹的戒指','orczy','戴在左手中指','画面标记所属客房，仅表示归属；不是这段对话的精确坐标。')]),
 event('lunch1',26,50,'3/26 · 13:30后','返回大厅午餐','外出者返回，十角桌上的午餐是共同活动节点。','第1章·第3节',positions(all,'hall')),
 event('redvisit1',26,55,'3/26 · 本土午后','江南初访红次郎','江南在铁轮的红次郎家见到岛田，两条叙事线开始并行。','第2章·第2–3节',positions([7,8,10],'redHome'),[],{map:null}),
 event('night1',26,70,'3/26 · 晚饭后，19点过后','大厅聚谈','众人围桌喝咖啡、谈推理。咖啡杯此时尚未被识别为十一角形。','第1章·第4节',positions(all,'hall'),[clue('cups','墨绿色咖啡杯','hall','用于晚间咖啡','当时看起来与其他十角餐具相似，不能提前标记毒杯。')]),
 event('vanrest1',26,80,'3/26 · 夜间，较早回房','范称身体不适回房','只记录他回到房间这个可见节点；之后的实际去向不能据此确定。','第1章·第4节',positions([4],'van','看见其回房；之后位置未明')),
 event('visitguard1',26,95,'3/26 · 深夜，近午夜','守须在本土会见二人','江南和岛田来到守须住处；画架上的画处于浅着色阶段。','第2章·第5–6节',positions([7,8,9],'oHome'),[clue('painting','佛像画','oHome','浅着色阶段','守须声称白天去国东写生；这是他的说法，不能直接画成白天在国东。','文书')],{map:null}),
 event('boards',27,20,'3/27 · 08:00左右','发现七块预告板','奥希兹起床来到大厅，看见桌上七块塑料板，随后叫醒阿加莎。','第3章·第1节',positions([5],'hall'),[clue('boards','七块预告板','hall','桌上被发现','五名被害者、侦探与凶手的标记；此时作者身份未知。')]),
 event('drawer',27,30,'3/27 · 当天早晨，众人到齐后','预告板收入抽屉','七人围桌讨论；埃勒里把预告板放进厨房抽屉。','第3章·第2节',positions(all,'hall'),[clue('boards','七块预告板','kitchen','收入厨房抽屉','保存地点改变，不代表有人从此一直守在厨房。')]),
 event('poeroom',27,50,'3/27 · 午后','范在爱伦·坡房中量体温','两人在爱伦·坡的客房；卡尔独自外出。','第3章·第3节',{...positions([4,6],'poe'),2:{place:null,note:'独自外出，地点未明'}},[clue('jigsaw','狐狸拼图','poe','铺在地板','两千块拼图尚未完成。')]),
 event('rocksvisit',27,55,'3/27 · 午后，先后未细化','埃勒里与勒鲁在岩区','两人讨论预告板，此处的岩区在后续回忆中再次出现。','第3章·第3节；第9章·第1节',positions([0,3],'rocks')),
 event('ajimu',27,60,'3/27 · 下午，17点后离开','本土走访吉川政子','江南和岛田在安心院与吉川政子谈话，调查半年前的蓝屋事件。','第4章·第2节',positions([7,8],'ajimu'),[],{map:null}),
 event('vanrest2',27,80,'3/27 · 晚饭后，约19点','范再次较早回房','范与卡尔争执后回自己的房间；不能把“回房”延伸为整夜留在房内。','第3章·第4节',positions([4],'van')),
 event('visitguard2',27,95,'3/27 · 22:40后','本土再次会见守须','江南和岛田来到守须住处；画作变为浓厚着色阶段，守须提出退出调查。','第4章·第3节',positions([7,8,9],'oHome'),[clue('painting','佛像画','oHome','浓厚着色阶段','画的变化并不能单独证明白天去过国东。','文书')],{map:null}),
 event('orczyfound',28,30,'3/28 · 正午','发现奥希兹遇害','阿加莎发现房门上的预告板；爱伦·坡检查尸体，埃勒里也进入房间，其他人停在门口。','第5章·第1–2节',{...positions([0,6],'orczy'),...positions([1,2,3,4],'hall','在奥希兹房门外')},[
 clue('board1','第一被害者牌','orczy','贴在房门','发现时间是正午，不等于粘贴时间。'),clue('nylon','尼龙绳与遗体','orczy','发现勒痕与尼龙绳','奥希兹左手缺失；绞杀由现场检查得出。'),clue('orczydeath','死亡时间推定','orczy','约06:00—09:00','爱伦·坡明确说是外行估计，不能当作精确作案时刻。','判断'),clue('orczylocks','门窗锁状态','orczy','房门未锁，窗插销未插好','这是发现时的状态；不能据此确定凶手从窗进入。','状态')],{deaths:{5:'orczy'}}),
 event('orczyseal',28,35,'3/28 · 正午，检查后','锁闭奥希兹房间','爱伦·坡和埃勒里处理门窗；六人回大厅讨论。','第5章·第1–2节',positions(living6,'hall'),[clue('orczylocks','门窗锁状态','orczy','检查后锁闭','爱伦·坡持房门钥匙，窗也被关闭。','状态')]),
 event('searchshore',28,50,'3/28 · 午后','埃勒里与勒鲁寻找联络办法','他们在岛上找船只与联络途径，不把一次巡视定位成整段时间站在某个岩石上。','第5章·第3–4节',{0:{place:null,note:'在岛上巡视，节点内位置未细分'},3:{place:null,note:'在岛上巡视，节点内位置未细分'}}),
 event('mainshore',28,65,'3/28 · 黄昏','本土远眺角岛','江南和岛田在S区海岸调查当地居民与渔夫；没有上岛。','第6章',positions([7,8],'shore'),[],{map:null}),
 event('coffee',28,90,'3/28 · 夜间咖啡时','卡尔在大厅毒发','阿加莎从厨房端出咖啡；六人取杯，卡尔随后倒地。这里不把他在大厅毒发误画成在客房喝下咖啡。','第5章·第4–5节',positions(living6,'hall'),[clue('cups','卡尔喝过的杯子','hall','疑似与中毒有关','取杯顺序：埃勒里，勒鲁与卡尔，爱伦·坡，阿加莎，范。具体毒物当时未定。')]),
 event('carrdead',29,5,'3/29 · 02:30（第三天深夜）','卡尔在客房死亡','原文第三天深夜两点半按自然日归入3月29日；卡尔已被移到自己房间。','第5章·第4–5节',{},[clue('carrdeath','卡尔死亡','carr','02:30死亡','死亡地点为自己的床，毒发地点为大厅。')],{deaths:{2:'carr'}}),
 event('carrhand',29,30,'3/29 · 中午，勒鲁起床前','发现浴缸里的左手','爱伦·坡发现卡尔左手在浴缸里，随后放回卡尔床上；埃勒里也发现第二块牌与另一套板。此节点展示发现时。','第7章·第1节',positions([6],'wash'),[clue('carrhand','卡尔左手','wash','在浴缸被发现','之后移回客房；这是发现地点，不是死亡地点。'),clue('board2','第二被害者牌','carr','贴在房门','原厨房抽屉仍有六块，说明至少两套预告板。')]),
 event('lateLunch',29,40,'3/29 · 将近15:00','五人迟来的午餐','阿加莎和爱伦·坡准备餐食，五人围桌；卡尔左手已经放回床上。','第7章·第1节',positions(five,'hall'),[clue('carrhand','卡尔左手','carr','移回床上','不能在后续场景继续把它留在浴室。')]),
 event('bluecellar',29,50,'3/29 · 午餐后','蓝屋地窖的绊线','埃勒里下石阶时绊倒；爱伦·坡、范和勒鲁进入地下室，阿加莎留在上方。','第7章·第2节',{...positions([0,3,4,6],'bluecellar'),...positions([1],'ruins')},[clue('fishingline','楼梯绊线','bluecellar','发现细而坚韧的线','位置为台阶胫骨高度；不展示尚未揭示的布线者。'),clue('swept','地面干净圆弧','bluecellar','发现异常清扫痕迹','有人藏身是埃勒里的推测，不能把那个人自动放进地窖。','判断')],{unlock:['bluecellar']}),
 event('ankle',29,60,'3/29 · 返回十角馆后','脚伤和失踪的钓鱼线','爱伦·坡处理埃勒里脚伤，并确认放在玄关的最粗钓鱼线不见了。','第7章·第3节',positions(five,'hall'),[clue('ankle','埃勒里脚伤','hall','右脚踝轻度受伤','非致命伤，后续仍能步行。','状态'),clue('fishinggear','钓鱼线卷','entry','最粗线卷缺失','线卷原来放在玄关；不能从“失踪”推出谁偷了它。')]),
 event('redvisit2',29,65,'3/29 · 下午15点过后','本土再访红次郎','江南和岛田在红次郎家追问旧案。岛上地窖事件与此处的具体先后未详。','第8章·第1–3节',positions([7,8,10],'redHome'),[],{map:null}),
 event('sleep4',29,80,'3/29 · 19点刚过','众人较早散去','勒鲁、爱伦·坡和范索要药物，随后众人回房；内入口门把手被绳子系住。','第7章·第3–4节',{...positions([0],'ellery'),...positions([1],'agatha'),...positions([3],'leroux'),...positions([4],'van'),...positions([6],'poe')},[clue('entryrope','入口绳子','entry','两个把手系在一起','门锁与绳子是不同状态；原文描述的是绳子闩门。','状态'),clue('sleepdrug','安眠药','hall','爱伦·坡分发药物','具体服用情况与作用时间未作确定模拟。')]),
 event('main29night',29,95,'3/29 · 22:10后','守须到江南住处','守须带绘画工具到江南房间，与江南和岛田谈话。','第8章·第2–3节',positions([7,8,9],'jHome'),[clue('painting','佛像画','jHome','带至江南住处','晚间实地见面与白天写生的说法必须分开。','文书')],{map:null}),
 event('lerouxout',30,12,'3/30 · 天亮前后','勒鲁独自外出','勒鲁记起岩区的异常后起身外出；这一叙述节点没有交代他已经走到哪处。','第9章·第1节',{3:{place:null,note:'离开客房，目的与路程未直接展示'}}),
 event('agathamakeup',30,20,'3/30 · 早晨，未给准确时刻','阿加莎在盥洗室换口红','她改用红色口红；不能把后来约八点的死亡推定冒充此刻的精确时间。','第9章·第1节',positions([1],'wash'),[clue('lipstick','红色口红','wash','正在使用','红色与玫瑰色两支口红；此时尚未完成毒物确认。')]),
 event('agathafound',30,30,'3/30 · 10:00后','发现阿加莎遗体','范起床后发现阿加莎，去拍爱伦·坡房门；爱伦·坡检查，埃勒里将范扶到厨房。','第9章·第2节',{...positions([6],'wash'),...positions([0,4],'kitchen')},[clue('agathadeath','阿加莎遗体','wash','在盥洗室被发现','现场有苦杏仁气味，中毒种类是爱伦·坡的现场判断。'),clue('board3','第三被害者牌','leroux','勒鲁房门出现预告板','此时发现顺序与被害者编号并不一致。')],{deaths:{1:'wash'}}),
 event('breakwindow',30,35,'3/30 · 发现阿加莎后','破窗查看勒鲁房间','勒鲁房门锁着，三人从外侧砸窗；坡与埃勒里进入空房，范留在窗外。','第9章·第3节',{...positions([0,6],'leroux'),...positions([4],'island-house','勒鲁窗外；场景内窗口坐标为示意')},[clue('lerouxwindow','勒鲁门窗','leroux','房门锁闭，窗被破坏','窗内挂钩与绑拉手的绳带；床上没有勒鲁。','状态'),clue('entryrope','入口绳子','entry','已解开，一端垂落','能确认有人解开，不能只据此确定解绳者。','状态')]),
 event('searchleroux',30,40,'3/30 · 当天上午，搜寻时','三人分头搜索','爱伦·坡去海湾，埃勒里检查十角馆与蓝屋附近，范在十角馆门口等候。','第9章·第3节',{...positions([6],'pier'),...positions([4],'island-house'),0:{place:null,note:'搜索馆与废墟附近，地点范围'}}),
 event('lerouxfound',30,45,'3/30 · 当天上午，10点之后','蓝屋前院发现勒鲁','埃勒里呼唤另外两人；三人看见前院遗体和雨后脚印。','第9章·第3节',positions([0,4,6],'forecourt'),[clue('footprints','前院脚印','forecourt','雨后地面可见','对方向和组数的推理到后续节点再展开。'),clue('lerouxdeath','勒鲁死亡时间','forecourt','推定约05:00—06:00','爱伦·坡根据尸体现象估计，非精确法医结论。','判断')],{deaths:{3:'forecourt'}}),
 event('bodiesmove',30,50,'3/30 · 搜寻后，午前后','遗体与口红重新检查','勒鲁搬回自己床上；阿加莎也移回客房，化妆包里的红色口红被判断含毒。','第9章·第4节',positions([0,4,6],'agatha'),[clue('lipstick','红色口红','agatha','判断被下毒','依据气味检查；结尾才揭示何时和由谁涂毒。'),clue('agathadeath','阿加莎死亡时间','agatha','推定约08:00','爱伦·坡在搬回后发表估计，精确时间仍不明。','判断'),clue('lerouxkey','勒鲁房门钥匙','leroux','在其上衣口袋发现','与锁门和破窗的记录合并查看。')],{moveBodies:{1:'agatha',3:'leroux'}}),
 event('cup11',30,60,'3/30 · 午后讨论期间','识别十一角杯','三人在大厅讨论；埃勒里从厨房吧台取来白毛巾覆盖的卡尔用杯，数出十一角。','第9章·第5–6节',positions([0,4,6],'hall'),[clue('cups','十一角形咖啡杯','kitchen','此前保存在厨房吧台','异形足以辨认杯子，但本节点尚未确认隐藏机关。')]),
 event('printsreason',30,70,'3/30 · 午后，15点之前','重新对照脚印','三人再次去蓝屋前院比较足迹。只有勒鲁双向足迹及另一组朝向十角馆的单向足迹；“外来者”是埃勒里的错误结论。','第9章·第6–7节',positions([0,4,6],'forecourt'),[clue('footprints','前院脚印','forecourt','双向与单向足迹被区分','足迹方向是观察；从中断言外来者或青司仍活着属于人物推理。','物证')]),
 event('poedead',30,80,'3/30 · 午后，15点后的讨论','爱伦·坡吸烟后死亡','三人在大厅；爱伦·坡抽云雀烟后倒地。不得提前认定换烟过程被别人看见。','第9章·第7–8节',positions([0,4],'hall'),[clue('cigarette','云雀烟与烟盒','hall','吸烟后突然死亡','随后埃勒里根据苦杏仁气味判断有氰化钾；这是当时的判断。')],{deaths:{6:'hall'}}),
 event('poemove',30,90,'3/30 · 黄昏','将爱伦·坡移回客房','埃勒里和范搬动遗体后回大厅；十一角杯引出隐蔽房间的猜想。','第9章·第9节',positions([0,4],'hall'),[clue('hiddenGuess','第十一个房间猜想','kitchen','尚未验证','杯子与房间之间的关联，此时只是埃勒里的推断。','判断')],{moveBodies:{6:'poe'}}),
 event('hatch',30,95,'3/30 · 天刚黑','厨房机关开启','埃勒里把十一角杯嵌入厨房地板储藏柜底部缺口，转动后底板下倾，出现下行石阶。','第9章·第9节',positions([0,4],'kitchen'),[clue('cups','十一角杯','kitchen','成为机关钥匙','此前含咖啡的杯子被倒空后用于开启底板。'),clue('hatch','厨房地板机关','kitchen','底板开启','储藏盖板约80厘米见方；模型只画出连接，不做精确机关工程。','状态')],{unlock:['cellar','cellarstairs']}),
 event('passage',30,100,'3/30 · 夜间，机关开启后','暗室木门后发现旧尸','两人由厨房下至大厅下方暗室，打开木门，在暗道内发现旧尸；身份当时没有被鉴定。','第9章·第9节',positions([0,4],'passage'),[clue('oldbody','暗道内旧尸','passage','发现，身份未确认','不能把人物猜测或后来的警方推定作为此刻的鉴定结果。')],{unlock:['passage']}),
 event('fire',31,5,'3/30深夜—3/31凌晨 · 夜半','十角馆起火','叙述看到建筑陷入火海；当时所见不直接给出纵火者与埃勒里死前的位置。','第9章·第10节',{},[clue('fire','十角馆火灾','island-house','建筑燃烧','完整纵火过程只在真相复盘展示。','状态')],{fire:true}),
 event('phonefire',31,20,'3/31 · 08:00','守须接到火灾消息','守须在本土住处接电话，再联系江南前往S区。','第10章·第1节',positions([9],'oHome'),[],{map:null}),
 event('portmeet',31,45,'3/31 · 临近13:00','三人在港口会合','江南、岛田和守须在渔业组合会议室会合；警方后续提供初步尸检，不能认作最终真相。','第10章·第1–2节',positions([7,8,9],'port'),[clue('policeTheory','警方初步推论','port','怀疑埃勒里杀人后自焚','小说随后揭示此结论错误；此处只记录警方说法。','判断')],{map:null}),
 event('news',32,10,'4/01 · 晨报','报纸报道六名学生遗体','记录报道中的六具学生遗体与另发现的地下旧尸，不把报道视作所有事实已查清。','第11章',{},[clue('news','火灾案件报道','port','六名学生与地下旧尸','本土线索，地点未细分为某一个读报房间。','文书')],{clearBodies:true,map:null,deaths:{0:"ellery"}}),
 event('meeting',33,30,'4/02 · 午后','研究会接受警方询问','江南、守须与研究会成员在活动室；警方把埃勒里认作凶手，动机仍不清楚。岛田洁没有到场。','第12章·第1节',positions([7,9],'club'),[clue('policeTheory','警方结论','club','认定埃勒里杀人后自杀','仍是误判，不能在事实图层给埃勒里标记凶手。','判断')],{map:null}),
];
export const truthOnly=[
 event('prep',25,10,'3/25 · 白天','事前准备与九封信','守须寄出九封信并提前运送物资，准备两套预告板、毒物与航行工具。','第12章·第2节',positions([4],'prep'),[clue('letters','九封冒名信','prep','守须寄出','冒用中村青司署名；不是死人复活。','文书',true),clue('boardsSet','两套预告板','prep','事先制作','两套的存在直到第四天才被岛上众人察觉。','物证',true)],{truth:true,map:null}),
 event('capePrep',25,60,'3/25 · 夜间','本土前往J岬角','守须把船和燃料藏在J岬角；夜间从O市骑车到岬角。原文给出典型车程，未给出此次出发钟点。','第12章·第2节',positions([4],'cape'),[clue('boat','橡皮艇与燃料','cape','藏于岬角','不按估计耗时补出整条精确分钟轨迹。','物证',true)],{truth:true,map:null}),
 event('firstland',26,5,'3/25深夜—3/26清晨','岩区上岸，住进漏雨客房','守须渡海到岩区，把船和引擎包裹藏入岩缝，住进自己的漏雨房间。','第12章·第2节',positions([4],'van'),[clue('boat','橡皮艇与引擎','rocks','藏在岩缝','船体、空气筒、引擎包裹后用绳子固定；不是敞开放在岩区。','物证',true),clue('vanroom','漏雨客房与睡袋','van','仅有空架等，不具备普通客房家具','初始图鉴的通用家具在真相复盘中撤去。','状态',true)],{truth:true}),
 event('cross1',26,85,'3/26 · 回房后夜间','范从岩区离岛','较早回房后换潜水服，从岩区乘艇去J岬角，再赶往O市；全段准确时刻未给出。','第12章·第3节',positions([4],'sea'),[clue('boat','橡皮艇','sea','离岛使用','用夜间往返在岛上昵称与本土姓名之间制造分隔。','物证',true)],{truth:true,map:null}),
 event('home23',26,90,'3/26 · 约23:00','守须回到O市住处','他致电江南无人接听，摆出第一幅预制画，等江南联络。','第12章·第3节',positions([4],'oHome'),[clue('painting','三幅预制佛像画','oHome','摆出第一幅','不同完成度的三幅画事先准备，不能证明每天去了国东。','文书',true)],{truth:true,map:null}),
 event('return1',27,5,'3/27 · 天亮前','返岛并摆放预告板','本土会面后经J岬角返岛；把预告板摆上大厅桌，并拿走十一角杯，用多余杯替代。摆板准确钟点未给出。','第12章·第3–4节',positions([4],'hall'),[clue('boards','七块预告板','hall','守须摆放','与08点左右被发现是不同时间。','物证',true),clue('cups','十一角杯','van','带回自己房间','当晚认出异形；随后准备投毒。','物证',true)],{truth:true}),
 event('lipstickPoison',27,65,'3/27 · 下午（先后未细化）','阿加莎口红被涂毒','守须潜入阿加莎房间，把氰化钾涂到其中一支红色口红；不是第五天早晨当场投毒。','第12章·第4节',positions([4],'agatha'),[clue('lipstick','红色口红','agatha','已被涂氰化钾','她前几天使用另一颜色，延迟到第五天才中毒。','物证',true)],{truth:true}),
 event('cross2',27,85,'3/27 · 较早回房之后','第二次离岛','守须再次从岩区渡海到J岬角，返回本土会见江南与岛田。','第12章·第3节',positions([4],'sea'),[],{truth:true,map:null}),
 event('return2',28,5,'3/28 · 天亮前','第二次返岛','守须从O市经J岬角回到十角馆；后续作案之前的具体分钟无法还原。','第12章·第3节',positions([4],'van'),[],{truth:true}),
 event('orczykill',28,15,'3/28 · 清晨，准确时刻未明','万能钥匙进入奥希兹房间','守须用万能钥匙进入客房，绞杀奥希兹，切下左手埋在屋后，故意解开门窗锁并贴牌。','第12章·第4节',positions([4],'orczy'),[clue('masterkey','万能钥匙','orczy','用于进入锁门客房','不能以现场房门未锁来倒推原先没有上锁。','物证',true),clue('ring','戒指与奥希兹左手','behind','断手埋在屋后','取不下戒指是断手原因；铭文与千织关系在结尾揭示。','物证',true),clue('orczylocks','奥希兹门窗','orczy','故意解开，制造外来者假象','随后正午会被其他人重新锁闭。','状态',true)],{truth:true,deaths:{5:'orczy'}}),
 event('cupPoison',28,80,'3/28 · 晚饭前','毒杯混回厨房吧台','守须将涂亚砷酸的十一角杯放回厨房，后来卡尔取到它；不是精确指定卡尔必然取杯。','第12章·第4节',positions([4],'kitchen'),[clue('cups','十一角毒杯','kitchen','混入待用咖啡杯','六人取杯时有机会被任一人取到。','物证',true)],{truth:true}),
 event('handTrap',29,15,'3/29 · 众人睡下后，天亮前后','断手、第二套牌与地窖布线','守须进入卡尔客房切下左手扔入浴缸，从第二套取牌；随后到蓝屋地窖，用偷来的钓鱼线设绊线，清扫地面伪造藏身痕迹。','第12章·第4节',positions([4],'bluecellar'),[clue('carrhand','卡尔左手','wash','被守须放进浴缸','伪造与第一案一致的断手行为。','物证',true),clue('fishingline','地窖绊线','bluecellar','由守须布设','目的是使埃勒里受伤，并非青司伏击。','物证',true),clue('swept','干净圆弧','bluecellar','人为清扫的假线索','不能把这里画成中村青司实际藏身地点。','物证',true)],{truth:true,unlock:['bluecellar']}),
 event('cross3',29,85,'3/29 · 散去后的夜间','第三次本土往返','身体已恢复，守须仍离岛去见江南，扩大不在场印象；途中下过小雨。','第12章·第4节',positions([4],'sea'),[],{truth:true,map:null}),
 event('lerouxkill',30,15,'3/30 · 天蒙蒙亮，准确时刻未明','岩区遭遇与前院灭口','守须返岛上岸，被勒鲁看见。勒鲁从石阶逃向蓝屋前院，守须追上后用石块杀害。','第12章·第5节',positions([4],'forecourt'),[clue('footprints','前院脚印','forecourt','追逐与离场留下','真实凶手就是岛上人物；单向脚印并不证明外来者。','物证',true),clue('lerouxroute','勒鲁最后一段行动','forecourt','岩区石阶 → 蓝屋前院','只画关系连线，长度与步行耗时未知。','状态',true)],{truth:true,deaths:{3:'forecourt'}}),
 event('boatmove',30,18,'3/30 · 勒鲁遇害后','船转移到海湾小船坞','守须返回岩区，把船移到海湾、收起后藏在船坞，回馆贴第三块牌并钻入睡袋。','第12章·第5节',positions([4],'van'),[clue('boat','橡皮艇','pier','改藏海湾小船坞','位置由岩区转移，后续不能继续只画在岩区。','物证',true),clue('board3','第三被害者牌','leroux','由守须贴上','勒鲁已在室外遇害，他的客房并不是作案现场。','物证',true)],{truth:true}),
 event('agathakill',30,25,'3/30 · 使用红色口红后','迟发毒口红生效','阿加莎使用第二天下午被涂毒的红色口红，在盥洗室死亡。没有准确的死亡钟点。','第9章·第1–2节；第12章·第4–5节',{},[clue('lipstick','红色毒口红','wash','使用后致死','约八点只是后来的现场估计。','物证',true)],{truth:true,deaths:{1:'wash'}}),
 event('smokeswap',30,75,'3/30 · 午后讨论时','桌下换入毒香烟','守须借烟盒，在桌下放入事先注入氰化钾的云雀烟；本轮不保证究竟谁先抽到。','第12章·第5节',positions([0,4,6],'hall'),[clue('cigarette','毒云雀烟','hall','守须换进爱伦·坡烟盒','毒烟事先准备，换入发生在大厅，而非确认过的客房潜入。','物证',true)],{truth:true}),
 event('terrace',30,105,'3/30 · 夜间，发现暗道旧尸后','暗道通向断崖平台','两人走到暗道尽头，发现海湾断崖中腹的突出平台。守须认为旧尸是吉川，但其死亡经过仍有两种可能。','第12章·第6节',positions([0,4],'terrace'),[clue('oldbody','暗道内旧尸','passage','守须推认吉川；后来警方亦推定','具体旧案杀害过程未被完整证明，不作动画补全。','判断',true)],{truth:true,unlock:['terrace']}),
 event('sleepEllery',30,110,'3/30 · 探查暗道返回后','咖啡中加入安眠药','守须在大厅给埃勒里咖啡下药，待睡熟后搬到床上；此动作不是埃勒里自杀。','第12章·第6节',positions([4],'ellery'),[clue('sleepdrug','安眠药咖啡','hall','守须给埃勒里服下','其后移至客房；没有准确服药与入睡时刻。','物证',true)],{truth:true,actors:{0:{place:'ellery',note:'被搬回床上，熟睡'},4:{place:'ellery',note:'结尾叙述确认'}}}),
 event('staging',30,120,'3/30 · 纵火前','取回戒指并布置嫁祸现场','守须从屋后挖出左手，取戒指后把手放回奥希兹尸体旁；可疑工具与衣物搬到埃勒里房间，浇灯油。','第12章·第6节',positions([4],'ellery'),[clue('ring','奥希兹左手 / 戒指','orczy','手放回尸体旁，戒指被守须取走','遗体上断手状态与戒指去向不应一直保留为屋后埋藏。','物证',true),clue('staging','塑料板、血衣、毒药、匕首','ellery','用于嫁祸','集中搬进埃勒里房间的时间是最后一夜。','物证',true),clue('fuel','灯油','ellery','房间、床和埃勒里身上','埃勒里体内安眠药与起火点被用于伪装自焚。','物证',true)],{truth:true}),
 event('ignite',30,125,'3/30深夜—3/31凌晨 · 精确钟点未明','窗外点火后离岛','守须从外侧窗口点燃埃勒里的床，关窗后经海湾离开；埃勒里并非自杀。','第12章·第6节',positions([4],'sea'),[clue('fire','十角馆纵火','ellery','守须纵火','起火点是埃勒里房间；完整火势传播不进行物理仿真。','状态',true)],{truth:true,deaths:{0:'ellery'},fire:true,map:null}),
 event('cleanup',31,30,'3/31 · 接电话后、港口会合前','收回J岬角船具','守须借车，取回藏在岬角的船和油桶，把船放回伯父车库，随后赴港口。','第12章·第6节',positions([4],'cape'),[clue('boat','船具与燃料','prep','收回并归还车库','不再留在海湾或J岬角；车库未精确建模。','物证',true)],{truth:true,map:null}),
];
export const undatedEnding={time:'尾声 · 具体日期未给出',title:'海边玻璃瓶',summary:'案件过后，守须再次在海边遇见岛田，捡到装有纸片的浅绿色玻璃瓶，并托孩子交给岛田。小说没有给出这段的准确日期，也没有直接描写随后如何逮捕；不补出4月2日晚的自首事件。',source:'序幕；尾声'};
export function eventsFor(mode='observed'){
 return [...observed,...(mode==='truth'?truthOnly:[])].sort((a,b)=>a.day-b.day||a.seq-b.seq);
}
// Recompute from the beginning on every seek. Living actors are only placed at
// the selected documented node; last observations never become an alibi.
export function snapshot(mode,index){
 const events=eventsFor(mode),i=Math.max(0,Math.min(events.length-1,Math.trunc(Number(index)||0))),e=events[i];
 const clues=new Map(),bodies={},unlocked=new Set(initialRooms),lastSeen={};let fire=false;
 for(const step of events.slice(0,i+1)){
  for(const c of step.changes){
   const old=clues.get(c.id);
   clues.set(c.id,{...c,source:step.source,at:step.time,
    actual:c.truth?{detail:c.detail,source:step.source}:old?.actual,
    history:[...(old?.history||[]),{state:c.state,place:c.place,at:step.time,source:step.source}]});
  }

  for(const [id,place] of Object.entries(step.deaths||{}))bodies[id]={place,note:'遗体位置记录',source:step.source};
  for(const [id,place] of Object.entries(step.moveBodies||{}))if(bodies[id])bodies[id]={...bodies[id],place,source:step.source};
  if(step.clearBodies)for(const id of Object.keys(bodies))delete bodies[id];
  for(const room of step.unlock||[])unlocked.add(room);
  fire ||= !!step.fire;
  for(const [rawId,p] of Object.entries(step.actors)){const id=mode==='truth'&&rawId==='9'?'4':rawId;lastSeen[id]={...p,at:step.time};}
 }
 const current={};for(const [rawId,p] of Object.entries(e.actors)){const id=mode==='truth'&&rawId==='9'?'4':rawId;current[id]={...p,at:e.time};}
 for(const [id,p] of Object.entries(bodies))current[id]={...p,dead:true};
 const dead=new Set();for(const step of events.slice(0,i+1))for(const id of Object.keys(step.deaths||{}))dead.add(id);
 let map=e.map===null?null:(e.map??byId(Object.values(e.actors).find(p=>byId(p.place))?.place)?.floor??0);
 return {event:e,index:i,total:events.length,current,clues:[...clues.values()],unlocked:[...unlocked],lastSeen,dead:[...dead],fire,map};
}
