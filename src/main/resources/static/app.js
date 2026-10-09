import { characterIcon } from "./character-model.js";
import {
  SCENE_VERSION,
  people,
  rooms,
  roomById,
  connections,
  windows,
  edgeBetween,
  neighbors,
  suggestedPath,
  pathPoints,
  normalizePlan,
  blankPlan,
  emptyPlan,
  nodeAt,
  positionsAt,
  playbackMapTarget,
  ensureNode,
  addRoute,
  conflicts,
  formatTime,
} from "./domain.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let data = { plans: [emptyPlan()], active: 0, progress: 1 };
try {
  let saved = JSON.parse(localStorage.getItem("mijing-v1"));
  if (saved?.plans?.length && saved.plans[saved.active]) data = saved;
} catch {}
data.plans.forEach(normalizePlan);
let floor = -1,
  focus = null,
  selectedRoom = null,
  selectedPerson = null,
  selectedObject = null,
  followedPerson = null,
  time = 0,
  tab = "object",
  view = "3d",
  showTrails = false,
  showPeople = false,
  activeTool = null,
  explode = false,
  cut = false,
  hideRoof = false,
  ghost = false,
  scene = null,
  playing = null,
  history = [],
  backendReady = false,
  syncTimer,
  syncQueue = Promise.resolve(),
  currentPage = "desk";
const plan = () => data.plans[data.active],
  node = () => nodeAt(plan(), time);
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").style.opacity = 1;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").style.opacity = 0), 3200);
}
function checkpoint() {
  stop();
  history.push(JSON.stringify(data));
  if (history.length > 40) history.shift();
}
function persist() {
  try {
    localStorage.setItem("mijing-v1", JSON.stringify(data));
  } catch {
    toast("浏览器存储失败，请保存到后端或导出备份");
  }
  if (backendReady) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncBackend, 600);
  }
}
function syncBackend() {
  const body = JSON.stringify(data);
  syncQueue = syncQueue
    .catch(() => false)
    .then(async () => {
      try {
        const r = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!r.ok) throw Error();
        $(".left-bottom").textContent = "已保存";
        return true;
      } catch {
        $(".left-bottom").textContent = "已保存在此浏览器";
        return false;
      }
    });
  return syncQueue;
}
function changed() {
  $("#check-result").textContent = "";
  persist();
  render();
}
async function loadBackend() {
  try {
    const r = await fetch("/api/state");
    if (!r.ok) throw Error();
    const saved = await r.json();
    if (saved !== null) {
      if (!saved?.plans?.length || !saved.plans[saved.active]) throw Error();
      data = saved;
      data.plans.forEach(normalizePlan);
    }
    backendReady = true;
    $(".left-bottom").textContent = "已连接";
    persist();
  } catch {
    $(".left-bottom").textContent = "本地保存";
  }
  render();
}
function render() {
  syncFloors();
  renderLeft();
  renderScene();
  renderInspector();
  renderTimeline();
  $("#progress").value = data.progress;
  $("#demo-notice").hidden = !plan().demo;
  $("#migration-note").hidden = plan().sceneVersion === SCENE_VERSION;
}
function syncFloors() {
  $$("[data-floor]").forEach((b) =>
    b.classList.toggle("active", Number(b.dataset.floor) === floor),
  );
}
function setFloor(f) {
  floor = f;
  focus = null;
  selectedObject = null;
  selectedRoom = f >= 0 ? rooms.find((r) => r.floor === f)?.id : null;
  if (f >= 0) hideRoof = true;
  render();
}
function selectPerson(i) {
  selectedPerson = i;
  selectedObject = null;
  tab = "object";
  openTool("people", true);
  if (matchMedia("(max-width: 760px)").matches) openTool(null, true);
  syncTabs();
  render();
}
function selectRoom(id) {
  selectedRoom = id;
  selectedObject = null;
  selectedPerson = null;
  focus = id;
  floor = roomById(id).floor;
  tab = "object";
  syncTabs();
  render();
}
function renderLeft() {
  $("#rooms").innerHTML =
    (floor < 0 ? [] : rooms.filter((r) => r.floor === floor))
      .map(
        (r) =>
          `<button data-room="${r.id}" class="${selectedRoom === r.id ? "selected" : ""}">${r.name}<span>↗</span></button>`,
      )
      .join("") ||
    (floor < 0
      ? '<p class="muted small">先点击建筑楼层，再进入房间。<br>隐藏屋顶可查看内部结构。</p>'
      : "");
  $("#characters").innerHTML = people
    .map(
      (p, i) =>
        `<button data-person="${i}" class="character ${selectedPerson === i ? "selected" : ""}" style="--c:${p[2]}"><svg class="character-portrait" viewBox="-16 -25 32 40" aria-hidden="true">${characterIcon(p[1], p[2])}</svg>${p[0]}<small>${p[1]}</small></button>`,
    )
    .join("");
  $("#placed-count").textContent = Object.keys(node().positions).length;
  $$("[data-person]").forEach(
    (b) =>
      (b.onclick = () => {
        selectPerson(Number(b.dataset.person));
        toast("切换楼层后点击地面放置；也可编辑行动路线");
      }),
  );
  $$("[data-room]").forEach(
    (b) => (b.onclick = () => selectRoom(b.dataset.room)),
  );
}
function syncPlaybackFloor() {
  if (view !== "2d") return;
  const target = playbackMapTarget(plan(), time, followedPerson);
  if (!target) return;
  followedPerson = target.person;
  showPeople = true;
  if (floor === target.floor) return;
  floor = target.floor;
  focus = null;
  selectedRoom = null;
  syncFloors();
  renderLeft();
  $("#map").setAttribute("viewBox", "0 0 1000 620");
}
function renderScene() {
  $("#people-toggle").textContent = showPeople ? "隐藏人物" : "显示人物";
  $("#cancel-placement").hidden = selectedPerson === null;
  $("#stage-label").textContent = focus
    ? roomById(focus).name
    : ["建筑整体", "别墅一层", "别墅二层", "兵岛外部"][floor + 1];
  $("#breadcrumb").innerHTML =
    `<button id="back-building">建筑整体</button>${floor >= 0 ? `<span> / </span><button id="back-floor">${["一层", "二层", "岛屿"][floor]}</button>` : ""}${focus ? `<span> / ${roomById(focus).name}</span>` : ""}`;
  $("#back-building").onclick = () => setFloor(-1);
  if ($("#back-floor")) $("#back-floor").onclick = () => setFloor(floor);
  for (let [id, on] of [
    ["roof-toggle", hideRoof],
    ["wall-toggle", cut],
    ["explode-toggle", explode],
    ["ghost-toggle", ghost],
    ["trails", showTrails],
  ])
    $("#" + id).classList.toggle("active", on);
  $("#rotate").hidden = view === "2d";
  $("#view3d").classList.toggle("active", view === "3d");
  $("#view2d").classList.toggle("active", view === "2d");
  $("#webgl").hidden = view !== "3d" || !scene;
  $("#map").toggleAttribute("hidden", view !== "2d" && !!scene);
  $("#hint").textContent =
    view === "3d" && scene
      ? selectedPerson !== null
        ? `正在放置 ${people[selectedPerson][0]} · 点击地面 · Esc 结束`
        : "拖动旋转 · 滚轮缩放 · 点击房间进入"
      : selectedPerson !== null
        ? `正在放置 ${people[selectedPerson][0]} · 点击房间 · Esc 结束`
        : "点击房间查看 · 可切换 3D";
  if (scene)
    scene.setState({
      floor,
      focus,
      explode,
      cut,
      hideRoof,
      ghost,
      top: false,
      selectedRoom,
      selectedPerson,
      time,
      showTrails,
      revealObjects: data.progress >= 2,
      plan: plan(),
      showPeople,
    });
  if (view === "2d" || !scene) render2d();
}
function render2d() {
  let f = floor < 0 ? 0 : floor,
    visible = rooms.filter((r) => r.floor === f),
    svg = `<defs><pattern id="plan-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#afbeb5" stroke-width=".4"/></pattern><pattern id="wall-hatch" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L5 0" stroke="#6f8587" stroke-width=".7"/></pattern></defs><rect width="1000" height="620" fill="#eee9db"/><rect x="20" y="20" width="960" height="580" fill="url(#plan-grid)" stroke="#748a8b"/><text x="42" y="55" fill="#375861" font-size="12" letter-spacing="3">SOLDIER ISLAND / SPATIAL STUDY</text><path d="M905 110V65M897 77L905 65L913 77" fill="none" stroke="#375861" stroke-width="2"/><text x="900" y="55" fill="#375861">N</text><text x="42" y="578" fill="#526b6e" font-size="12">兵岛别墅 · ${f === 0 ? "公共空间" : "客房层"} / 示意平面，无比例尺</text><text x="680" y="578" fill="#526b6e" font-size="11">布局与陈设为演示推定 · 服饰按身份设计</text><g id="world" transform="translate(60 25)">`;
  for (let r of visible)
    svg += `<g data-maproom="${r.id}" class="room"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${selectedRoom === r.id ? "#d6dfc7" : "#e4e4d2"}" stroke="#3d6068" stroke-width="4"/><text x="${r.x + 12}" y="${r.y + 27}" fill="#34565e" font-size="14">${r.name}</text></g>`;
  visible.forEach((r, i) => {
    svg += `<text x="${r.x + r.w - 28}" y="${r.y + 27}" fill="#829693" font-size="11">${String(i + 1).padStart(2, "0")}</text>`;
    if (r.kind === "bedroom")
      svg += `<g pointer-events="none" fill="none" stroke="#859793" stroke-width="1.5"><rect x="${r.x + 30}" y="${r.y + 55}" width="52" height="65"/><path d="M${r.x + 30} ${r.y + 73}h52"/><rect x="${r.x + 36}" y="${r.y + 59}" width="18" height="10"/><rect x="${r.x + 58}" y="${r.y + 59}" width="18" height="10"/></g>`;
    if (["dining", "lounge"].includes(r.kind))
      svg += `<rect x="${r.x + r.w * 0.35}" y="${r.y + r.h * 0.42}" width="${r.w * 0.32}" height="${r.h * 0.3}" rx="${r.kind === "dining" ? 12 : 3}" fill="none" stroke="#859793" stroke-width="1.5" pointer-events="none"/>`;
    if (r.kind === "stairs")
      for (let step = 0; step < 9; step++)
        svg += `<path d="M${r.x + 42} ${r.y + 25 + step * 8}h55" stroke="#859793" pointer-events="none"/>`;
  });
  for (let e of connections.filter((e) => !e.stairs)) {
    let r = roomById(e.a);
    if (r.floor !== f) continue;
    let a = roomById(e.a),
      b = roomById(e.b);
    let path = pathPoints({ path: [a.id, b.id] });
    let gate = path.find((p) => p.door);
    if (gate)
      svg += `<path d="M${gate.x - 14} ${gate.z}v-25a25 25 0 0 1 25 25" fill="none" stroke="#70888c" stroke-width="1.2" pointer-events="none"/><circle cx="${gate.x}" cy="${gate.z}" r="7" fill="${node().environment.doors[e.id] === "locked" ? "#d38471" : "#d9bd7f"}" data-mapdoor="${e.id}" style="cursor:pointer"/>`;
  }
  if (showTrails)
    for (let r of plan().routes) {
      let pts = pathPoints(r).filter((p) => Math.abs(p.floor - f) < 0.2);
      if (pts.length > 1)
        svg += `<polyline points="${pts.map((p) => `${p.x},${p.z}`).join(" ")}" fill="none" stroke="${people[r.person][2]}" stroke-width="3" stroke-dasharray="7 4"/>`;
    }
  for (let [id, pos] of Object.entries(
    showPeople ? positionsAt(plan(), time) : {},
  )) {
    let r = roomById(pos.room);
    if (!r || r.floor !== f) continue;
    let p = pos.world;
    svg += `<g data-pawn="${id}" class="pawn" transform="translate(${p.x} ${p.z})">${characterIcon(people[id][1], people[id][2])}<text y="-27" fill="#34565e" text-anchor="middle" font-size="12">${people[id][0]}</text></g>`;
  }
  $("#map").innerHTML = svg + "</g>";
}
function placePerson(id, room, u = 0.5, v = 0.5) {
  checkpoint();
  let edit = ensureNode(plan(), Math.round(time), "位置编辑");
  edit.positions[id] = {
    ...edit.positions[id],
    room,
    u: Math.max(0.07, Math.min(0.93, u)),
    v: Math.max(0.12, Math.min(0.88, v)),
  };
  time = edit.t;
  selectedPerson = id;
  selectedRoom = room;
  if (focus !== room) focus = null;
  floor = roomById(room).floor;
  plan().sceneVersion = SCENE_VERSION;
  if (matchMedia("(max-width: 760px)").matches) selectedPerson = null;
  changed();
  toast("已记录 " + formatTime(time) + " 的位置；相关路线如不一致将提示检查");
}
$("#map").addEventListener("pointerup", (e) => {
  let pawn = e.target.closest("[data-pawn]");
  if (pawn) {
    selectPerson(Number(pawn.dataset.pawn));
    return;
  }
  let door = e.target.closest("[data-mapdoor]");
  if (door) {
    selectedObject = { kind: "door", id: door.dataset.mapdoor };
    selectedPerson = null;
    renderInspector();
    return;
  }
  let target = e.target.closest("[data-maproom]");
  if (!target) return;
  let id = target.dataset.maproom;
  if (selectedPerson !== null) {
    let p = $("#map").createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    p = p.matrixTransform($("#world").getScreenCTM().inverse());
    let r = roomById(id);
    placePerson(selectedPerson, id, (p.x - r.x) / r.w, (p.y - r.y) / r.h);
  } else selectRoom(id);
});
function syncTabs() {
  $$("[data-tab]").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === tab),
  );
}
function envEdit(change) {
  checkpoint();
  let n = ensureNode(plan(), Math.round(time), "状态变化");
  time = n.t;
  change(n.environment);
  changed();
}
function roomOptions(value) {
  return rooms
    .map(
      (r) =>
        `<option value="${r.id}" ${value === r.id ? "selected" : ""}>${["一层", "二层", "外部"][r.floor]} / ${r.name}</option>`,
    )
    .join("");
}
function renderInspector() {
  const host = $("#inspector");
  if (activeTool === "people" && selectedPerson === null) {
    host.innerHTML =
      "<p>选择人物后，点击房间地面放置。位置仅代表你的记录。</p>";
    return;
  }
  if (tab === "clues") {
    host.innerHTML = `<div class="eyebrow">EVIDENCE / USER HYPOTHESIS</div><h2>随手记下疑点</h2><p><span class="tag">原作背景</span> 十位访客来到孤岛。人物身份为背景信息。</p>${data.progress >= 2 ? "<p>餐桌雕像、客厅留声机：原作场景概念；不复述情节与录音。</p>" : ""}<button id="add-testimony" class="wide">＋ 录入证词 / 停留区间</button>${plan()
      .intervals.map(
        (i) =>
          `<div class="clue"><small>${i.type === "testimony" ? "人物证词 · 未验证" : "用户假设"} ${i.approx ? "约 " : ""}${formatTime(i.start)}—${formatTime(i.end)}</small><p><strong>${people[i.person][0]} · ${roomById(i.room)?.name}</strong></p><p>${escape(i.content)}</p><p>来源：${escape(i.source || "用户录入")}</p><button data-delete-interval="${i.id}" class="small">删除记录</button></div>`,
      )
      .join(
        "",
      )}<label class="field">随记 · 不必先确定人物或时间<textarea id="plan-note" placeholder="记下章节、疑点或待核对的细节…">${escape(plan().note)}</textarea></label>`;
    $("#add-testimony").onclick = () => intervalEditor();
    let noteCheckpoint = false;
    $("#plan-note").oninput = (e) => {
      if (!noteCheckpoint) {
        checkpoint();
        noteCheckpoint = true;
      }
      plan().note = e.target.value;
      $("#check-result").textContent = "";
      persist();
    };
    $$("[data-delete-interval]").forEach(
      (b) =>
        (b.onclick = () => {
          checkpoint();
          plan().intervals = plan().intervals.filter(
            (i) => i.id !== b.dataset.deleteInterval,
          );
          changed();
        }),
    );
    return;
  }
  if (selectedObject) {
    let o = selectedObject;
    if (o.kind === "door") {
      let edge = connections.find((e) => e.id === o.id);
      host.innerHTML = `<div class="eyebrow">CONNECTION / EDITORIAL</div><h2>${escape(edge.name)}</h2><p>连接位置是编辑推定，状态属于用户假设。</p><label class="field">${formatTime(node().t)} 节点的门状态<select id="door-state"><option value="open">可通行 / 未锁闭</option><option value="locked" ${node().environment.doors[o.id] === "locked" ? "selected" : ""}>锁闭</option></select></label><p>持钥匙不会自动开锁。需要在时间节点明确修改状态。</p>`;
      $("#door-state").onchange = (e) =>
        envEdit((env) => (env.doors[o.id] = e.target.value));
      return;
    }
    if (o.kind === "window") {
      let w = windows.find((w) => w.id === o.id);
      host.innerHTML = `<div class="eyebrow">WINDOW / EDITORIAL</div><h2>${w.name}</h2><label class="field">窗户状态<select id="window-state"><option value="closed">关闭</option><option value="open" ${node().environment.windows[o.id] === "open" ? "selected" : ""}>开启</option></select></label><p>目前窗户不是可通行路径。窗台高度和可见范围未核实。</p>`;
      $("#window-state").onchange = (e) =>
        envEdit((env) => (env.windows[o.id] = e.target.value));
      return;
    }
    host.innerHTML = `<h2>${o.id === "figurines" ? "餐桌与雕像" : "留声机"}</h2><span class="tag">原作场景概念</span><p>造型、位置和大小为展示补全，不参与案件判断。</p>`;
    return;
  }
  if (selectedPerson !== null) {
    let person = people[selectedPerson],
      pos = node().positions[selectedPerson];
    host.innerHTML = `<div class="object-icon" style="color:${person[2]}">♟</div><h2>${person[0]}</h2><p>${person[1]} · ${formatTime(node().t)} 节点</p><label class="field">位置<select id="person-room"><option value="" ${!pos ? "selected" : ""}>尚未放置</option>${roomOptions(pos?.room)}</select></label><label class="field" hidden>朝向<select id="angle">${[0, 90, 180, 270].map((a) => `<option value="${a}" ${pos?.angle === a ? "selected" : ""}>${a}°</option>`).join("")}</select></label><label class="field">备注<textarea id="person-note">${escape(pos?.note)}</textarea></label><details class="optional-route"><summary>推演与移除（可选）</summary><button id="person-route" class="primary wide">＋ 规划行动路线</button><button id="person-stay" class="wide">＋ 停留 / 证词区间</button><button id="remove-person" class="wide">移除当前节点棋子</button><p>直接改位置是快照编辑；动画只播放已确认、且与节点一致的路线。</p></details>`;
    $("#person-room").onchange = (e) => {
      if (e.target.value) placePerson(selectedPerson, e.target.value);
    };
    $("#angle").onchange = (e) => {
      if (!pos) return;
      checkpoint();
      pos.angle = Number(e.target.value);
      changed();
    };
    let personNoteCheckpoint = false;
    $("#person-note").oninput = (e) => {
      if (!pos) return;
      if (!personNoteCheckpoint) {
        checkpoint();
        personNoteCheckpoint = true;
      }
      ensureNode(plan(), Math.round(time), "人物备注").positions[
        selectedPerson
      ].note = e.target.value;
      persist();
    };
    $("#person-route").onclick = () => routeEditor(selectedPerson);
    $("#person-stay").onclick = () => intervalEditor(selectedPerson);
    $("#remove-person").onclick = () => {
      checkpoint();
      delete node().positions[selectedPerson];
      selectedPerson = null;
      changed();
    };
    return;
  }
  if (floor < 0 && !selectedRoom) {
    host.innerHTML =
      '<div class="eyebrow">BUILDING / 3D OVERVIEW</div><h2>先理解整个空间。</h2><div class="object-icon">⌂</div><p>别墅包含两层、露台和岛屿外部。点击楼层标签进入该层，再点击房间聚焦。</p><p>隐藏屋顶查看内部；展开楼层查看上下层关系。聚焦房间时墙面透明，方便摆放棋子。</p><span class="tag">编辑推定 · 非精确原作复原</span><p>几何模型、门窗位置、比例与连接关系尚未经过译本核对，不能用于计算真实距离和耗时。</p><button id="inspect-ground" class="wide">进入一层 →</button>';
    $("#inspect-ground").onclick = () => setFloor(0);
    return;
  }
  let r = roomById(selectedRoom) || rooms.find((r) => r.floor === floor);
  host.innerHTML = `<div class="eyebrow">ROOM / ${r.id.toUpperCase()}</div><h2>${r.name}</h2><span class="tag">编辑推定</span><p>${["一层", "二层", "岛屿外部"][r.floor]} · 尺寸与房间关系为展示推定</p><div class="meta-row"><span>当前快照人数</span><b>${Object.values(node().positions).filter((p) => p.room === r.id).length} 人</b></div><button id="focus-room" class="wide">聚焦房间 / 剖切查看</button><h3 style="font-size:12px">相邻连接与状态</h3>${connections
    .filter((e) => e.a === r.id || e.b === r.id)
    .map(
      (e) =>
        `<button data-connection="${e.id}" class="wide">${escape(e.name)} · ${e.stairs ? "楼梯" : node().environment.doors[e.id] === "locked" ? "锁闭" : "可通行"}</button>`,
    )
    .join("")}${windows
    .filter((w) => w.room === r.id)
    .map(
      (w) =>
        `<button data-window="${w.id}" class="wide">${w.name} · ${node().environment.windows[w.id] === "open" ? "开启" : "关闭"}</button>`,
    )
    .join(
      "",
    )}<label class="field">演示钥匙持有人<select id="key-holder"><option value="">未设定</option>${people.map((p, i) => `<option value="${i}" ${String(i) === node().environment.keyHolder ? "selected" : ""}>${p[0]}</option>`).join("")}</select></label><p>钥匙是用户添加的推理物件。当前尚未绑定特定门锁。</p>`;
  $("#focus-room").onclick = () => selectRoom(r.id);
  $$("[data-connection]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedObject = { kind: "door", id: b.dataset.connection };
        renderInspector();
      }),
  );
  $$("[data-window]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedObject = { kind: "window", id: b.dataset.window };
        renderInspector();
      }),
  );
  $("#key-holder").onchange = (e) =>
    envEdit((env) => (env.keyHolder = e.target.value));
}
function renderTimeline() {
  $("#time-now").textContent = formatTime(time);
  $("#scene-time").textContent = formatTime(time);
  $("#scene-scrubber").value = time;
  $("#scene-play").textContent = playing ? "Ⅱ" : "▶";
  $("#scrubber").value = time;
  $("#plan-select").innerHTML = data.plans
    .map(
      (p, i) =>
        `<option value="${i}" ${i === data.active ? "selected" : ""}>${escape(p.name)}</option>`,
    )
    .join("");
  $("#nodes").innerHTML = [...plan().nodes]
    .sort((a, b) => a.t - b.t)
    .map(
      (n) =>
        `<button data-time="${n.t}" class="node ${node() === n ? "active" : ""}">${formatTime(n.t)}<span>${escape(n.label)}</span></button>`,
    )
    .join("");
  $$("[data-time]").forEach(
    (b) =>
      (b.onclick = () => {
        stop();
        time = Number(b.dataset.time);
        syncPlaybackFloor();
        render();
      }),
  );
  $("#action-list").innerHTML =
    plan()
      .routes.map(
        (r) =>
          `<div class="action-row"><span style="color:${people[r.person][2]}">${people[r.person][0]}</span> ${formatTime(r.start)}—${formatTime(r.end)} <span>${r.path.map((id) => roomById(id)?.name || id).join(" → ")}</span><button data-route-time="${r.start}" data-follow-person="${r.person}">定位</button><button data-edit-route="${r.id}">编辑</button><button data-delete-route="${r.id}">删除</button></div>`,
      )
      .join("") ||
    '<p class="muted small">还没有行动路线。先选择人物，再指定经过的门、走廊与楼梯。</p>';
  $$("[data-route-time]").forEach(
    (b) =>
      (b.onclick = () => {
        time = Number(b.dataset.routeTime);
        followedPerson = Number(b.dataset.followPerson);
        setFloor(-1);
        hideRoof = true;
        explode = true;
        syncPlaybackFloor();
        render();
      }),
  );
  $$("[data-edit-route]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = plan().routes.find((r) => r.id === b.dataset.editRoute);
        routeEditor(r.person, r);
      }),
  );
  $$("[data-delete-route]").forEach(
    (b) =>
      (b.onclick = () => {
        checkpoint();
        plan().routes = plan().routes.filter(
          (r) => r.id !== b.dataset.deleteRoute,
        );
        changed();
      }),
  );
}
function stop() {
  clearInterval(playing);
  playing = null;
  $("#play").textContent = "▶";
  $("#scene-play").textContent = "▶";
  $("#play").setAttribute("aria-label", "播放");
}
function modal(html) {
  stop();
  $("#modal-content").innerHTML = html;
  $("#modal").showModal();
}
const parseTime = (value) => {
  let [h, m] = value.split(":").map(Number);
  return (h - 20) * 60 + m;
};
function routeEditor(person = selectedPerson ?? 0, existing = null) {
  let start = existing?.start ?? Math.min(119, Math.round(time)),
    from = existing?.path[0] || node().positions[person]?.room || "living",
    draft = existing ? [...existing.path] : [from];
  modal(
    `<div class="eyebrow">ACTION ROUTE / USER HYPOTHESIS</div><h2>指定一条真正经过的路线</h2><p>位置、经过路径和耗时都是你的设定。系统不把最短路径认作原作行动。</p><label class="field">人物<select id="route-person">${people.map((p, i) => `<option value="${i}" ${i === person ? "selected" : ""}>${p[0]}</option>`).join("")}</select></label><div class="field-grid"><label class="field">开始<input id="route-start" type="time" value="${formatTime(start)}"></label><label class="field">结束<input id="route-end" type="time" value="${formatTime(existing?.end ?? Math.min(120, start + 10))}"></label></div><label class="field">起点<select id="route-from">${roomOptions(from)}</select></label><label class="field">目的地<select id="route-to">${roomOptions(existing?.path.at(-1) || "upper0")}</select></label><button id="suggest-route" class="wide">生成建议路径（确认前不保存）</button><div id="route-preview" class="route-preview"></div><label class="field">选择下一个相邻空间<select id="route-next"></select></label><div class="field-grid"><button id="append-route">加入路径</button><button id="back-route">撤回一步</button></div><p id="route-error" class="error" role="alert"></p><button id="confirm-route" class="primary wide">确认路径并保存行动</button>`,
  );
  const update = () => {
    $("#route-preview").textContent = draft
      .map((id) => roomById(id).name)
      .join(" → ");
    $("#route-next").innerHTML = neighbors(draft.at(-1))
      .map(
        (id) =>
          `<option value="${id}">${roomById(id).name}${edgeBetween(draft.at(-1), id).stairs ? "（经楼梯）" : ""}</option>`,
      )
      .join("");
  };
  update();
  $("#route-from").onchange = (e) => {
    draft = [e.target.value];
    update();
  };
  $("#route-person").onchange = (e) => {
    person = Number(e.target.value);
    from =
      nodeAt(plan(), parseTime($("#route-start").value)).positions[person]
        ?.room || "living";
    $("#route-from").value = from;
    draft = [from];
    update();
  };
  $("#suggest-route").onclick = () => {
    draft = suggestedPath($("#route-from").value, $("#route-to").value);
    update();
  };
  $("#append-route").onclick = () => {
    let id = $("#route-next").value;
    if (id) {
      draft.push(id);
      update();
    }
  };
  $("#back-route").onclick = () => {
    if (draft.length > 1) draft.pop();
    update();
  };
  $("#confirm-route").onclick = () => {
    let start = parseTime($("#route-start").value),
      end = parseTime($("#route-end").value);
    if (!Number.isFinite(start) || !Number.isFinite(end))
      return ($("#route-error").textContent = "请输入有效时刻");
    try {
      if (draft.at(-1) !== $("#route-to").value)
        throw Error("路径尚未到达所选目的地");
      let next = structuredClone(plan());
      if (existing)
        next.routes = next.routes.filter((r) => r.id !== existing.id);
      addRoute(next, { person, start, end, path: [...draft] });
      checkpoint();
      data.plans[data.active] = next;
      selectedPerson = activeTool === "people" ? person : null;
      time = start;
      showPeople = true;
      showTrails = true;
      $("#modal").close();
      changed();
      toast("行动已保存，点击播放沿确认的路径移动");
    } catch (e) {
      $("#route-error").textContent = e.message;
    }
  };
}
function intervalEditor(person = selectedPerson ?? 0) {
  modal(
    `<div class="eyebrow">TIME INTERVAL / EVIDENCE</div><h2>记录停留或人物证词</h2><label class="field">人物<select id="interval-person">${people.map((p, i) => `<option value="${i}" ${i === person ? "selected" : ""}>${p[0]}</option>`).join("")}</select></label><label class="field">地点<select id="interval-room">${roomOptions(node().positions[person]?.room || "living")}</select></label><div class="field-grid"><label class="field">开始<input id="interval-start" type="time" value="${formatTime(Math.min(119, Math.round(time)))}"></label><label class="field">结束<input id="interval-end" type="time" value="${formatTime(Math.min(120, Math.round(time) + 10))}"></label></div><label class="field">信息类型<select id="interval-type"><option value="hypothesis">用户假设</option><option value="testimony">人物证词（未验证）</option></select></label><label class="field">时间精度<select id="interval-approx"><option value="exact">明确区间</option><option value="approx">约在此区间</option></select></label><label class="field">来源<input id="interval-source" placeholder="例如：章节 / 人物口述 / 自己推定" maxlength="200"></label><label class="field">内容<textarea id="interval-content" placeholder="他说自己一直留在客厅…" maxlength="2000"></textarea></label><p class="small muted">记录不会自动改变棋子位置。证词不是已验证事实。</p><p id="interval-error" class="error" role="alert"></p><button id="confirm-interval" class="primary wide">保存区间记录</button>`,
  );
  $("#confirm-interval").onclick = () => {
    let start = parseTime($("#interval-start").value),
      end = parseTime($("#interval-end").value);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end > 120 ||
      end <= start
    )
      return ($("#interval-error").textContent =
        "请选择 20:00—22:00 内的有效区间");
    checkpoint();
    plan().intervals.push({
      id: crypto.randomUUID(),
      person: Number($("#interval-person").value),
      room: $("#interval-room").value,
      start,
      end,
      type: $("#interval-type").value,
      approx: $("#interval-approx").value === "approx",
      source: $("#interval-source").value,
      content: $("#interval-content").value,
      progress: data.progress,
    });
    $("#modal").close();
    tab = "clues";
    openTool("notes");
    syncTabs();
    changed();
  };
}
function openPage(page) {
  currentPage = page;
  stop();
  $$("[data-page]").forEach((b) =>
    b.classList.toggle("active", b.dataset.page === page),
  );
  $("#desk").hidden = page !== "desk";
  $("#other-page").hidden = page === "desk";
  if (page === "desk") {
    scene?.resize();
    return;
  }
  if (page === "library") {
    $("#other-page").innerHTML =
      `<div class="eyebrow">THE CASE LIBRARY</div><h2>走进建筑，摆出行动。</h2><article class="book-card"><div class="book-cover">无人生还</div><h3>阿加莎·克里斯蒂 / 兵岛</h3><p>孤岛上的多人行动推演案例。整体 3D → 楼层 → 房间 → 路线与证词。</p><p>原作背景：十位访客、孤岛与别墅。<br>编辑推定：全部尺寸、房间布局、门窗位置及连接。<br>展示补全：家具造型与岩石地形。<br>用户假设：行动、时间、门窗状态、演示钥匙。</p><button id="enter" class="primary">进入工作台</button></article><article class="book-card k-book-card"><div class="book-cover" style="background:linear-gradient(135deg,#596452,#182d2d)">如首无作祟之物</div><h3>三津田信三 / 媛首村</h3><p>三条参道、双螺旋荣螺塔与三座婚舍。以书前图示和正文空间描述建立关系模型。</p><p>独立作品档案 · 36 位人物 · 村域 / 境内 / 塔内 / 婚舍<br>默认无真相剧透；可展开十三夜的约时证词。</p><a href="kubi.html" class="primary" style="display:inline-block;padding:12px;border-radius:8px;text-decoration:none">进入媛首山 ↗</a></article><p class="muted">《无人生还》Demo 尚未绑定特定译本，模型不能作为精确原作还原。没有提供真相与凶手信息。</p><a href="https://www.agathachristie.com/en/stories/and-then-there-were-none" style="color:var(--mint)">作者官网背景来源</a>`;
    $("#enter").onclick = () => openPage("desk");
  } else renderPlans();
}
function renderPlans() {
  $("#other-page").innerHTML =
    `<div class="eyebrow">YOUR HYPOTHESES</div><h2>保存每一种可能。</h2>${data.plans.map((p, i) => `<article class="plan-card"><h3>${escape(p.name)}</h3><p>${p.nodes.length} 个节点 · ${p.routes.length} 条路线 · ${p.intervals.length} 条区间记录</p><p class="muted small">${escape(p.note)}</p><button data-openplan="${i}" class="primary">继续推演</button> <button data-copy="${i}">复制</button> <button data-rename="${i}">重命名</button> <button data-export="${i}">导出 JSON</button> <button data-delete="${i}" ${data.plans.length === 1 ? "disabled" : ""}>删除</button></article>`).join("")}`;
  $$("[data-openplan]").forEach(
    (b) =>
      (b.onclick = () => {
        data.active = Number(b.dataset.openplan);
        time = 0;
        selectedPerson = null;
        selectedObject = null;
        changed();
        openPage("desk");
      }),
  );
  $$("[data-copy]").forEach(
    (b) =>
      (b.onclick = () => {
        checkpoint();
        const p = structuredClone(data.plans[Number(b.dataset.copy)]);
        p.id = crypto.randomUUID();
        p.name += " · 副本";
        data.plans.push(p);
        data.active = data.plans.length - 1;
        changed();
        renderPlans();
        toast("已创建副本");
      }),
  );
  $$("[data-rename]").forEach(
    (b) =>
      (b.onclick = () => {
        let i = Number(b.dataset.rename);
        modal(
          `<h2>重命名假说</h2><input id="rename-input" maxlength="50" value="${escape(data.plans[i].name)}"><button id="confirm-rename" class="primary wide">保存名称</button>`,
        );
        $("#confirm-rename").onclick = () => {
          let name = $("#rename-input").value.trim();
          if (name) {
            checkpoint();
            data.plans[i].name = name;
            $("#modal").close();
            changed();
            renderPlans();
          }
        };
      }),
  );
  $$("[data-delete]").forEach(
    (b) =>
      (b.onclick = () => {
        let i = Number(b.dataset.delete);
        modal(
          `<h2>删除假说？</h2><p>${escape(data.plans[i].name)}，可以使用撤销恢复。</p><button id="confirm-delete" class="wide">确认删除</button>`,
        );
        $("#confirm-delete").onclick = () => {
          checkpoint();
          data.plans.splice(i, 1);
          data.active = Math.min(data.active, data.plans.length - 1);
          $("#modal").close();
          changed();
          renderPlans();
        };
      }),
  );
  $$("[data-export]").forEach(
    (b) =>
      (b.onclick = () => {
        let p = data.plans[Number(b.dataset.export)],
          url = URL.createObjectURL(
            new Blob(
              [
                JSON.stringify(
                  { scene: SCENE_VERSION, hypothesis: p },
                  null,
                  2,
                ),
              ],
              { type: "application/json" },
            ),
          ),
          a = document.createElement("a");
        a.href = url;
        a.download = "mijing-hypothesis.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }),
  );
}
$$("[data-floor]").forEach(
  (b) => (b.onclick = () => setFloor(Number(b.dataset.floor))),
);
$$("[data-tab]").forEach(
  (b) =>
    (b.onclick = () => {
      tab = b.dataset.tab;
      syncTabs();
      renderInspector();
    }),
);
$$("[data-page]").forEach((b) => (b.onclick = () => openPage(b.dataset.page)));
$("#view3d").onclick = () => {
  view = "3d";
  renderScene();
  scene?.resize();
};
$("#view2d").onclick = () => {
  view = "2d";
  if (floor < 0) setFloor(0);
  renderScene();
};
$("#roof-toggle").onclick = () => {
  hideRoof = !hideRoof;
  renderScene();
};
$("#wall-toggle").onclick = () => {
  cut = !cut;
  renderScene();
};
$("#explode-toggle").onclick = () => {
  explode = !explode;
  renderScene();
};
$("#ghost-toggle").onclick = () => {
  ghost = !ghost;
  renderScene();
};
$("#trails").onclick = () => {
  showTrails = !showTrails;
  renderScene();
};
function zoomMap(factor) {
  const b = $("#map").viewBox.baseVal;
  const w = Math.max(250, Math.min(1600, b.width * factor)),
    h = w * 0.62;
  $("#map").setAttribute(
    "viewBox",
    `${b.x + (b.width - w) / 2} ${b.y + (b.height - h) / 2} ${w} ${h}`,
  );
}
$("#resetview").onclick = () =>
  view === "2d"
    ? $("#map").setAttribute("viewBox", "0 0 1000 620")
    : scene?.reset();
$("#zoomin").onclick = () =>
  view === "2d" ? zoomMap(0.85) : scene?.zoomBy(0.85);
$("#zoomout").onclick = () =>
  view === "2d" ? zoomMap(1.15) : scene?.zoomBy(1.15);
$("#rotate").onclick = () => scene?.rotate();
$("#undo").onclick = () => {
  stop();
  if (!history.length) return toast("暂无可撤销操作");
  data = JSON.parse(history.pop());
  data.plans.forEach(normalizePlan);
  changed();
  if (currentPage === "plans") renderPlans();
  toast("已撤销");
};
$("#progress").onchange = (e) => {
  checkpoint();
  data.progress = Number(e.target.value);
  changed();
};
$("#scrubber").oninput = (e) => {
  stop();
  time = Number(e.target.value);
  syncPlaybackFloor();
  renderScene();
  renderTimeline();
  renderInspector();
};
$("#play").onclick = () => {
  if (playing) return stop();
  if (time >= 120) time = 0;
  followedPerson = selectedPerson ?? followedPerson;
  syncPlaybackFloor();
  renderScene();
  $("#play").textContent = "Ⅱ";
  $("#play").setAttribute("aria-label", "暂停");
  playing = setInterval(() => {
    time = Math.min(120, time + 0.2 * Number($("#speed").value));
    syncPlaybackFloor();
    renderScene();
    renderTimeline();
    if (time >= 120) stop();
  }, 100);
};
$("#plan-select").onchange = (e) => {
  stop();
  data.active = Number(e.target.value);
  followedPerson = null;
  selectedPerson = null;
  selectedObject = null;
  time = 0;
  changed();
};
$("#add-route").onclick = () => routeEditor();
$("#add-interval").onclick = () => intervalEditor();
$("#addnode").onclick = () => {
  modal(
    `<h2>新建时间节点</h2><input id="node-time" type="time" value="${formatTime(time)}"><input id="node-label" maxlength="40" value="新的状态"><p class="error" id="node-error"></p><button id="confirm-node" class="primary wide">创建节点</button>`,
  );
  $("#confirm-node").onclick = () => {
    let t = parseTime($("#node-time").value);
    if (
      !Number.isFinite(t) ||
      t < 0 ||
      t > 120 ||
      plan().nodes.some((n) => n.t === t)
    )
      return ($("#node-error").textContent = "请选择范围内尚未使用的时刻");
    checkpoint();
    ensureNode(plan(), t, $("#node-label").value || "新的状态");
    time = t;
    $("#modal").close();
    changed();
  };
};
$("#newplan").onclick = () => {
  modal(
    '<h2>创建空白假说</h2><input id="plan-name" maxlength="50" placeholder="记录名称"><button id="confirm-plan" class="primary wide">创建</button>',
  );
  $("#confirm-plan").onclick = () => {
    checkpoint();
    let p = emptyPlan(
      $("#plan-name").value.trim() || `假说 ${data.plans.length + 1}`,
    );
    time = 0;
    selectedPerson = null;
    data.plans.push(p);
    data.active = data.plans.length - 1;
    $("#modal").close();
    changed();
  };
};
$("#example").onclick = () => {
  modal(
    '<h2>创建独立演示假说</h2><p>演示维拉在 20:00—20:10 经大厅、走廊和楼梯到达客房。所有行动均为用户假设，原方案保留。</p><button id="confirm-example" class="primary wide">创建并查看</button>',
  );
  $("#confirm-example").onclick = () => {
    checkpoint();
    let p = blankPlan("演示假说 · 经楼梯到客房");
    addRoute(p, {
      person: 0,
      start: 0,
      end: 10,
      path: suggestedPath("living", "upper0"),
    });
    for (let n of p.nodes.filter((n) => n.t > 10))
      n.positions[0] = { ...n.positions[0], room: "upper0", u: 0.5, v: 0.5 };
    data.plans.push(p);
    data.active = data.plans.length - 1;
    time = 0;
    floor = -1;
    focus = null;
    selectedRoom = null;
    selectedPerson = 0;
    hideRoof = true;
    explode = true;
    showTrails = true;
    showPeople = true;
    $("#modal").close();
    changed();
  };
};
$("#save").onclick = async () => {
  persist();
  clearTimeout(syncTimer);
  toast(
    backendReady
      ? (await syncBackend())
        ? "已保存"
        : "同步暂不可用，已保存在本机"
      : "已保存浏览器副本",
  );
};
$("#check").onclick = () => {
  let list = conflicts(plan());
  $("#check-result").innerHTML = list.length
    ? `<ul>${list.map((s) => `<li>${escape(s)}</li>`).join("")}</ul>`
    : "在已录入条件下未发现冲突。尺寸和速度没有原文依据，不判断真实耗时；这不能证明假说或证词成立。";
};
$("#mode").onclick = () =>
  modal(
    "<h2>空间推演操作</h2><p>1. 从完整建筑进入楼层，再聚焦房间。<br>2. 选择人物，在楼层地面点击放置。<br>3. 指定起止时间，预览并确认经过门、走廊和楼梯的路线。<br>4. 播放行动，记录证词或停留区间。<br>5. 在时间节点编辑门窗状态，检查冲突并保存。</p><p>直接修改节点不会自动创建行动路线。约略时间只作为区间标记，不计算精确速度。</p>",
  );

const drawer = $(".right-panel");
drawer.insertBefore($("#people-tool"), $("#inspector"));
drawer.append($(".timeline"));
drawer.append($(".check-card"));
const progressLabel = $("#progress").closest("label");
progressLabel.firstChild.textContent = "背景提示";
$("#progress").options[0].textContent = "人物与岛屿";
$("#progress").options[1].textContent = "晚餐场景物件";
drawer.append(progressLabel);
function openTool(tool, keepSelection = false) {
  if (tool !== "actions") stop();
  activeTool = tool;
  drawer.hidden = !tool;
  document.body.classList.toggle("tools-open", !!tool);
  $("#tool-title").textContent =
    { people: "人物", notes: "随记", actions: "推演", info: "场景说明" }[
      tool
    ] || "";
  $("#people-tool").hidden = tool !== "people";
  $(".timeline").hidden = tool !== "actions";
  $(".check-card").hidden = tool !== "actions";
  $(".scene-playback").hidden = tool !== "actions";
  $(".source-note").hidden = tool !== "info";
  progressLabel.hidden = tool !== "info";
  $(".inspector-tabs").hidden = true;
  $("#inspector").hidden = !["people", "notes", "info"].includes(tool);
  if (tool === "notes") tab = "clues";
  else tab = "object";
  if (tool === "people" || tool === "actions") showPeople = true;
  if (tool !== "people" && !keepSelection) selectedPerson = null;
  $$("[data-tool]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tool === tool);
    b.setAttribute("aria-expanded", String(b.dataset.tool === tool));
  });
  renderInspector();
  renderScene();
  requestAnimationFrame(() => scene?.resize());
}
$$("[data-tool]").forEach(
  (b) =>
    (b.onclick = () =>
      openTool(activeTool === b.dataset.tool ? null : b.dataset.tool)),
);
$("#close-tools").onclick = () => {
  stop();
  openTool(null);
};
$("#cancel-placement").onclick = () => {
  selectedPerson = null;
  render();
};
$("#finish-placement").onclick = () => {
  selectedPerson = null;
  render();
  toast("已结束放置，可以继续查看场景");
};
$("#people-toggle").onclick = () => {
  showPeople = !showPeople;
  if (!showPeople) selectedPerson = null;
  $("#people-toggle").textContent = showPeople ? "隐藏人物" : "显示人物";
  $("#cancel-placement").hidden = selectedPerson === null;
  renderScene();
};
$("#scene-play").onclick = () => $("#play").click();
$("#scene-scrubber").oninput = (e) => {
  stop();
  time = Number(e.target.value);
  syncPlaybackFloor();
  renderScene();
  renderTimeline();
  renderInspector();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#modal").open) {
    stop();
    openTool(null);
  }
});
openTool(null);

async function init() {
  render();
  $("#desk").inert = true;
  await loadBackend();
  $("#desk").inert = false;
  try {
    const { VillaScene } = await import("./scene3d.js");
    scene = new VillaScene($("#webgl"), {
      getTime: () => time,
      getSelectedPerson: () => selectedPerson,
      onFloor: setFloor,
      onRoof: () => {
        hideRoof = true;
        renderScene();
      },
      onRoom: selectRoom,
      onPerson: selectPerson,
      onObject: (o) => {
        openTool("info");
        selectedObject = o;
        selectedPerson = null;
        tab = "object";
        syncTabs();
        renderInspector();
      },
      onPlace: (id, room, point) => {
        let r = roomById(room);
        placePerson(
          id,
          room,
          (point.x / 0.028 + 407 - r.x) / r.w,
          (point.z / 0.028 + 295 - r.y) / r.h,
        );
      },
    });
    renderScene();
    scene.reset();
  } catch (e) {
    console.error(e);
    view = "2d";
    floor = 0;
    $("#scene-error").hidden = false;
    $("#scene-error").textContent = "设备无法初始化 WebGL，已切换到俯视图。";
    render();
  }
}
init();

if (new URLSearchParams(location.search).get("library") === "1")
  openPage("library");
