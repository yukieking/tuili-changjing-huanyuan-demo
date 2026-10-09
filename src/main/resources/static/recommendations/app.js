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
let catalog = null,
  onlySaved = false,
  saved = new Set();
try {
  const stored = JSON.parse(
    localStorage.getItem("mijing-reading-list") || "[]",
  );
  if (Array.isArray(stored))
    saved = new Set(stored.filter((x) => typeof x === "string"));
} catch {}
function render() {
  if (!catalog) return;
  const search = $("#search").value.trim().toLocaleLowerCase(),
    genre = $("#genre").value,
    level = $("#level").value,
    space = $("#space").value;
  const books = catalog.books.filter(
    (b) =>
      (!onlySaved || saved.has(b.id)) &&
      (!genre || b.genre === genre) &&
      (!level || b.level === level) &&
      (!space || b.space === space) &&
      (!search ||
        `${b.title} ${b.author} ${b.genre}`
          .toLocaleLowerCase()
          .includes(search)),
  );
  $("#result-count").textContent =
    `${onlySaved ? "我的想读" : "精选推荐"} · ${books.length} 部`;
  $("#saved-count").textContent = catalog.books.filter((b) =>
    saved.has(b.id),
  ).length;
  $("#all").classList.toggle("active", !onlySaved);
  $("#saved").classList.toggle("active", onlySaved);
  $("#books").innerHTML = books.length
    ? books
        .map(
          (b) =>
            `<article class="r-card"><div class="r-card-head"><div class="r-cover" style="--book-color:${b.color}" aria-hidden="true"><b>${esc(b.mark)}</b><span>${esc(b.title)}</span></div><div><h3>${esc(b.title)}</h3><p class="r-author">${esc(b.author)}</p><div class="r-tags"><span>${esc(b.genre)}</span><span>${esc(b.level)}</span></div></div></div><p class="r-reason">${esc(b.reason)}</p><p class="r-study"><b>${b.space === "高" ? "◇ 优先适合空间推演" : b.space === "中" ? "◈ 可作为推演补充" : "○ 以阅读与线索研究为主"}</b></p><button data-save="${b.id}" aria-pressed="${saved.has(b.id)}" aria-label="${saved.has(b.id) ? "移除想读" : "加入想读"}：${esc(b.title)}">${saved.has(b.id) ? "✓ 已加入想读" : "＋ 加入想读"}</button></article>`,
        )
        .join("")
    : '<div class="r-empty">' +
      (onlySaved
        ? "还没有符合条件的想读作品。去全部推荐挑一本吧。"
        : "没有找到符合条件的作品，试试重置筛选。") +
      "</div>";
  document.querySelectorAll("[data-save]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.save;
        saved.has(id) ? saved.delete(id) : saved.add(id);
        try {
          localStorage.setItem(
            "mijing-reading-list",
            JSON.stringify([...saved]),
          );
          $("#message").textContent = "想读书单已保存在当前浏览器。";
        } catch {
          $("#message").textContent =
            "当前浏览器无法保存，想读列表仅在本次页面中保留。";
        }
        render();
      }),
  );
}
$("#search").oninput = render;
for (const id of ["genre", "level", "space"]) $("#" + id).onchange = render;
$("#all").onclick = () => {
  onlySaved = false;
  render();
};
$("#saved").onclick = () => {
  onlySaved = true;
  render();
};
function reset() {
  for (const id of ["genre", "level", "space", "search"])
    $("#" + id).value = "";
  render();
}
$("#reset").onclick = reset;
document.querySelectorAll("[data-preset]").forEach(
  (b) =>
    (b.onclick = () => {
      onlySaved = false;
      reset();
      $("#" + (b.dataset.preset === "space" ? "space" : "level")).value =
        b.dataset.preset === "space" ? "高" : "入门";
      render();
    }),
);
async function load() {
  for (const url of ["/api/recommendations", "recommendations/catalog.json"]) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw Error();
      const c = await r.json();
      if (c.version !== 1 || !Array.isArray(c.books) || !c.books.length)
        throw Error();
      catalog = c;
      break;
    } catch {}
  }
  if (!catalog) {
    $("#result-count").textContent = "书架暂时无法加载";
    $("#message").textContent = "请刷新页面，或确认项目服务正在运行。";
    return;
  }
  $("#genre").innerHTML =
    '<option value="">全部类型</option>' +
    [...new Set(catalog.books.map((b) => b.genre))]
      .map((x) => `<option>${esc(x)}</option>`)
      .join("");
  render();
}
load();
