import { characterIcon } from "../../character-model.js";
import {
  people,
  places,
  edges,
  byId,
  blankPlan,
  clock,
  routeBetween,
  routePoints,
  positionAt,
  conflicts,
  observations,
} from "./data.js";
import { MountainScene } from "./scene.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const API = "/api/works/kubi/state",
  KEY = "mijing-kubi-v1";
let state = { version: 1, active: 0, reading: "map", plans: [blankPlan()] },
  person = null,
  focus = null,
  t = 0,
  mode = "village",
  flat = false,
  scene = null,
  playing = null,
  dirty = false,
  saving = false,
  saveTimer = null;
const plan = () => state.plans[state.active];
function toast(msg) {
  $("#toast").textContent = msg;
  $("#toast").style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").style.display = "none"), 3500);
}
function valid(s) {
  return (
    s &&
    s.version === 1 &&
    Number.isInteger(s.active) &&
    Array.isArray(s.plans) &&
    s.plans.length &&
    s.active >= 0 &&
    s.active < s.plans.length &&
    ["map", "eight"].includes(s.reading) &&
    s.plans.every(
      (p) =>
        typeof p.name === "string" &&
        ["free", "thirteen", "wedding"].includes(p.period) &&
        ["placements", "routes", "notes"].every((k) => Array.isArray(p[k])) &&
        p.placements.every(
          (x) =>
            Number.isInteger(x.person) &&
            people[x.person] &&
            byId(x.place) &&
            Number.isInteger(x.t) &&
            x.t >= 0 &&
            x.t <= 180,
        ) &&
        p.routes.every(
          (r) =>
            people[r.person] &&
            Number.isInteger(r.start) &&
            Number.isInteger(r.end) &&
            r.start >= 0 &&
            r.end <= 180 &&
            r.end > r.start &&
            Array.isArray(r.path) &&
            r.path.length >= 2 &&
            r.path.every(byId),
        ) &&
        p.notes.every(
          (n) =>
            typeof n.text === "string" &&
            Number.isInteger(n.t) &&
            n.t >= 0 &&
            n.t <= 180,
        ),
    )
  );
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    toast("浏览器保存失败，请导出 JSON 备份。");
  }
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(false), 700);
}
async function save(explicit = true) {
  if (saving) {
    if (explicit) toast("正在保存…");
    return;
  }
  saving = true;
  dirty = false;
  const snapshot = JSON.stringify(state);
  try {
    const r = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: snapshot,
    });
    if (!r.ok) throw Error();
    $("#sync").textContent = "● Java 后端 · 假说已保存";
    if (explicit) toast("已保存到独立作品档案");
  } catch {
    dirty = true;
    $("#sync").textContent = "● 本地浏览器已保存 · 后端未同步";
    if (explicit) toast("已保存在浏览器，可导出 JSON；后端未同步。");
  } finally {
    saving = false;
    if (dirty && JSON.stringify(state) !== snapshot) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => save(false), 700);
    }
  }
}
function changed() {
  persist();
  $("#checks").textContent = "假说已更新，请重新检查。";
  render();
}
function options() {
  return places
    .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
    .join("");
}
for (const id of ["destination", "from", "to"])
  $("#" + id).innerHTML = options();
$("#from").value = "shrine";
$("#to").value = "frontRoom";
function selectPlace(id) {
  focus = id;
  const p = byId(id);
  $("#destination").value = id;
  $("#place-title").textContent = p.name;
  $("#place-detail").textContent = p.detail;
  $("#place-source").textContent =
    "依据：" + p.source + " · 坐标与造型为展示推定";
  if (person !== null) {
    place(id);
    return;
  }
  mode =
    p.kind === "room"
      ? "room"
      : p.kind === "tower"
        ? "tower"
        : p.kind === "village"
          ? "village"
          : "compound";
  if (mode === "room" || mode === "tower") {
    $("#cut").checked = true;
    scene?.cut(true);
  }
  setView(mode, id);
  render();
}
function setView(value, id = null) {
  mode = value;
  $$("[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === value),
  );
  $("#view-label").textContent = {
    village: "媛首村 · 整体方位",
    compound: "媛神堂 · 境内建筑群",
    tower: "荣螺塔 · 双螺旋斜道",
    room: "婚舍 · 茶室与六叠间",
  }[value];
  if (value === "tower" || value === "room") {
    $("#cut").checked = true;
    scene?.cut(true);
  }
  const target =
    value === "room"
      ? byId(id || focus)?.kind === "room"
        ? id || focus
        : "middleRoom"
      : id || focus;
  scene?.view(value, target);
  if (value === "room") focus = target;
  if (!id) {
    const hints = {
      village: ["村域与三侧入口", "先看各家与山的相对位置，再进入境内。"],
      compound: [
        "神堂、荣螺塔与婚舍",
        "点击建筑进入；打开屋顶和外墙可查看内部。",
      ],
      tower: [
        "两条斜道 · 顶部转接",
        "金色由神堂侧进入，青色由婚舍侧进入；两条斜道在顶部转接。",
      ],
      room: [
        "茶室与六叠间",
        "左侧选择前、中、后婚舍；剖切后查看隔间与出入口。",
      ],
    };
    $("#place-title").textContent = hints[value][0];
    $("#place-detail").textContent = hints[value][1];
  }
  render();
}
function place(id) {
  if (person === null) return toast("请先选择一个人物");
  const p = plan();
  p.placements = p.placements.filter(
    (x) => !(x.person === person && x.t === t),
  );
  const placedPerson = person;
  p.placements.push({ person, t, place: id });
  if (matchMedia("(max-width: 760px)").matches) person = null;
  changed();
  toast(
    `${people[placedPerson].name} · ${clock(t, p.period)} · ${byId(id).name}`,
  );
}
function render() {
  const p = plan();
  $("#reading").value = state.reading;
  $("#period").value = p.period;
  $("#plans").innerHTML = state.plans
    .map((p, i) => `<option value="${i}">${esc(p.name)}</option>`)
    .join("");
  $("#plans").value = state.active;
  $("#name").value = p.name;
  $("#time").value = t;
  $("#time-label").textContent = clock(t, p.period);
  $("#time-ticks").innerHTML = [0, 30, 60, 90, 120, 150, 180]
    .map((v) => `<span>${clock(v, p.period)}</span>`)
    .join("");
  const order = [
    [
      "村域与入口",
      (p) => ["village", "gate"].includes(p.kind) && !p.id.endsWith("Inner"),
    ],
    [
      "参道与境内",
      (p) =>
        ["well", "landmark", "ground"].includes(p.kind) ||
        p.id.endsWith("Inner") ||
        ["ritual", "kannon", "shrine", "toilet"].includes(p.id),
    ],
    ["塔与婚舍", (p) => ["tower", "room"].includes(p.kind)],
  ];
  const relevant = (x) =>
    mode === "village"
      ? ["village", "gate"].includes(x.kind) && !x.id.endsWith("Inner")
      : mode === "tower"
        ? ["tower", "room"].includes(x.kind)
        : mode === "room"
          ? x.kind === "room"
          : x.kind !== "village";
  $("#places").innerHTML = order
    .map(([title, test]) => {
      const items = places.filter((x) => test(x) && relevant(x));
      return items.length
        ? `<small>${title}</small>${items
            .map(
              (x) =>
                `<button data-place="${x.id}" class="${focus === x.id ? "active" : ""}">${esc(x.name)}</button>`,
            )
            .join("")}`
        : "";
    })
    .join("");
  $$("[data-place]").forEach(
    (b) => (b.onclick = () => selectPlace(b.dataset.place)),
  );
  const placed = people.filter((x) => positionAt(p, x.id, t)).length;
  $("#count").textContent = `${placed} / ${people.length}`;
  $("#people").innerHTML = people
    .filter(
      (x) => $("#group").value === "全部人物" || x.group === $("#group").value,
    )
    .map(
      (x) =>
        `<button class="k-person ${person === x.id ? "active" : ""}" data-person="${x.id}"><svg class="character-portrait" viewBox="-16 -25 32 40" aria-hidden="true">${characterIcon(x.role, x.color, true)}</svg><span>${esc(x.name)}<small>${esc(x.group)} · ${esc(x.role)}</small></span>${positionAt(p, x.id, t) ? '<span class="status">已放置</span>' : ""}</button>`,
    )
    .join("");
  $$("[data-person]").forEach(
    (b) =>
      (b.onclick = () => {
        person =
          person === Number(b.dataset.person) ? null : Number(b.dataset.person);
        if (matchMedia("(max-width: 760px)").matches) openKTool(null, true);
        render();
      }),
  );
  $("#person-detail").textContent =
    person === null
      ? "尚未选择人物"
      : `${people[person].name} / ${people[person].group} / ${people[person].role}`;
  $("#selection").hidden = person === null;
  $("#selection").textContent =
    person === null
      ? ""
      : `正在放置：${people[person].name} · 点地点 / 平面图标记`;
  $("#events").innerHTML = [
    ...new Set([
      ...p.placements.map((x) => x.t),
      ...p.routes.flatMap((x) => [x.start, x.end]),
      ...p.notes.map((x) => x.t),
    ]),
  ]
    .sort((a, b) => a - b)
    .map((v) => `<button data-time="${v}">${clock(v, p.period)}</button>`)
    .join("");
  $$("[data-time]").forEach(
    (b) =>
      (b.onclick = () => {
        t = Number(b.dataset.time);
        stop();
        render();
      }),
  );
  $("#routes").innerHTML = p.routes
    .map(
      (r, i) =>
        `<div class="k-record"><button data-remove-route="${i}">移除</button><b>${esc(people[r.person].name)} · ${clock(r.start, p.period)}—${clock(r.end, p.period)}</b><br>${r.path.map((id) => esc(byId(id).name)).join(" → ")}<small>用户假设 · 连通图建议，已由用户确认</small></div>`,
    )
    .join("");
  $$("[data-remove-route]").forEach(
    (b) =>
      (b.onclick = () => {
        p.routes.splice(Number(b.dataset.removeRoute), 1);
        changed();
      }),
  );
  $("#notes").innerHTML = p.notes
    .map(
      (n, i) =>
        `<div class="k-record"><button data-remove-note="${i}">移除</button><b>${clock(n.t, p.period)}</b> ${esc(n.text)}<small>用户假说</small></div>`,
    )
    .join("");
  $$("[data-remove-note]").forEach(
    (b) =>
      (b.onclick = () => {
        p.notes.splice(Number(b.dataset.removeNote), 1);
        changed();
      }),
  );
  $("#evidence").innerHTML =
    state.reading === "eight"
      ? `<h3>十三夜 · 约时记录</h3><p class="muted small">第六章整理的时间表，非精确测时。目击名称不自动确定身份；不会添加棋子或路线。与十年后婚舍集会分开。</p>${observations.map((o, i) => `<div class="k-record"><button data-observation="${i}">看地点</button><b>约 ${clock(o.t, "thirteen")}</b><br>${esc(o.text)}<small>${esc(o.source)}</small></div>`).join("")}`
      : '<h3>书中记录</h3><p class="muted small">默认仅展示人物与书前空间关系。阅读至第八章后，可在随记面板展开十三夜的约时证词。</p>';
  $$("[data-observation]").forEach(
    (b) =>
      (b.onclick = () => {
        const o = observations[Number(b.dataset.observation)];
        person = null;
        selectPlace(o.place);
        if (p.period === "thirteen") {
          t = o.t;
          render();
        } else toast("正在查看十三夜记录；当前假说时段保持不变。");
      }),
  );
  scene?.update(p, t, person);
  renderMap();
  updatePath();
}
function renderMap() {
  if (!flat) return;
  const p = plan(),
    v =
      mode === "village"
        ? "-55 -46 110 92"
        : mode === "tower"
          ? "-9 -8 12 16"
          : mode === "room"
            ? `${byId(focus && byId(focus)?.kind === "room" ? focus : "middleRoom").x - 6} ${byId(focus && byId(focus)?.kind === "room" ? focus : "middleRoom").z - 6} 16 12`
            : "-28 -17 55 34";
  let svg = `<svg viewBox="${v}" aria-label="媛首山关系平面图"><defs><pattern id="k-grid" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M2 0H0V2" fill="none" stroke="#9dac9a" stroke-width=".025"/></pattern><pattern id="gravel" width="1.8" height="1.8" patternUnits="userSpaceOnUse"><circle cx=".4" cy=".4" r=".06" fill="#acb49b"/></pattern></defs><rect x="-60" y="-50" width="120" height="100" fill="#eee9db"/><rect x="-60" y="-50" width="120" height="100" fill="url(#k-grid)"/><ellipse cx="-3" cy="0" rx="29" ry="14" fill="#d6ddc9"/><ellipse cx="-3" cy="0" rx="29" ry="14" fill="url(#gravel)"/>`;
  if (mode === "village")
    for (let contour = 0; contour < 5; contour++)
      svg += `<ellipse cx="-3" cy="0" rx="${30 + contour * 2.3}" ry="${15 + contour * 1.8}" fill="none" stroke="#8eaa94" stroke-width=".08"/>`;
  for (const [a, b] of edges) {
    if (a.startsWith("tower") && b.startsWith("tower")) continue;
    const points = routePoints([a, b]);
    svg += `<polyline points="${points.map((x) => `${x.x},${x.z}`).join(" ")}" fill="none" stroke="#8b9785" stroke-width=".4"/>`;
  }
  svg +=
    '<polygon points="1,0 -1,-4 -5,-4 -7,0 -5,4 -1,4" fill="#c9c9b2" stroke="#49676c" stroke-width=".15"/>';
  for (const id of [
    "shrine",
    "frontTea",
    "frontRoom",
    "middleTea",
    "middleRoom",
    "rearTea",
    "rearRoom",
  ]) {
    const x = byId(id);
    svg += `<rect x="${x.x - (id === "shrine" ? 5 : 1.8)}" y="${x.z - (id === "shrine" ? 4.5 : 1.9)}" width="${id === "shrine" ? 10 : 3.6}" height="${id === "shrine" ? 9 : 3.8}" fill="${id.endsWith("Room") ? "#dfdfc8" : "#d9cbb7"}" stroke="#49676c" stroke-width=".1"/>`;
  }
  for (const id of ["frontRoom", "middleRoom", "rearRoom"]) {
    const r = byId(id);
    svg += `<g fill="none" stroke="#7f9388" stroke-width=".06" pointer-events="none"><rect x="${r.x - 1.55}" y="${r.z - 1.65}" width="3.1" height="3.3"/><path d="M${r.x - 1.55} ${r.z}h3.1M${r.x - 0.52} ${r.z - 1.65}v3.3M${r.x + 0.52} ${r.z - 1.65}v3.3"/></g>`;
  }
  for (const prefix of ["front", "middle", "rear"]) {
    const room = byId(prefix + "Room"),
      tea = byId(prefix + "Tea");
    svg += `<text x="${(room.x + tea.x) / 2}" y="${room.z - 3}" text-anchor="middle" fill="#49676c" font-size=".9">${esc(tea.name.split(" · ")[0])}</text>`;
  }
  for (const x of places) {
    if (["towerEntry", "towerExit"].includes(x.id)) continue;
    const label = x.id.endsWith("Tea")
      ? "茶室"
      : x.id.endsWith("Room")
        ? "六叠间"
        : x.id === "stone"
          ? "藏身点"
          : x.id === "well"
            ? "水井"
            : x.id === "towerTop"
              ? "荣螺塔"
              : x.id === "courtyard"
                ? "玉砂利"
                : x.name.replace(" · ", " / ");
    svg += `<g data-map-place="${x.id}" style="cursor:pointer"><circle cx="${x.x}" cy="${x.z}" r="${focus === x.id ? 0.7 : 0.4}" fill="${focus === x.id ? "#ba7958" : "#49676c"}"/><text x="${x.x}" y="${x.z - 1.1}" fill="#34565e" text-anchor="middle" font-size="${mode === "village" ? 1.2 : 0.75}" stroke="#eee9db" stroke-width=".2" paint-order="stroke">${esc(label)}</text></g>`;
  }
  for (const r of p.routes)
    svg += `<polyline points="${routePoints(r.path)
      .map((v) => `${v.x},${v.z}`)
      .join(
        " ",
      )}" fill="none" stroke="${people[r.person].color}" stroke-width=".18"/>`;
  for (const x of people) {
    const pos = positionAt(p, x.id, t);
    if (pos)
      svg += `<g transform="translate(${pos.x} ${pos.z}) scale(.055)">${characterIcon(x.role, x.color, true)}</g><text x="${pos.x + 0.7}" y="${pos.z + 0.4}" font-size="1" fill="#34565e">${esc(x.name)}</text>`;
  }
  const [vx, vy, vw, vh] = v.split(" ").map(Number),
    font = vw / 70;
  svg += `<rect x="${vx + 0.6}" y="${vy + 0.6}" width="${vw - 1.2}" height="${vh - 1.2}" fill="none" stroke="#7f9388" stroke-width="${vw / 1100}" pointer-events="none"/><text x="${vx + vw * 0.04}" y="${vy + vh * 0.09}" fill="#49676c" font-size="${font}">媛首山 / ${mode === "village" ? "地域关系" : mode === "tower" ? "双螺旋塔" : mode === "room" ? "婚舍结构" : "境内总图"}</text><text x="${vx + vw * 0.91}" y="${vy + vh * 0.09}" fill="#49676c" font-size="${font}">北 ↑</text><text x="${vx + vw * 0.04}" y="${vy + vh * 0.95}" fill="#49676c" font-size="${font * 0.7}">连通关系图 · 无比例尺 · 材质与服饰为展示推定</text></svg>`;
  $("#flat").innerHTML = svg;
  $$("[data-map-place]").forEach(
    (g) => (g.onclick = () => selectPlace(g.dataset.mapPlace)),
  );
}
function updatePath() {
  $("#path").textContent =
    routeBetween($("#from").value, $("#to").value)
      .map((id) => byId(id).name)
      .join(" → ") || "两地没有已建模的连接，无法添加路线。";
}
function stop() {
  clearInterval(playing);
  playing = null;
  $("#play").textContent = "▶ 播放";
}
$("#play").onclick = () => {
  if (playing) return stop();
  if (t >= 180) t = 0;
  $("#play").textContent = "Ⅱ 暂停";
  playing = setInterval(() => {
    t++;
    if (t >= 180) {
      t = 180;
      stop();
    }
    $("#time").value = t;
    $("#time-label").textContent = clock(t, plan().period);
    scene?.update(plan(), t, person);
    renderMap();
  }, 500);
};
$("#time").oninput = (e) => {
  stop();
  t = Number(e.target.value);
  render();
};
$("#reading").onchange = (e) => {
  state.reading = e.target.value;
  changed();
};
$("#group").onchange = render;
$("#save").onclick = () => save();
$("#about").onclick = () => $("#source-dialog").showModal();
$("#close-source").onclick = () => $("#source-dialog").close();
$$("[data-view]").forEach((b) => (b.onclick = () => setView(b.dataset.view)));
$("#whole").onclick = () => {
  person = null;
  focus = null;
  setView("village");
  render();
};
$("#cut").onchange = (e) => scene?.cut(e.target.checked);
function showFlat(value) {
  flat = value;
  $("#flat").hidden = !value;
  $("#scene").hidden = value;
  $("#map").classList.toggle("active", value);
  $("#three").classList.toggle("active", !value);
  renderMap();
  if (!value) scene?.resize();
}
$("#map").onclick = () => showFlat(true);
$("#three").onclick = () =>
  scene ? showFlat(false) : toast("3D 当前不可用，可使用平面地图。");
$("#plans").onchange = (e) => {
  stop();
  state.active = Number(e.target.value);
  t = 0;
  person = null;
  changed();
};
$("#new").onclick = () => {
  stop();
  state.plans.push({
    ...blankPlan(),
    name: `媛首山 · 假说 ${state.plans.length + 1}`,
  });
  state.active = state.plans.length - 1;
  t = 0;
  person = null;
  changed();
};
$("#copy").onclick = () => {
  const p = structuredClone(plan());
  p.name += " · 副本";
  state.plans.push(p);
  state.active = state.plans.length - 1;
  changed();
};
$("#delete").onclick = () => {
  if (state.plans.length === 1) return toast("请至少保留一个假说");
  state.plans.splice(state.active, 1);
  state.active = 0;
  t = 0;
  stop();
  changed();
};
$("#name").onchange = (e) => {
  plan().name = e.target.value.trim() || "未命名假说";
  changed();
};
$("#period").onchange = (e) => {
  if (plan().placements.length || plan().routes.length || plan().notes.length) {
    const p = blankPlan();
    p.period = e.target.value;
    p.name =
      e.target.value === "wedding"
        ? "婚舍集会 · 新假说"
        : "十三夜 / 自由 · 新假说";
    state.plans.push(p);
    state.active = state.plans.length - 1;
    toast("已有行动保留在原假说；另建此时段假说。");
  } else plan().period = e.target.value;
  t = 0;
  stop();
  changed();
};
$("#place").onclick = () => place($("#destination").value);
$("#remove").onclick = () => {
  if (person === null) return toast("请先选择人物");
  plan().placements = plan().placements.filter(
    (x) => !(x.person === person && x.t === t),
  );
  changed();
};
$("#from").onchange = updatePath;
$("#to").onchange = updatePath;
$("#add-route").onclick = () => {
  if (person === null) return toast("请先选择人物");
  const start = Number($("#start").value),
    end = Number($("#end").value),
    path = routeBetween($("#from").value, $("#to").value);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > 180 ||
    end <= start
  )
    return toast("时间必须是 0—180 内的整数，结束晚于开始");
  if (path.length < 2) return toast("请选择两个不同且连通的地点");
  plan().routes.push({ person, start, end, path });
  changed();
  toast("路线已确认，可播放查看");
};
$("#add-note").onclick = () => {
  const text = $("#note").value.trim();
  if (!text) return;
  plan().notes.push({ t, text: text.slice(0, 2000) });
  $("#note").value = "";
  changed();
};
$("#check").onclick = () => {
  const issues = conflicts(plan());
  $("#checks").innerHTML = issues.length
    ? issues.map((x) => `<p>△ ${esc(x)}</p>`).join("")
    : "✓ 未发现连接或时间重叠冲突。监视是否连续、身份与真实耗时仍需你依据小说判断。";
};
$("#demo").onclick = () => {
  stop();
  const p = blankPlan();
  p.name = "结构体验 · 经双螺旋进入前婚舍";
  p.placements = [{ person: 3, t: 30, place: "shrine" }];
  p.routes = [
    {
      person: 3,
      start: 30,
      end: 60,
      path: routeBetween("shrine", "frontRoom"),
    },
  ];
  p.notes = [
    {
      t: 30,
      text: "这是用户行动示例，用于观察塔内两条独立通道；30 分钟时段不是小说给出的实际耗时。",
    },
  ];
  state.plans.push(p);
  state.active = state.plans.length - 1;
  person = 3;
  t = 30;
  setView("tower");
  showFlat(false);
  changed();
  toast("已新建结构体验假说，原假说保留。点击播放查看。");
};
$("#export").onclick = () => {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            work: "kubi",
            sceneVersion: 1,
            geometry: "关系有据，尺寸与高度推定",
            plan: plan(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "如首无作祟之物-假说.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const kDrawer = $(".k-right");
kDrawer.insertBefore($("#k-people-tool"), $(".k-action"));
kDrawer.append($(".k-time"));
$(".k-stage").append($(".k-detail"));
const readingLabel = $("#reading").closest("label");
kDrawer.append(readingLabel);
function openKTool(tool, keepSelection = false) {
  kDrawer.hidden = !tool;
  document.body.classList.toggle("tools-open", !!tool);
  $("#k-tool-title").textContent =
    { people: "人物", notes: "随记", actions: "推演" }[tool] || "";
  $("#k-people-tool").hidden = tool !== "people";
  $(".optional-route").open = tool === "actions";
  $(".k-action").hidden = tool !== "people" && tool !== "actions";
  // Route configuration is optional even while placing people.
  $(".k-time").hidden = tool !== "actions";
  $("#k-check").hidden = tool !== "actions";
  $("#k-notes").hidden = tool !== "notes";
  $("#evidence").hidden = tool !== "notes";
  readingLabel.hidden = tool !== "notes";
  $$("[data-k-tool]").forEach((b) => {
    b.classList.toggle("active", b.dataset.kTool === tool);
    b.setAttribute("aria-expanded", String(b.dataset.kTool === tool));
  });
  if (!tool) {
    if (!keepSelection) person = null;
    stop();
    render();
  }
  requestAnimationFrame(() => scene?.resize());
}
$$("[data-k-tool]").forEach(
  (b) =>
    (b.onclick = () =>
      openKTool(b.classList.contains("active") ? null : b.dataset.kTool)),
);
$("#k-close").onclick = () => openKTool(null);
$("#selection").onclick = () => {
  person = null;
  render();
};
$("#k-finish").onclick = () => {
  person = null;
  render();
  toast("已结束放置");
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openKTool(null);
});
openKTool(null);

try {
  const local = JSON.parse(localStorage.getItem(KEY) || "null");
  if (valid(local)) state = local;
} catch {}
render();
try {
  scene = new MountainScene($("#scene"), selectPlace, () => {
    showFlat(true);
    toast("3D 上下文已失效，已切换到平面图。");
  });
  scene.view(mode, focus);
  scene.update(plan(), t, person);
} catch {
  showFlat(true);
  $("#three").disabled = true;
  toast("当前环境不支持 3D，已启用平面地图。");
}
const localAtStart = JSON.stringify(state);
try {
  const r = await fetch(API);
  if (!r.ok) throw Error();
  const remote = await r.json();
  if (remote !== null && !valid(remote)) throw Error();
  if (remote && JSON.stringify(state) === localAtStart && !dirty) {
    state = remote;
    render();
  }
  $("#sync").textContent = "已连接";
} catch {
  $("#sync").textContent = "● 本地浏览器模式 · 可导出假说";
}
