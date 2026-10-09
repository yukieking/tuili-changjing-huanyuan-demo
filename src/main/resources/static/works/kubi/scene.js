import { createCharacter } from "../../character-model.js";
import * as T from "three";
import { OrbitControls } from "../../vendor/OrbitControls.js";
import {
  places,
  byId,
  people,
  edges,
  segment,
  helix,
  positionAt,
  routePoints,
} from "./data.js";
export class MountainScene {
  constructor(host, onPick, onError) {
    this.host = host;
    this.onPick = onPick;
    this.roofs = [];
    this.shells = [];
    this.targets = [];
    this.labels = [];
    this.scene = new T.Scene();
    this.scene.background = new T.Color("#122729");
    this.scene.fog = new T.Fog("#122729", 105, 200);
    this.renderer = new T.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor("#122729");
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.camera = new T.PerspectiveCamera(40, 1, 0.1, 350);
    this.camera.position.set(57, 66, 76);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(2, 0, 0);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2.04;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 145;
    this.scene.add(new T.HemisphereLight("#edeee1", "#345548", 2.1));
    const sun = new T.DirectionalLight("#ffe2b8", 3);
    sun.position.set(-30, 70, 35);
    this.scene.add(sun);
    this.base = new T.Group();
    this.scene.add(this.base);
    this.pawnModels = new Map();
    this.pawns = new T.Group();
    this.scene.add(this.pawns);
    this.routeGroup = new T.Group();
    this.scene.add(this.routeGroup);
    this.build();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    let down = null;
    host.addEventListener(
      "pointerdown",
      (e) => (down = { x: e.clientX, y: e.clientY }),
    );
    host.addEventListener("pointerup", (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5)
        return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      const ray = new T.Raycaster();
      ray.setFromCamera(
        new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        this.camera,
      );
      const hit = ray
        .intersectObjects(this.targets, true)
        .find((h) => h.object.visible);
      if (hit) {
        let obj = hit.object;
        while (obj && !obj.userData.place) obj = obj.parent;
        if (obj?.userData.place) this.onPick(obj.userData.place);
      }
    });
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      onError();
    });
    this.animate = () => {
      this.frame = requestAnimationFrame(this.animate);
      if (!host.clientHeight || document.hidden) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    this.animate();
  }
  mat(c, extra = {}) {
    return new T.MeshStandardMaterial({ color: c, roughness: 0.85, ...extra });
  }
  mesh(g, c, x, y, z, parent = this.base, extra = {}) {
    const m = new T.Mesh(g, this.mat(c, extra));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  box(w, h, d, c, x, y, z, parent = this.base) {
    return this.mesh(new T.BoxGeometry(w, h, d), c, x, y, z, parent);
  }
  line(points, c, width = 0.09, parent = this.base) {
    if (points.length < 2) return;
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(p.x, p.y, p.z)),
      false,
      "centripetal",
    );
    return this.mesh(
      new T.TubeGeometry(
        curve,
        Math.max(20, points.length * 2),
        width,
        6,
        false,
      ),
      c,
      0,
      0,
      0,
      parent,
    );
  }
  label(text, x, y, z, parent = this.base) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(13,29,30,.87)";
    ctx.beginPath();
    ctx.roundRect(4, 5, 504, 85, 18);
    ctx.fill();
    ctx.fillStyle = "#f1ede1";
    ctx.font = "500 30px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 48);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    const s = new T.Sprite(
      new T.SpriteMaterial({ map: tex, depthTest: false }),
    );
    s.position.set(x, y, z);
    s.scale.set(7.4, 1.39, 1);
    s.renderOrder = 10;
    parent.add(s);
    s.userData.text = text;
    if (parent.parent !== this.pawns) this.labels.push(s);
    return s;
  }
  roof(w, d, x, z, parent = this.base) {
    const m = this.mesh(
      new T.ConeGeometry(Math.max(w, d) * 0.76, 2.7, 4),
      "#334447",
      x,
      5.1,
      z,
      parent,
    );
    m.rotation.y = Math.PI / 4;
    m.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    this.roofs.push(m);
    return m;
  }
  house(p, w = 7, d = 5) {
    const group = new T.Group();
    group.userData.place = p.id;
    this.base.add(group);
    this.targets.push(group);
    this.box(w, 0.35, d, "#aa9572", p.x, 0.25, p.z, group);
    const body = this.box(w, 3.4, d, "#c1af8d", p.x, 2, p.z, group);
    this.shells.push(body);
    this.roof(w, d, p.x, p.z, group);
    this.label(p.name, p.x, 6.8, p.z, group);
    return group;
  }
  gate(p) {
    const g = new T.Group();
    g.userData.place = p.id;
    this.base.add(g);
    this.targets.push(g);
    for (const x of [-1.7, 1.7])
      this.box(0.38, 3.3, 0.38, "#aa5140", p.x + x, 1.8, p.z, g);
    this.box(4.9, 0.38, 0.5, "#bc6150", p.x, 3.55, p.z, g);
    this.box(4.2, 0.25, 0.35, "#823f36", p.x, 2.8, p.z, g);
    this.label(p.name, p.x, 4.8, p.z, g);
  }
  build() {
    this.mesh(new T.CylinderGeometry(59, 61, 1, 100), "#344d40", 0, -1.25, 0);
    this.mesh(
      new T.CylinderGeometry(32, 35, 2, 100),
      "#52624b",
      0,
      -0.7,
      0,
    ).scale.set(1.3, 1, 0.86);
    this.mesh(
      new T.CylinderGeometry(24, 24, 0.15, 80),
      "#bbb39b",
      -3,
      0.08,
      0,
    ).scale.set(1.3, 1, 0.64);
    const forest = new T.Group();
    this.base.add(forest);
    let seed = 71;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 155; i++) {
      const x = (random() - 0.5) * 99,
        z = (random() - 0.5) * 78;
      if (
        (Math.abs(x) < 27 && Math.abs(z) < 16) ||
        Math.abs(x - 4) < 9 ||
        (x > 15 && Math.abs(z) < 11) ||
        Math.hypot(x - 29, z + 26) < 10
      )
        continue;
      const h = 3 + random() * 6;
      this.mesh(
        new T.ConeGeometry(1.4 + random(), h, 7),
        "#294d40",
        x,
        h / 2,
        z,
        forest,
      );
      this.box(0.25, h / 2, 0.25, "#665344", x, h / 4, z, forest);
    }
    // West ridge is a contextual landform, not an inferred fourth path.
    for (let i = 0; i < 5; i++)
      this.mesh(
        new T.ConeGeometry(8, 12 + (i % 2) * 4, 5),
        "#3b5045",
        -43 - i * 2,
        4,
        -24 + i * 13,
      );
    this.label("日阴岭 · 西侧山地", -47, 16, 3);
    this.label("北 N", 2, 0.7, -43);
    this.label("东 E", 49, 0.7, 8);
    this.label("南 S", 3, 0.7, 43);
    for (const [a, b] of edges) {
      if (
        [a, b].some(
          (id) => byId(id).kind === "tower" || byId(id).kind === "room",
        ) ||
        a === "shrine"
      )
        continue;
      const p = segment(a, b).map((v) => ({ ...v, y: 0.2 }));
      this.line(p, "#c6b994", 0.32);
    }
    for (const id of [
      "north",
      "northInner",
      "east",
      "eastInner",
      "south",
      "southInner",
    ])
      this.gate(byId(id));
    for (const id of [
      "ichimori",
      "nimori",
      "sanmori",
      "ritual",
      "jinja",
      "kannon",
    ])
      this.house(
        byId(id),
        id.endsWith("mori") ? 10 : 5,
        id.endsWith("mori") ? 6 : 4,
      );
    this.house(byId("toilet"), 2, 2);
    for (const id of ["eastWater", "southWater"]) {
      const p = byId(id),
        g = new T.Group();
      g.userData.place = id;
      this.base.add(g);
      this.targets.push(g);
      this.box(2.4, 0.7, 1.2, "#a4a697", p.x, 0.5, p.z, g);
      this.box(1.8, 0.12, 0.65, "#678d8b", p.x, 0.93, p.z, g);
      for (const s of [-1, 1])
        this.box(0.16, 2, 0.16, "#82725d", p.x + s, 1.5, p.z, g);
      this.roof(3, 2, p.x, p.z, g).position.y = 3;
      this.label(p.name, p.x, 4.2, p.z, g);
    }
    const well = byId("well"),
      wg = new T.Group();
    wg.userData.place = "well";
    this.base.add(wg);
    this.targets.push(wg);
    this.mesh(
      new T.CylinderGeometry(1.05, 1.05, 1, 24, 1, true),
      "#aaa99a",
      well.x,
      0.65,
      well.z,
      wg,
    );
    this.mesh(
      new T.CylinderGeometry(0.9, 0.9, 0.1, 24),
      "#1c3d42",
      well.x,
      0.22,
      well.z,
      wg,
    );
    for (const x of [-1.3, 1.3])
      this.box(0.16, 2.9, 0.16, "#9b7650", well.x + x, 1.6, well.z, wg);
    this.box(3, 0.15, 0.15, "#9b7650", well.x, 3, well.z, wg);
    this.label("北参道 · 水井", well.x, 4.2, well.z, wg);
    const sp = byId("stone");
    this.box(0.75, 1.6, 0.3, "#9caaa1", sp.x, 0.85, sp.z);
    this.mesh(new T.ConeGeometry(1.3, 9, 7), "#315944", sp.x - 1, 4.5, sp.z);
    this.label("藏身树 / 石碑", sp.x - 2, 10, sp.z);
    this.shrine();
    this.tower();
    for (const prefix of ["front", "middle", "rear"]) this.lodge(prefix);
  }
  shrine() {
    const g = new T.Group();
    g.userData.place = "shrine";
    this.base.add(g);
    this.targets.push(g);
    this.box(10, 0.4, 9, "#a68b66", 10, 0.3, 0, g);
    for (const [x, z, w, d] of [
      [5.1, 0, 0.2, 9],
      [14.9, 0, 0.2, 9],
      [10, 4.4, 10, 0.2],
      [7.5, -4.4, 5, 0.2],
      [13.5, -4.4, 3, 0.2],
    ]) {
      this.shells.push(this.box(w, 3.6, d, "#b7a788", x, 2.25, z, g));
    }
    for (const x of [5.2, 14.8])
      for (const z of [-4.3, 4.3])
        this.box(0.28, 4, 0.28, "#69573e", x, 2.4, z, g);
    const door = this.box(2, 0.08, 0.45, "#dbbb82", 10.4, 0.57, -4.5, g);
    door.userData.place = "shrine";
    this.box(1.7, 0.7, 4, "#8e513e", 6.2, 1, 0, g);
    this.mesh(
      new T.SphereGeometry(0.8, 12, 8),
      "#777b71",
      11,
      0.85,
      1,
      g,
    ).scale.set(1.5, 0.7, 1);
    this.box(0.5, 1.3, 0.5, "#8b9384", 11, 1, 2.5, g);
    this.label("媛神堂 · 北向格子门", 10, 7, 0, g);
    this.roof(10, 9, 10, 0, g);
    this.box(3, 0.15, 2, "#b99e75", 3.5, 0.35, 0);
    for (const z of [-1, 1])
      this.shells.push(this.box(3, 2.6, 0.1, "#ad9974", 3.5, 1.8, z));
  }
  tower() {
    const g = new T.Group();
    g.userData.place = "towerTop";
    this.base.add(g);
    this.targets.push(g);
    this.mesh(
      new T.CylinderGeometry(4.8, 4.8, 0.4, 6),
      "#b5a07f",
      -3,
      0.3,
      0,
      g,
    );
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      this.box(
        0.18,
        9.3,
        0.18,
        "#726148",
        -3 + 4.6 * Math.cos(angle),
        4.9,
        4.6 * Math.sin(angle),
        g,
      );
    }
    for (const [lane, color] of [
      ["A", "#dbac6e"],
      ["B", "#77c8bb"],
    ]) {
      const pts = Array.from({ length: 161 }, (_, i) => helix(lane, i / 160));
      const geometry = new T.BufferGeometry();
      const vertices = [],
        indices = [];
      pts.forEach((p, i) => {
        const dir = new T.Vector3(p.x + 3, 0, p.z).normalize();
        vertices.push(
          p.x - dir.x * 0.55,
          p.y,
          p.z - dir.z * 0.55,
          p.x + dir.x * 0.55,
          p.y,
          p.z + dir.z * 0.55,
        );
        if (i) {
          const a = (i - 1) * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      });
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(vertices, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      this.mesh(geometry, color, 0, 0, 0, g, { side: T.DoubleSide });
      for (const side of [-1, 1])
        this.line(
          pts.map((p) => {
            const v = new T.Vector3(p.x + 3, 0, p.z).normalize();
            return {
              x: p.x + v.x * side * 0.6,
              y: p.y + 0.5,
              z: p.z + v.z * side * 0.6,
            };
          }),
          color,
          0.045,
          g,
        );
      for (const t of [0.2, 0.5, 0.8]) {
        const p = helix(lane, t),
          q = helix(lane, t + 0.012),
          dir = new T.Vector3(q.x - p.x, q.y - p.y, q.z - p.z).normalize();
        g.add(
          new T.ArrowHelper(
            dir,
            new T.Vector3(p.x, p.y + 0.17, p.z),
            1.4,
            color,
            0.48,
            0.32,
          ),
        );
      }
    }
    this.line(
      Array.from({ length: 25 }, (_, i) => ({
        x: -3 + 4 * Math.cos((Math.PI * i) / 24),
        y: 8.35,
        z: 4 * Math.sin((Math.PI * i) / 24),
      })),
      "#c8b493",
      0.48,
      g,
    );
    const shell = this.mesh(
      new T.CylinderGeometry(4.65, 4.65, 8.4, 6, 1, true),
      "#a18e71",
      -3,
      4.7,
      0,
      g,
      {
        transparent: true,
        opacity: 0.2,
        side: T.DoubleSide,
        depthWrite: false,
      },
    );
    this.shells.push(shell);
    const roof = this.mesh(
      new T.ConeGeometry(5.3, 3, 6),
      "#31484a",
      -3,
      10.5,
      0,
      g,
    );
    this.roofs.push(roof);
    this.label("荣螺塔 · 双螺旋", -3, 13, 0, g);
  }
  lodge(prefix) {
    const p = byId(prefix + "Tea"),
      room = byId(prefix + "Room");
    const group = new T.Group();
    this.base.add(group);
    const tea = this.box(3.5, 0.32, 3.8, "#b4b58d", p.x, 0.38, p.z, group);
    tea.userData.place = p.id;
    const inner = this.box(
      4.4,
      0.32,
      3.8,
      "#c0c29b",
      room.x,
      0.38,
      room.z,
      group,
    );
    inner.userData.place = room.id;
    this.targets.push(tea, inner);
    const center = (p.x + room.x) / 2;
    for (const z of [-2, 2]) {
      this.shells.push(
        this.box(8, 2.7, 0.15, "#bcad8d", center, 1.8, p.z + z, group),
      );
      this.box(2, 0.12, 0.15, "#648c85", room.x, 2.1, p.z + z, group);
    }
    this.shells.push(
      this.box(0.15, 2.7, 4, "#bcad8d", room.x - 2.2, 1.8, p.z, group),
    );
    for (const z of [-1.2, 1.2])
      this.shells.push(
        this.box(0.15, 2.7, 1.4, "#bcad8d", p.x - 1.8, 1.8, p.z + z, group),
      );
    this.box(0.8, 0.6, 1.4, "#76614c", room.x - 1.6, 0.8, p.z - 0.8, group);
    this.box(0.8, 0.8, 1.4, "#a39a7f", room.x - 1.6, 0.9, p.z + 0.8, group);
    this.box(2, 0.8, 0.7, "#a99b7b", p.x, 0.95, p.z - 1.6, group);
    this.box(0.9, 0.36, 0.7, "#695743", p.x, 0.76, p.z, group);
    // Tatami seams and shoji frames are illustrative furnishings.
    for (let row = 0; row < 2; row++)
      for (let column = 0; column < 3; column++) {
        this.box(
          1.35,
          0.035,
          1.65,
          (row + column) % 2 ? "#b5bd91" : "#c6c8a2",
          room.x - 1.4 + column * 1.4,
          0.56,
          p.z - 0.85 + row * 1.7,
          group,
        );
        this.box(
          0.035,
          0.045,
          1.65,
          "#788365",
          room.x - 2.08 + column * 1.4,
          0.585,
          p.z - 0.85 + row * 1.7,
          group,
        );
      }
    for (const z of [-1.95, 1.95]) {
      const frame = new T.Group();
      group.add(frame);
      this.shells.push(frame);
      for (let column = 0; column < 5; column++)
        this.box(
          0.025,
          1.3,
          0.025,
          "#776d55",
          room.x - 0.9 + column * 0.45,
          1.8,
          p.z + z,
          frame,
        );
      for (let row = 0; row < 4; row++)
        this.box(
          1.8,
          0.025,
          0.025,
          "#776d55",
          room.x,
          1.15 + row * 0.43,
          p.z + z,
          frame,
        );
    }
    this.mesh(
      new T.CylinderGeometry(0.12, 0.15, 0.16, 16),
      "#d6ccb0",
      p.x,
      0.99,
      p.z,
      group,
    );
    this.box(0.7, 0.04, 0.55, "#a37e65", p.x, 0.57, p.z + 0.85, group);
    this.roof(8, 4, center, p.z, group);
    this.label(p.name.split(" · ")[0], center, 6, p.z, group);
    this.box(
      Math.abs(p.x + 7),
      0.16,
      1.5,
      "#b9a47f",
      (p.x - 7) / 2,
      0.3,
      p.z / 2,
      group,
    ).rotation.y = Math.atan2(-p.z, -7 - p.x);
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }
  view(mode, focus = null) {
    let target = [-2, 1, 0],
      pos = [47, 57, 64];
    if (mode === "village") {
      target = [2, 0, 0];
      pos = [64, 73, 89];
    }
    if (mode === "tower") {
      target = [-3, 4, 0];
      pos = [13, 17, 23];
    }
    if (mode === "room") {
      const p = byId(focus || "middleRoom");
      target = [p.x, 0, p.z];
      pos = [p.x + 8, 12, p.z + 11];
    }
    this.labels.forEach((s) => {
      s.visible =
        mode === "village" ||
        (mode === "tower" && s.userData.text.includes("荣螺塔")) ||
        (mode === "room" &&
          s.userData.text ===
            byId(focus || "middleRoom").name.split(" · ")[0]) ||
        (mode === "compound" &&
          Math.abs(s.position.x) < 32 &&
          Math.abs(s.position.z) < 20);
    });
    this.controls.target.set(...target);
    const fit = Math.max(
      1,
      1.2 / (this.host.clientWidth / this.host.clientHeight),
    );
    pos = pos.map((v, i) => target[i] + (v - target[i]) * fit);
    this.camera.position.set(...pos);
    this.camera.up.set(0, 1, 0);
    this.controls.update();
  }
  cut(value) {
    this.roofs.forEach((m) => (m.visible = !value));
    this.shells.forEach((m) => (m.visible = !value));
  }
  top(value) {
    if (value) {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 100, 0.05);
    } else this.view("compound");
    this.controls.update();
  }
  update(plan, t, selected) {
    people.forEach((p) => {
      const pos = positionAt(plan, p.id, t);
      let g = this.pawnModels.get(p.id);
      if (!g && pos) {
        g = createCharacter(p.role, p.color, true);
        g.scale.setScalar(1.7);
        this.pawns.add(g);
        this.pawnModels.set(p.id, g);
        const label = this.label(p.name, 0, 1.5, 0, g);
        label.scale.set(4.3, 0.81, 1);
        const ring = this.mesh(
          new T.TorusGeometry(0.4, 0.025, 8, 32),
          "#f3d08b",
          0,
          0.06,
          0,
          g,
        );
        ring.rotation.x = Math.PI / 2;
        g.userData.ring = ring;
      }
      if (!g) return;
      g.visible = !!pos;
      if (pos) g.position.set(pos.x, pos.y + 0.12, pos.z);
      g.userData.ring.visible = selected === p.id;
    });
    this.clear(this.routeGroup);
    for (const r of plan.routes)
      this.line(
        routePoints(r.path).map((p) => ({ ...p, y: p.y + 0.15 })),
        people[r.person].color,
        0.09,
        this.routeGroup,
      );
  }
  clear(g) {
    for (const c of [...g.children]) {
      g.remove(c);
      c.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => {
            m.map?.dispose();
            m.dispose();
          });
        }
      });
    }
  }
}
