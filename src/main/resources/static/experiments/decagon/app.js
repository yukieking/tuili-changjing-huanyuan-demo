import { ReadingScene } from "./scene.js";
import {
  rooms,
  constrain,
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
const KEY = "mijing-decagon-atlas-v1";
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
    $("#save-status").textContent = "已保存到当前浏览器 · 与其他作品记录独立";
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
    p = constrain(r, p?.x ?? r.center[0], p?.z ?? r.center[1]);
    node().positions[selected] = {
      room: id,
      u: (p.x - r.x) / r.w,
      v: (p.z - r.z) / r.d,
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
      ? "十角馆 · 完整剖面"
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
      : "固定视角 · 滚轮缩放 · 点击区域或房间查看";
  $("#description").innerHTML = focus
    ? `<b>${byId(focus).name} / 第${byId(focus).chapter}章</b><p>${byId(focus).evidence}</p><p>推定：${byId(focus).inference}</p>`
    : `<b>${floor === "all" ? "中央大厅连接外围十间房间。" : "点击一个房间，打开它的立体图。"}</b><p>${floor === "all" ? "房间排列依据原书图一；半径、墙高与家具坐标为示意。" : "仅显示已读范围的空间。人物与位置记录由你添加。"}</p>`;
  $("#evidence-list").innerHTML = known
    .map(
      (r) =>
        `<article><b>${r.name}</b><p>${r.evidence}</p><p>推定：${r.inference}</p></article>`,
    )
    .join("");
  $("#later-spaces").hidden = true;
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
  const map = floor === "all" ? 0 : floor;
  const list = visibleRooms(record.chapter).filter((r) => r.floor === map);
  const scale = map === 0 ? 31 : 23,
    ox = 500,
    oy = 325;
  const points = (p) =>
    p.map(([x, z]) => `${ox + x * scale},${oy + z * scale}`).join(" ");
  let svg =
    '<defs><pattern id="paper-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#c3cec0" stroke-width=".5"/></pattern></defs><rect width="1000" height="650" fill="url(#paper-grid)"/>';
  if (map === 1)
    svg += `<path d="M300 105 Q450 140 540 75 Q735 35 775 160 L720 415 Q690 525 610 580 L525 510 Q420 495 325 500 L290 430 L355 350 L305 230 Z" fill="#e8e4d3" stroke="#788e88" stroke-width="2"/><path d="M400 490 Q390 360 530 420 Q580 310 490 220" fill="none" stroke="#a3ad95" stroke-dasharray="6 6"/><text x="770" y="560" fill="#5c7d84">海岸线 / 路径为示意</text>`;
  for (const r of list) {
    const [cx, cz] = r.center;
    svg += `<g data-flat-room="${r.id}" role="button" tabindex="0" aria-label="查看${r.name}立体图"><polygon points="${points(r.polygon)}" fill="${r.type === "hall" ? "#c8d9dd" : r.type === "wash" ? "#d5dfd5" : "#e6ddc8"}" stroke="#537680" stroke-width="2"/><text x="${ox + cx * scale}" y="${oy + cz * scale + 4}" text-anchor="middle" fill="#355961" font-size="${r.type === "wash" ? 10 : 13}">${r.type === "wash" ? "盥洗区" : r.name}</text></g>`;
    if (map === 0 && r.sector !== undefined) {
      const a = r.polygon[0],
        b = r.polygon[3],
        mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const edge = (a, b, t) => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
      ];
      const line = (a, b, c, w) =>
        `<path d="M${ox + a[0] * scale} ${oy + a[1] * scale}L${ox + b[0] * scale} ${oy + b[1] * scale}" fill="none" stroke="${c}" stroke-width="${w}" pointer-events="none"/>`;
      svg += line(edge(a, b, 0.34), edge(a, b, 0.66), "#f4f2e8", 5);
      svg += line(
        edge(a, b, 0.34),
        [mid[0] * 0.85, mid[1] * 0.85],
        "#78949b",
        1,
      );
      const c = r.polygon[1],
        d = r.polygon[2];
      svg += line(
        edge(c, d, 0.34),
        edge(c, d, 0.66),
        r.type === "entry" ? "#739bad" : "#bad2d8",
        5,
      );
      if (r.type === "wash") {
        const a = ((-90 + r.sector * 36) * Math.PI) / 180,
          n = [Math.cos(a), Math.sin(a)],
          t = [-n[1], n[0]];
        const p = (u, v) => [
          n[0] * (5.9 + v) + t[0] * u,
          n[1] * (5.9 + v) + t[1] * u,
        ];
        svg +=
          line(p(-1.7, 0.25), p(1.7, 0.25), "#78949b", 1.5) +
          line(p(0, 0.25), p(0, 1.6), "#78949b", 1.5);
        for (const [u, text] of [
          [-0.8, "浴室"],
          [0.8, "卫生间"],
        ]) {
          const q = p(u, 1);
          svg += `<text x="${ox + q[0] * scale}" y="${oy + q[1] * scale}" text-anchor="middle" font-size="10" fill="#547880" pointer-events="none">${text}</text>`;
        }
      }
    }
    if (showPeople)
      for (const [id, p] of Object.entries(node().positions).filter(
        ([id, p]) => p.room === r.id,
      ))
        svg += `<g pointer-events="none" transform="translate(${ox + (r.x + p.u * r.w) * scale} ${oy + (r.z + p.v * r.d) * scale})">${characterIcon(roles[id], colors[id])}<text y="-25" text-anchor="middle" font-size="11">${esc(personNames[id])}</text></g>`;
  }
  if (map === 0)
    svg +=
      '<text x="500" y="610" text-anchor="middle" fill="#6b878a" font-size="12">原图房间排列 · 内外半径比例为示意 · 家具第3章后显示</text>';
  $("#flat").innerHTML = svg;
  $("#flat")
    .querySelectorAll("[data-flat-room]")
    .forEach((g) => {
      g.onclick = (e) => {
        const r = byId(g.dataset.flatRoom);
        const rect = $("#flat").getBoundingClientRect(),
          k = Math.min(rect.width / 1000, rect.height / 650);
        const x = (e.clientX - rect.left - (rect.width - 1000 * k) / 2) / k;
        const y = (e.clientY - rect.top - (rect.height - 650 * k) / 2) / k;
        pickRoom(
          r.id,
          selected === null
            ? null
            : { x: (x - ox) / scale, z: (y - oy) / scale },
        );
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
    host.innerHTML = `<div class="people-grid">${personNames.map((name, id) => `<button data-person="${id}" class="${selected === id ? "active" : ""}" aria-label="放置${name}"><svg viewBox="-16 -25 32 40" aria-hidden="true">${characterIcon(roles[id], colors[id])}</svg>${name}</button>`).join("")}</div><p class="tool-help">选择人物后，点击场景地面或平面房间放置一次。配色参考早期服装描写，Q版造型为示意；位置属于你的记录。</p>${Object.entries(
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
    host.innerHTML = `<div class="timeline-row">${record.nodes.map((n, i) => `<button data-node="${i}" class="record ${record.active === i ? "active" : ""}">${esc(n.label)}<small>${esc(n.time || "未指定时间")}</small></button>`).join("")}<button id="new-record">＋ 新增</button><button id="play-records">${playing ? "暂停" : "▶ 依次查看"}</button>${record.nodes.length > 1 ? '<button id="remove-record">移除当前记录</button>' : ""}</div><p class="tool-help">按你的记录顺序切换位置；这不是原作时间表，也不是连续行动或真实耗时验证。平面图会跟随同一人物切换馆内与岛上地图。</p>`;
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
    if (remove)
      remove.onclick = () => {
        stop();
        record.nodes.splice(record.active, 1);
        record.active = Math.min(record.active, record.nodes.length - 1);
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
  { length: 12 },
  (_, i) => `<option value="${i + 1}">第 ${i + 1} 章</option>`,
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
