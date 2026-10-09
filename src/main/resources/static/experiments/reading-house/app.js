import { ReadingScene } from "./scene.js";
import {
  rooms,
  byId,
  floorNames,
  personNames,
  roles,
  colors,
  visibleRooms,
  freshRecord,
  normalizeRecord,
} from "./data.js";
import { characterIcon } from "../../character-model.js";
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s).replace(
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
const KEY = "mijing-reading-house-v1";
let record = freshRecord();
try {
  record = normalizeRecord(JSON.parse(localStorage.getItem(KEY)));
} catch {}
let floor = "all",
  focus = null,
  view = "3d",
  selected = null,
  tool = null,
  showPeople = false,
  scene = null,
  playing = null,
  followed = null;
const node = () => record.nodes[record.active];
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
    $("#save-status").textContent = "已保存到当前浏览器 · 与原版记录独立";
  } catch {
    $("#save-status").textContent = "当前浏览器无法持久保存，请保持页面打开。";
  }
}
function stop() {
  clearInterval(playing);
  playing = null;
}
function pickRoom(id, p = null) {
  const r = byId(id);
  if (r.chapter > record.chapter) return;
  if (selected !== null) {
    node().positions[selected] = {
      room: id,
      u: p ? Math.max(0.08, Math.min(0.92, (p.x - r.x) / r.w)) : 0.5,
      v: p ? Math.max(0.08, Math.min(0.92, (p.z - r.z) / r.d)) : 0.5,
    };
    selected = null;
    showPeople = true;
    persist();
    render();
    return;
  }
  stop();
  floor = r.floor;
  focus = id;
  view = "3d";
  render();
}
function setFloor(f) {
  stop();
  floor = f;
  focus = null;
  selected = null;
  render();
}
function render() {
  const known = visibleRooms(record.chapter);
  if (focus && byId(focus).chapter > record.chapter) focus = null;
  if (floor !== "all" && !known.some((r) => r.floor === floor)) floor = "all";
  $("#chapter").value = record.chapter;
  $("#floors").innerHTML = [...new Set(known.map((r) => r.floor))]
    .map(
      (f) =>
        `<button class="floor ${floor === f ? "active" : ""}" data-floor="${f}">${floorNames[f]}</button>`,
    )
    .join("");
  document
    .querySelector('[data-floor="all"]')
    .classList.toggle("active", floor === "all");
  document
    .querySelectorAll("[data-floor]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          setFloor(
            b.dataset.floor === "all" ? "all" : Number(b.dataset.floor),
          )),
    );
  $("#room-list").innerHTML =
    floor === "all"
      ? ""
      : known
          .filter((r) => r.floor === floor)
          .map(
            (r) =>
              `<button data-room="${r.id}" class="${focus === r.id ? "active" : ""}">${r.name} ↗</button>`,
          )
          .join("");
  document
    .querySelectorAll("[data-room]")
    .forEach((b) => (b.onclick = () => pickRoom(b.dataset.room)));
  $("#breadcrumb").innerHTML =
    `<button id="back-all">建筑</button>${floor !== "all" ? `<span>/</span><button id="back-floor">${floorNames[floor]}</button>` : ""}${focus ? `<span>/ ${byId(focus).name}</span>` : ""}`;
  $("#back-all").onclick = () => setFloor("all");
  if ($("#back-floor")) $("#back-floor").onclick = () => setFloor(floor);
  $("#drawing-label").textContent = focus
    ? byId(focus).name
    : floor === "all"
      ? "建筑分层 · 关系示意"
      : floorNames[floor];
  $("#isometric").classList.toggle("active", view === "3d");
  $("#plan").classList.toggle("active", view === "2d");
  $("#scene").hidden = view !== "3d";
  $("#flat").toggleAttribute("hidden", view !== "2d");
  $("#placement").hidden = selected === null;
  $("#placement-text").textContent =
    selected === null ? "" : `放置 ${personNames[selected]} · 点击房间`;
  $("#toggle-people").textContent = showPeople
    ? "隐藏我的人物"
    : "显示我的人物";
  $("#hint").textContent =
    view === "2d"
      ? "点击平面图中的房间 → 查看固定视角立体场景"
      : "固定视角 · 滚轮缩放 · 点击楼层或房间查看";
  $("#description").innerHTML = focus
    ? `<b>${byId(focus).name} / 第${byId(focus).chapter}章</b><p>${byId(focus).evidence}</p><p>推定：${byId(focus).inference}</p>`
    : `<b>${floor === "all" ? "先理解上下层，再进入具体空间。" : "点击一个房间，打开它的立体图。"}</b><p>${floor === "all" ? "分层间距仅用于排版；此图不证明层高、距离或行走耗时。" : "仅显示已读范围的空间。人物与位置记录由你添加。"}</p>`;
  $("#evidence-list").innerHTML = known
    .map(
      (r) =>
        `<article><b>${r.name}</b><p>${r.evidence}</p><p>推定：${r.inference}</p></article>`,
    )
    .join("");
  $("#later-spaces").hidden = record.chapter < 12;
  if (scene) {
    scene.setState({
      floor,
      focus,
      chapter: record.chapter,
      showPeople,
      positions: node().positions,
    });
    if (view === "3d") scene.resize();
  }
  if (view === "2d") renderFlat();
  renderTool();
}
function renderFlat() {
  const list = visibleRooms(record.chapter).filter(
    (r) => floor === "all" || r.floor === floor,
  );
  const blocks =
    floor === "all" ? [...new Set(list.map((r) => r.floor))] : [floor];
  let svg =
    '<defs><pattern id="paper-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#c3cec0" stroke-width=".5"/></pattern></defs><rect width="1000" height="650" fill="url(#paper-grid)"/>';
  for (let k = 0; k < blocks.length; k++) {
    const f = blocks[k],
      scale = blocks.length === 1 ? 49 : blocks.length === 2 ? 30 : 24,
      ox = blocks.length === 1 ? 260 : k === 0 ? 135 : 620,
      oy = blocks.length === 3 && k === 2 ? 385 : 100;
    const fx = blocks.length === 3 && k === 2 ? 370 : ox;
    svg += `<text x="${fx - 85}" y="${oy - 25}" fill="#597b75" font-size="14">${floorNames[f]}</text>`;
    for (const r of list.filter((r) => r.floor === f)) {
      const x = fx + r.x * scale,
        y = oy + r.z * scale;
      svg += `<g data-flat-room="${r.id}" role="button" tabindex="0" aria-label="查看${r.name}立体图"><rect x="${x}" y="${y}" width="${r.w * scale}" height="${r.d * scale}" fill="${focus === r.id ? "#cadbcd" : r.type === "unknown" ? "#e6e9df" : "#e4dfce"}" stroke="#728e87" stroke-width="2" ${r.type === "unknown" ? 'stroke-dasharray="5 4"' : ""}/><text x="${x + 8}" y="${y + 22}" fill="#355961" font-size="${blocks.length === 1 ? 13 : 11}">${r.name}</text>${r.type === "unknown" ? "" : `<path d="M${x + r.w * scale} ${y + r.d * 0.6 * scale}h-16v-22" fill="none" stroke="#9cae9d"/>`}</g>`;
      if (showPeople)
        for (const [id, p] of Object.entries(node().positions).filter(
          ([id, p]) => p.room === r.id,
        ))
          svg += `<g pointer-events="none" transform="translate(${x + p.u * r.w * scale} ${y + p.v * r.d * scale})">${characterIcon(roles[id], colors[id])}<text y="-25" text-anchor="middle" font-size="10" fill="#355961">${personNames[id]}</text></g>`;
    }
  }
  $("#flat").innerHTML = svg;
  $("#flat")
    .querySelectorAll("[data-flat-room]")
    .forEach((g) => {
      g.onclick = (e) => {
        if (selected !== null) {
          const r = byId(g.dataset.flatRoom),
            rect = g.querySelector("rect").getBoundingClientRect(),
            u = (e.clientX - rect.left) / rect.width,
            v = (e.clientY - rect.top) / rect.height;
          pickRoom(r.id, { x: r.x + r.w * u, z: r.z + r.d * v });
        } else pickRoom(g.dataset.flatRoom);
      };
      g.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pickRoom(g.dataset.flatRoom);
        }
      };
    });
}
function renderTool() {
  const panel = $("#tool-panel");
  panel.hidden = !tool;
  document
    .querySelectorAll("[data-tool]")
    .forEach((b) => b.classList.toggle("active", b.dataset.tool === tool));
  if (!tool) return;
  $("#tool-title").textContent = {
    people: "我的人物位置",
    notes: "随手记",
    timeline: "我的位置记录",
  }[tool];
  const host = $("#tool-content");
  if (tool === "people") {
    host.innerHTML = `<div class="people-grid">${personNames.map((name, id) => `<button data-person="${id}" class="${selected === id ? "active" : ""}" aria-label="放置${name}"><svg viewBox="-16 -25 32 40" aria-hidden="true">${characterIcon(roles[id], colors[id])}</svg>${name}</button>`).join("")}</div><p class="tool-help">选择人物后，点击场景地面或平面房间放置一次。服饰为身份造型推定；位置属于你的记录。</p>${Object.entries(
      node().positions,
    )
      .map(
        ([id, p]) =>
          `<button data-remove="${id}">${personNames[id]} · ${byId(p.room).name} ×</button>`,
      )
      .join(" ")}`;
    host.querySelectorAll("[data-person]").forEach(
      (b) =>
        (b.onclick = () => {
          selected = Number(b.dataset.person);
          showPeople = true;
          render();
        }),
    );
    host.querySelectorAll("[data-remove]").forEach(
      (b) =>
        (b.onclick = () => {
          delete node().positions[b.dataset.remove];
          persist();
          render();
        }),
    );
  }
  if (tool === "notes") {
    host.innerHTML =
      '<label class="field">随记 · 不必先指定人物或准确时间<textarea id="note" placeholder="边读边记：这扇门通向哪里？这条证词还需核对什么？"></textarea></label>';
    $("#note").value = record.note;
    $("#note").oninput = (e) => {
      record.note = e.target.value;
      persist();
    };
  }
  if (tool === "timeline") {
    host.innerHTML = `<div class="timeline-row">${record.nodes.map((n, i) => `<button data-node="${i}" class="record ${record.active === i ? "active" : ""}">${esc(n.label)}<small>${esc(n.time || "未指定时间")}</small></button>`).join("")}<button id="new-record">＋ 新增</button><button id="play-records">${playing ? "暂停" : "▶ 依次查看"}</button>${record.nodes.length > 1 ? '<button id="remove-record">移除当前记录</button>' : ""}</div><p class="tool-help">按你的记录顺序切换位置；这不是原作时间表，也不是连续行动或真实耗时验证。平面图会跟随同一人物切换楼层。</p>`;
    host.querySelectorAll("[data-node]").forEach(
      (b) =>
        (b.onclick = () => {
          stop();
          record.active = Number(b.dataset.node);
          followMap();
          persist();
          render();
        }),
    );
    const remove = $("#remove-record");
    if (remove) remove.onclick = () => {
      stop();
      record.nodes.splice(record.active,1);
      record.active = Math.min(record.active,record.nodes.length-1);
      persist();
      followMap();
      render();
    };
    $("#new-record").onclick = () => {
      stop();
      $("#node-time").value = "";
      $("#node-label").value = "";
      $("#node-dialog").showModal();
    };
    $("#play-records").onclick = () => {
      if (playing) {
        stop();
        renderTool();
        return;
      }
      if (record.active === record.nodes.length - 1) record.active = 0;
      showPeople = true;
      followMap();
      render();
      playing = setInterval(() => {
        if (record.active >= record.nodes.length - 1) {
          stop();
          renderTool();
          return;
        }
        record.active++;
        followMap();
        persist();
        render();
      }, 1800);
      renderTool();
    };
  }
}
function followMap() {
  if (view !== "2d") return;
  const ids = Object.keys(node().positions);
  if (!ids.length) return;
  if (!ids.includes(String(followed))) followed = Number(ids[0]);
  const r = byId(node().positions[followed].room);
  if (r.chapter <= record.chapter) {
    floor = r.floor;
    focus = null;
    showPeople = true;
  }
}
$("#chapter").innerHTML = Array.from(
  { length: 17 },
  (_, i) => `<option value="${i + 2}">第 ${i + 2} 章</option>`,
).join("");
$("#chapter").onchange = (e) => {
  stop();
  record.chapter = Number(e.target.value);
  persist();
  render();
};
$("#isometric").onclick = () => {
  view = "3d";
  selected = null;
  render();
};
$("#plan").onclick = () => {
  view = "2d";
  selected = null;
  render();
};
$("#cancel").onclick = () => {
  selected = null;
  render();
};
$("#toggle-people").onclick = () => {
  showPeople = !showPeople;
  selected = null;
  render();
};
$("#zoom-in").onclick = () => scene?.zoom(1.2);
$("#zoom-out").onclick = () => scene?.zoom(1 / 1.2);
$("#reset").onclick = () => scene?.fit();
document.querySelectorAll("[data-tool]").forEach(
  (b) =>
    (b.onclick = () => {
      stop();
      selected = null;
      tool = tool === b.dataset.tool ? null : b.dataset.tool;
      render();
    }),
);
$("#close-tool").onclick = () => {
  stop();
  tool = null;
  selected = null;
  render();
};
$("#add-node").onclick = () => {
  record.nodes.push({
    id: crypto.randomUUID(),
    time: $("#node-time").value,
    label: $("#node-label").value.trim() || `记录 ${record.nodes.length + 1}`,
    positions: structuredClone(node().positions),
  });
  record.active = record.nodes.length - 1;
  persist();
  $("#node-dialog").close();
  render();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    selected = null;
    stop();
    render();
  }
});
try {
  scene = new ReadingScene($("#scene"), pickRoom, () => {
    view = "2d";
    scene = null;
    render();
  });
} catch {
  view = "2d";
  $("#save-status").textContent = "3D 暂不可用，仍可使用平面图记录。";
}
render();
