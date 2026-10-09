import * as T from "three";
import { OrbitControls } from "../../vendor/OrbitControls.js";
import { createCharacter } from "../../character-model.js";
import { rooms, byId, floorNames, roles, colors, personNames } from "./data.js";
export class ReadingScene {
  constructor(host, onPick, onFailure) {
    this.host = host;
    this.onPick = onPick;
    this.groups = new Map();
    this.parts = new Map();
    this.targets = [];
    this.pawns = new Map();
    this.labels = [];
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor("#f4f2e8");
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-10, 10, 8, -8, 0.1, 200);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 3;
    this.scene.add(new T.HemisphereLight("#fffdf3", "#a1a99c", 2.6));
    const sun = new T.DirectionalLight("#fff2df", 2.4);
    sun.position.set(-8, 22, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 25,
      bottom: -25,
      near: 1,
      far: 80,
    });
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.build();
    this.ray = new T.Raycaster();
    let start = null;
    host.addEventListener(
      "pointerdown",
      (e) => (start = { x: e.clientX, y: e.clientY }),
    );
    host.addEventListener("pointerup", (e) => {
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5)
        return;
      const rect = host.getBoundingClientRect();
      this.ray.setFromCamera(
        new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        this.camera,
      );
      const hits = this.ray.intersectObjects(this.targets, true).filter((h) => {
        let o = h.object;
        while (o) {
          if (!o.visible) return false;
          o = o.parent;
        }
        return true;
      });
      const hit = hits[0];
      if (hit) {
        let o = hit.object;
        while (o && !o.userData.room) o = o.parent;
        if (o?.userData.room) {
          const g = this.groups.get(byId(o.userData.room).floor),
            p = g.worldToLocal(hit.point.clone());
          this.onPick(o.userData.room, p);
        }
      }
    });
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      onFailure();
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => {
      if (!document.hidden && host.clientWidth)
        this.renderer.render(this.scene, this.camera);
    });
  }
  box(g, w, h, d, c, x, y, z) {
    const m = new T.Mesh(
      new T.BoxGeometry(w, h, d),
      new T.MeshStandardMaterial({ color: c, roughness: 0.9 }),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  }
  label(text, width = 2.5) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#294c55";
    ctx.font = "500 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 50);
    const material = new T.SpriteMaterial({
      map: new T.CanvasTexture(canvas),
      depthTest: false,
      transparent: true,
    });
    const s = new T.Sprite(material);
    s.scale.set(width, width / 5.12, 1);
    s.renderOrder = 20;
    return s;
  }
  outline(g, r) {
    const pts = [
      new T.Vector3(r.x, 0.06, r.z),
      new T.Vector3(r.x + r.w, 0.06, r.z),
      new T.Vector3(r.x + r.w, 0.06, r.z + r.d),
      new T.Vector3(r.x, 0.06, r.z + r.d),
      new T.Vector3(r.x, 0.06, r.z),
    ];
    const line = new T.Line(
      new T.BufferGeometry().setFromPoints(pts),
      new T.LineDashedMaterial({
        color: "#839891",
        dashSize: 0.15,
        gapSize: 0.12,
      }),
    );
    line.computeLineDistances();
    g.add(line);
  }
  build() {
    for (let f = 0; f < 3; f++) {
      const g = new T.Group();
      this.scene.add(g);
      this.groups.set(f, g);
      const tag = this.label(floorNames[f], 3.2);
      tag.position.set(-4.6, 0.4, 4);
      tag.userData.floorTag = true;
      g.add(tag);
    }
    for (const r of rooms) {
      const floor = this.groups.get(r.floor),
        g = new T.Group();
      floor.add(g);
      g.userData.room = r.id;
      this.parts.set(r.id, g);
      const x = r.x + r.w / 2,
        z = r.z + r.d / 2;
      const slab = this.box(
        g,
        r.w,
        0.16,
        r.d,
        r.type === "unknown"
          ? "#e4e6dd"
          : r.floor === 0
            ? "#e9dfc7"
            : "#d9e4df",
        x,
        -0.07,
        z,
      );
      slab.userData.room = r.id;
      this.targets.push(slab);
      if (r.type === "unknown") {
        this.outline(g, r);
      } else {
        this.box(g, r.w, 1.15, 0.1, "#fffdf2", x, 0.56, r.z);
        if (['living','vera'].includes(r.type)) {
          this.box(g,.1,1.15,1.8,"#fffdf2",r.x,.56,r.z+.9);
          this.box(g,.1,1.15,r.d-2.9,"#fffdf2",r.x,.56,r.z+2.9+(r.d-2.9)/2);
          this.box(g,.1,.25,1.1,"#fffdf2",r.x,1.02,r.z+2.35);
        } else this.box(g, 0.1, 1.15, r.d, "#fffdf2", r.x, 0.56, z);
        // Open front and right walls make this a legible editorial cutaway.
        this.box(g, r.w, 0.1, 0.09, "#faf8ee", x, 0.08, r.z + r.d);
        this.box(g, 0.09, 0.1, r.d, "#faf8ee", r.x + r.w, 0.08, z);
      }
      const title = this.label(r.name, Math.min(r.w * 0.88, 3.5));
      title.position.set(x, 0.24, r.z + r.d - 0.37);
      g.add(title);
      this.labels.push({ title, room: r.id });
      const rect = (w, h, d, c, ox, oy, oz) =>
        this.box(g, w, h, d, c, r.x + ox, oy, r.z + oz);
      if (["vera", "staff"].includes(r.type)) {
        rect(1.4, 0.35, 2.1, "#90a8ad", r.w * 0.65, 0.3, 1.35);
        rect(1.35, 0.11, 1.9, "#f2eee1", r.w * 0.65, 0.54, 1.35);
        rect(1.18, 0.1, 0.45, "#d3e0dc", r.w * 0.65, 0.65, 0.6);
        rect(0.7, 0.6, 0.55, "#b69b7b", 0.7, 0.32, 1.8);
        rect(0.9, 0.85, 0.15, "#c3ac8b", 0.7, 0.48, 0.15);
        rect(0.55, 0.65, 0.05, "#d2e3df", 0.7, 0.52, 0.245);
        rect(0.68, 0.4, 0.7, "#b39d7e", 0.72, 0.25, 2.8);
        rect(0.68, 0.38, 0.14, "#b39d7e", 0.72, 0.59, 2.45);
        if (r.type === "vera") {
          rect(0.72, 0.8, 0.28, "#d4cbb6", 2.1, 0.46, 0.2);
          rect(0.35, 0.26, 0.06, "#8a9e9d", 2.1, 0.86, 0.37);
          rect(1.2, 0.75, 0.055, "#a9c5ca", r.w - 1.1, 0.75, 0.085);
          rect(0.055, 0.75, 1, "#a9c5ca", r.w - 0.05, 0.75, 1.9);
        }
      }
      if (r.type === "living") {
        rect(2.2, 0.5, 0.7, "#92aeb5", 2.65, 0.38, 0.9);
        rect(2.2, 0.45, 0.12, "#92aeb5", 2.65, 0.65, 0.57);
        rect(0.9, 0.12, 0.65, "#b69f7e", 2.6, 0.42, 2.2);
        for (const ox of [2.3, 2.9])
          rect(0.06, 0.32, 0.5, "#b69f7e", ox, 0.23, 2.2);
        rect(0.9, 0.9, 0.28, "#c4b399", 0.8, 0.49, 0.2);
        rect(0.53, 0.45, 0.04, "#6c7773", 0.8, 0.38, 0.365);
      }
      if (r.type === "dining") {
        rect(2.4, 0.13, 1.1, "#b4a183", 2.3, 0.68, 1.9);
        for (const ox of [1.4, 3.2])
          rect(0.1, 0.6, 0.7, "#b4a183", ox, 0.35, 1.9);
        for (const ox of [1.4, 2.3, 3.2])
          for (const oz of [1.0, 2.8]) {
            rect(0.48, 0.08, 0.48, "#90a49d", ox, 0.39, oz);
            rect(0.05, 0.4, 0.05, "#9e957d", ox, 0.19, oz);
            rect(0.48, 0.35, 0.08, "#90a49d", ox, 0.6, oz + 0.2);
          }
      }
      if (r.type === "neighbor") {
        rect(.65,.15,.45,"#796f55",1.3,.8,1.1);
        const horn = new T.Mesh(new T.ConeGeometry(.28,.48,24,1,true),new T.MeshStandardMaterial({color:"#b79a5e",side:T.DoubleSide}));
        horn.rotation.z = -Math.PI / 3;
        horn.position.set(r.x+1.55,1.16,r.z+1.1);
        g.add(horn);

        rect(1.3, 0.12, 0.8, "#b69b7b", 1.3, 0.65, 1.1);
        rect(0.08, 0.65, 0.65, "#b69b7b", 0.85, 0.33, 1.1);
        rect(0.08, 0.65, 0.65, "#b69b7b", 1.75, 0.33, 1.1);
      }
      if (r.type === "bath") {
        rect(1.6, 0.45, 0.8, "#faf9ef", 1.25, 0.28, 1);
        rect(1.35, 0.06, 0.55, "#b9d1d2", 1.25, 0.51, 1);
        rect(0.55, 0.6, 0.4, "#f4f3e9", 0.65, 0.36, 2.25);
      }
      if (r.type === "kitchen") {
        rect(3.8, 0.75, 0.65, "#abbcaf", 2.3, 0.44, 0.5);
        rect(0.7, 0.75, 2, "#abbcaf", 0.6, 0.44, 1.6);
        rect(0.8, 1.3, 0.7, "#d9e2d8", 3.6, 0.72, 1.5);
      }
      if (r.type === "stairs")
        for (let n = 0; n < 10; n++)
          rect(
            1.5,
            (n + 1) * 0.14,
            0.23,
            "#a8bec1",
            1,
            (n + 1) * 0.07,
            2.7 - n * 0.23,
          );
      if (!["unknown", "corridor", "stairs"].includes(r.type)) {
        // Door locations are diagrammatic; a dark leaf helps readers see passage.
        rect(0.12, 0.8, 0.85, "#b1bcae", ["living","vera"].includes(r.type) ? .12 : r.w - 0.12, 0.45, r.d * 0.6);
        rect(0.15, 0.06, 1, "#c9d4c6", ["living","vera"].includes(r.type) ? .12 : r.w - .12, 0.04, r.d * 0.6);
      }
    }
    this.staffLink = new T.Group();
    this.groups.get(1).add(this.staffLink);
    this.box(this.staffLink, 1.4, 0.09, 1.6, "#c9d6cd", 8.8, 0.08, 7);
    for (let i = 0; i < 8; i++)
      this.box(
        this.staffLink,
        1.1,
        (i + 1) * 0.12,
        0.16,
        "#a8bec1",
        8.8,
        (i + 1) * 0.06,
        7.5 - i * 0.16,
      );
  }
  setState(state) {
    const previous = this.state;
    this.state = state;
    const { floor, focus, chapter } = state;
    for (const [f, g] of this.groups) {
      g.position.y = floor === "all" ? f * 4.2 : 0;
      g.visible =
        (floor === "all" || floor === f) &&
        rooms.some((r) => r.floor === f && r.chapter <= chapter);
      g.children
        .filter((o) => o.userData.floorTag)
        .forEach((o) => (o.visible = floor === "all"));
    }
    for (const r of rooms)
      this.parts.get(r.id).visible =
        r.chapter <= chapter && (!focus || focus === r.id);
    this.staffLink.visible = chapter >= 8 && !focus;
    for (const [id, g] of this.pawns) g.visible = false;
    if (state.showPeople)
      for (const [id, p] of Object.entries(state.positions)) {
        const r = byId(p.room);
        if (!r || r.chapter > chapter || (focus && focus !== r.id)) continue;
        let g = this.pawns.get(id);
        if (!g) {
          g = createCharacter(roles[id], colors[id]);
          g.scale.setScalar(0.8);
          const label = this.label(personNames[id], 1.5);
          label.position.y = 1.42;
          g.add(label);
          this.pawns.set(id, g);
        }
        this.groups.get(r.floor).add(g);
        g.position.set(r.x + r.w * p.u, 0.07, r.z + r.d * p.v);
        g.visible = true;
      }
    if (
      !previous ||
      previous.floor !== floor ||
      previous.focus !== focus ||
      previous.chapter !== chapter
    )
      this.fit();
    this.renderer.render(this.scene, this.camera);
  }
  fit() {
    if (!this.state) return;
    const { floor, focus } = this.state;
    const shown = rooms.filter(r => r.chapter <= this.state.chapter &&
      (floor === "all" || r.floor === floor) && (!focus || r.id === focus));
    if (!shown.length) return;
    const bounds = new T.Box3();
    for (const r of shown) {
      const y = floor === "all" ? r.floor * 4.2 : 0;
      bounds.expandByPoint(new T.Vector3(r.x, y - .2, r.z));
      bounds.expandByPoint(new T.Vector3(r.x + r.w, y + 1.8, r.z + r.d));
    }
    const target = bounds.getCenter(new T.Vector3());
    this.camera.position.copy(target).add(new T.Vector3(20,20,20));
    this.camera.lookAt(target);
    this.camera.updateMatrixWorld();
    const projected = new T.Box3();
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z])
          projected.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(this.camera.matrixWorldInverse));
    const size = projected.getSize(new T.Vector3());
    const aspect = this.host.clientWidth / Math.max(1, this.host.clientHeight);
    const height = Math.max(size.y, size.x / aspect) * 1.25;
    this.camera.left = (-height * aspect) / 2;
    this.camera.right = (height * aspect) / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.zoom = 1;
    this.camera.position.copy(target).add(new T.Vector3(20, 20, 20));
    this.controls.target.copy(target);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.fit();
  }
  zoom(f) {
    this.camera.zoom = Math.max(0.5, Math.min(3, this.camera.zoom * f));
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
}
