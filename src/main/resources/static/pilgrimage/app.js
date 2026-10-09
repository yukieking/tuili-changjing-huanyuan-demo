import { places } from "./places.js";
const $ = (s) => document.querySelector(s);
let filter = "全部",
  savedOnly = false,
  selected = "kamedake",
  geometry = null;
let saved = [];
try {
  saved = JSON.parse(localStorage.getItem("mijing-pilgrimage-v1") || "[]");
  if (!Array.isArray(saved)) saved = [];
} catch {}
const project = (lon, lat) => [(lon - 128) * 34 + 110, (46 - lat) * 39 + 12];
const visible = () =>
  places.filter(
    (p) =>
      (filter === "全部" || p.type === filter) &&
      (!savedOnly || saved.includes(p.id)),
  );
function draw() {
  let svg =
    '<defs><pattern id="atlas-grid" width="34" height="39" patternUnits="userSpaceOnUse"><path d="M34 0H0V39" fill="none" stroke="#bac7bc" stroke-width=".5"/></pattern></defs><rect width="800" height="590" fill="url(#atlas-grid)"/><g fill="#ccd5bf" stroke="#708b85" stroke-width="1">';
  if (geometry)
    for (const polygon of geometry.coordinates) {
      svg += `<path d="${polygon
        .map(
          (ring) =>
            ring
              .map(([lon, lat], i) => {
                const [x, y] = project(lon, lat);
                return `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
              })
              .join(" ") + "Z",
        )
        .join(" ")}" fill-rule="evenodd"/>`;
    }
  svg +=
    '</g><text x="120" y="235" fill="#92a39b" font-size="18" letter-spacing="6">日本海</text><text x="585" y="405" fill="#92a39b" font-size="18" letter-spacing="6">太平洋</text><path d="M730 110V60M723 71L730 60L737 71" fill="none" stroke="#49676c"/><text x="725" y="50" fill="#49676c" font-size="12">N</text>';
  for (const p of visible()) {
    const [x, y] = project(p.lon, p.lat),
      [dx, dy] = p.offset;
    svg += `<g class="map-pin ${selected === p.id ? "active" : ""}" data-place="${p.id}" tabindex="0" role="button" aria-label="${p.name}"><circle cx="${x}" cy="${y}" r="18" fill="transparent" stroke="none"/><path d="M${x} ${y}L${x + dx} ${y + dy}" stroke="#789086" fill="none"/><circle cx="${x}" cy="${y}" r="${selected === p.id ? 8 : 5}" fill="${selected === p.id ? "#b97451" : "#49676c"}" stroke="#eee9db" stroke-width="2"/><text x="${x + dx}" y="${y + dy - 7}" text-anchor="middle">${p.city.split(" · ")[1]}</text><text x="${x + dx}" y="${y + dy + 9}" text-anchor="middle" style="font-size:10px">${p.author}</text></g>`;
  }
  $("#atlas").innerHTML = svg;
  $("#atlas")
    .querySelectorAll("[data-place]")
    .forEach((el) => {
      el.onclick = () => select(el.dataset.place);
      el.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(el.dataset.place);
        }
      };
    });
}
function select(id) {
  selected = id;
  render();
}
function render() {
  const list = visible();
  if (!list.some((p) => p.id === selected)) selected = list[0]?.id;
  draw();
  $("#count").textContent = `${list.length} 个地点`;
  $("#place-list").innerHTML = list.length
    ? list
        .map(
          (p) =>
            `<button data-list="${p.id}" class="${selected === p.id ? "active" : ""}" aria-pressed="${selected === p.id}"><small>${p.city} ${saved.includes(p.id) ? "♥" : ""}</small><span class="list-name">${p.name}</span><small>${p.type} / ${p.author}</small></button>`,
        )
        .join("")
    : '<p class="p-empty">还没有想去的地点。切回「全部」，挑选一站收藏。</p>';
  document
    .querySelectorAll("[data-list]")
    .forEach((el) => (el.onclick = () => select(el.dataset.list)));
  const p = list.find((p) => p.id === selected);
  const panel = $("#place-detail");
  panel.className = p ? "" : "p-blank";
  if (!p) {
    panel.innerHTML =
      "<h2>给下一次出行，留一个起点。</h2><p>从地图或地点列表收藏你想去的地方。</p>";
    return;
  }
  panel.innerHTML = `<div class="p-number">STOP ${String(places.indexOf(p) + 1).padStart(2, "0")} / JAPAN</div><h2>${p.name}</h2><div class="p-city">${p.city} · ${p.author}</div><span class="p-tag">${p.type}</span><p class="p-book">${p.books}</p><p class="p-description">${p.description}</p><p class="p-detail">${p.detail}</p><button class="p-save" id="save-place" aria-pressed="${saved.includes(p.id)}">${saved.includes(p.id) ? "♥ 已加入想去" : "♡ 加入想去"}</button><div class="p-links"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}" target="_blank" rel="noopener noreferrer">打开地点地图 ↗</a><a href="${p.official}" target="_blank" rel="noopener noreferrer">官方信息 ↗</a></div>`;
  $("#save-place").onclick = () => {
    saved = saved.includes(p.id)
      ? saved.filter((id) => id !== p.id)
      : [...saved, p.id];
    try {
      localStorage.setItem("mijing-pilgrimage-v1", JSON.stringify(saved));
    } catch {
      $("#map-status").textContent = "浏览器无法保存收藏，本次浏览仍可使用。";
    }
    render();
  };
}
document.querySelectorAll("[data-filter]").forEach(
  (el) =>
    (el.onclick = () => {
      filter = el.dataset.filter;
      document
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.classList.toggle("active", b === el));
      render();
    }),
);
$("#saved-filter").onclick = () => {
  savedOnly = !savedOnly;
  $("#saved-filter").setAttribute("aria-pressed", String(savedOnly));
  render();
};
render();
try {
  const r = await fetch("pilgrimage/japan.json");
  if (!r.ok) throw Error();
  geometry = await r.json();
  draw();
} catch {
  $("#map-status").textContent = "地图轮廓暂不可用，地点列表仍可浏览。";
}
