import * as T from "three";
import { OrbitControls } from "../../vendor/OrbitControls.js";
import { createCharacter } from "../../character-model.js";
import {
  rooms,
  byId,
  inner,
  outer,
  personNames,
  roles,
  colors,
  constrain,
} from "./geometry.js";
export class ReadingScene {
  constructor(host, onPick, onFailure) {
    this.host = host;
    this.parts = new Map();
    this.targets = [];
    this.pawns = new Map();
    this.details = [];
    this.renderer = new T.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor("#f4f2e8");
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 160);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.enablePan = false;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 3;
    this.controls.addEventListener("change", () =>
      this.renderer.render(this.scene, this.camera),
    );
    this.scene.add(new T.HemisphereLight("#fffdf1", "#9facaf", 2.7));
    const sun = new T.DirectionalLight("#fff5e3", 2.2);
    sun.position.set(-10, 20, 10);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 25,
      bottom: -25,
      near: 1,
      far: 70,
    });
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.build();
    const ray = new T.Raycaster();
    let down;
    host.addEventListener(
      "pointerdown",
      (e) => (down = [e.clientX, e.clientY]),
    );
    host.addEventListener("pointerup", (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
        return;
      const b = host.getBoundingClientRect();
      ray.setFromCamera(
        new T.Vector2(
          ((e.clientX - b.left) / b.width) * 2 - 1,
          (-(e.clientY - b.top) / b.height) * 2 + 1,
        ),
        this.camera,
      );
      const visible = (o) => {
        while (o) {
          if (!o.visible) return false;
          o = o.parent;
        }
        return true;
      };
      const hit = ray
        .intersectObjects(this.targets)
        .find((h) => visible(h.object));
      if (hit) {
        const r = byId(hit.object.userData.room);
        onPick(r.id, { x: hit.point.x, z: hit.point.z });
      }
    });
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      onFailure();
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
  }
  material(c) {
    return new T.MeshStandardMaterial({ color: c, roughness: 0.85 });
  }
  box(g, w, h, d, c, x, y, z, rotation = 0) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), this.material(c));
    m.position.set(x, y, z);
    m.rotation.y = rotation;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  }
  slab(g, polygon, c, y = 0) {
    const s = new T.Shape();
    polygon.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const m = new T.Mesh(geo, this.material(c));
    m.position.y = y - 0.16;
    m.receiveShadow = true;
    g.add(m);
    return m;
  }
  label(g, text, x, y, z, w = 2.8) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.font = "500 52px sans-serif";
    ctx.fillStyle = "#284f58";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 80);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(w, w / 4, 1);
    sprite.renderOrder = 10;
    g.add(sprite);
    return sprite;
  }
  wall(g, a, b, height = 0.9, c = "#faf8ef") {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz);
    return this.box(
      g,
      len,
      height,
      0.085,
      c,
      (a[0] + b[0]) / 2,
      height / 2,
      (a[1] + b[1]) / 2,
      -Math.atan2(dz, dx),
    );
  }
  opening(g, a, b, kind, height, color = "#eeeadd") {
    const lerp = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    this.wall(g, a, lerp(0.34), height);
    this.wall(g, lerp(0.66), b, height);
    const p = lerp(0.5),
      ang = -Math.atan2(b[1] - a[1], b[0] - a[0]),
      len = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.32;
    if (kind === "door") {
      this.box(g, len, 0.09, 0.15, "#d9d2b7", p[0], 0.05, p[1], ang);
      this.box(g, len * 0.47, 0.85, 0.07, color, p[0], 0.45, p[1], ang + 0.5);
    } else {
      this.box(g, len, 0.08, 0.11, "#73949d", p[0], 0.45, p[1], ang);
      this.box(g, len, 0.65, 0.035, "#b6d4d8", p[0], 0.8, p[1], ang);
      this.box(g, len, 0.08, 0.11, "#73949d", p[0], 1.15, p[1], ang);
      for (const t of [0.34, 0.66]) {
        const q = lerp(t);
        this.box(g, 0.08, 0.7, 0.08, "#73949d", q[0], 0.8, q[1]);
      }
    }
  }
  build() {
    this.island = new T.Group();
    this.scene.add(this.island);
    const coast = [
      [-9, -10],
      [-4, -9],
      [1, -12],
      [7, -11],
      [9, -6],
      [8, 1],
      [6, 9],
      [3, 12],
      [-1, 9],
      [-7, 9],
      [-9, 6],
      [-6, 2],
      [-8, -4],
    ];
    this.slab(this.island, coast, "#d4d8bd", -0.25);
    this.box(this.island, 32, 0.15, 32, "#bfd7dd", 0, -1.8, 0);
    const coastWall = this.slab(this.island, coast, "#b1b8a7", -0.4);
    coastWall.scale.y = 7;
    coastWall.position.y = -0.4;
    for (const [x, z] of [
      [-2, -1],
      [1, -1],
      [3, 0],
      [-4, -8],
      [5, -6],
      [6, 1],
    ]) {
      this.box(this.island, 0.13, 1.1, 0.13, "#ab9470", x, 0.3, z);
      const tree = new T.Mesh(
        new T.ConeGeometry(0.7, 1.8, 7),
        this.material("#8fa68b"),
      );
      tree.position.set(x, 1.3, z);
      tree.castShadow = true;
      this.island.add(tree);
    }
    for (const r of rooms) {
      const g = new T.Group();
      this.scene.add(g);
      this.parts.set(r.id, g);
      const slab = this.slab(
        g,
        r.polygon,
        r.floor === 1
          ? "#c3c9b2"
          : r.type === "hall"
            ? "#b7cfd4"
            : r.type === "wash"
              ? "#cad9d5"
              : "#e5dcc8",
      );
      g.userData.floorMesh = slab;
      slab.userData.room = r.id;
      this.targets.push(slab);
      this.label(
        g,
        r.type === "wash" ? "盥洗区" : r.name,
        r.center[0],
        0.22,
        r.center[1],
        3.1,
      );
      if (r.floor >= 2) {
        for(let i=0;i<r.polygon.length;i++){
          const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length];
          this.wall(g,a,b,(a[1]+b[1])/2<0?1:.22,"#c9ceca");
        }
        if(r.type==="steps")for(let i=0;i<9;i++)this.box(g,1.2,(i+1)*.08,.23,"#9facac",r.center[0],(i+1)*.04,r.center[1]+1-i*.23);
        continue;
      }
      if (r.floor === 1) {
        this.islandDetail(g, r);
        continue;
      }
      if (r.type === "hall") {
        // The roof is removed; its ten-sided skylight remains a thin spatial cue.
        const line = new T.LineLoop(
          new T.BufferGeometry().setFromPoints(
            inner.map(([x, z]) => new T.Vector3(x * 0.5, 2.1, z * 0.5)),
          ),
          new T.LineBasicMaterial({ color: "#a5bcc1" }),
        );
        g.add(line);
        const table = this.slab(
          g,
          inner.map(([x, z]) => [x * 0.4, z * 0.4]),
          "#faf8ed",
          0.8,
        );
        this.box(g, 0.9, 0.7, 0.9, "#c8c5b8", 0, 0.35, 0);
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5;
          const x = Math.cos(a) * 2.2,
            z = Math.sin(a) * 2.2;
          this.box(g, 0.5, 0.1, 0.5, "#718fa8", x, 0.45, z, -a);
          this.box(
            g,
            0.5,
            0.5,
            0.07,
            "#f0ede1",
            x + Math.cos(a) * 0.23,
            0.72,
            z + Math.sin(a) * 0.23,
            -a - Math.PI / 2,
          );
          for (const dx of [-0.17, 0.17])
            this.box(g, 0.065, 0.4, 0.065, "#f0ede1", x + dx, 0.22, z);
        }
        // A simple tile grid conveys the blue floor, without invented evidence marks.
        for (let k = -3; k <= 3; k++) {
          const end = Math.sqrt(16 - k * k) * 0.86;
          const line = new T.Line(
            new T.BufferGeometry().setFromPoints([
              new T.Vector3(k, 0.015, -end),
              new T.Vector3(k, 0.015, end),
            ]),
            new T.LineBasicMaterial({ color: "#d5e4e4" }),
          );
          g.add(line);
        }
        continue;
      }
      const i = r.sector,
        a = ((-90 + i * 36) * Math.PI) / 180,
        n = [Math.cos(a), Math.sin(a)],
        t = [-n[1], n[0]];
      this.wall(g, r.polygon[0], r.polygon[1], r.center[1] < 0 ? 1.15 : 0.25);
      this.wall(g, r.polygon[2], r.polygon[3], r.center[1] < 0 ? 1.15 : 0.25);
      this.opening(g, r.polygon[3], r.polygon[0], "door", 0.8);
      this.opening(
        g,
        r.polygon[1],
        r.polygon[2],
        r.type === "entry" ? "door" : "window",
        r.center[1] < 0 ? 1.3 : 0.35,
        r.type === "entry" ? "#6e93a7" : "#eeeadd",
      );
      const frame = (u, v) => [
        n[0] * (5.9 + v) + t[0] * u,
        n[1] * (5.9 + v) + t[1] * u,
      ];
      const b = (w, h, d, c, u, y, v, parent = g) => {
        const p = frame(u, v);
        return this.box(parent, w, h, d, c, p[0], y, p[1], -a - Math.PI / 2);
      };
      if (r.type === "guest") {
        const furniture = new T.Group();
        g.add(furniture);
        this.details.push(furniture);
        b(1.1, 0.38, 1.9, "#a6b6c3", -0.65, 0.27, 0.15, furniture);
        b(1.06, 0.1, 1.8, "#f6f0df", -0.65, 0.52, 0.15, furniture);
        b(0.95, 0.09, 0.42, "#d5e0e3", -0.65, 0.6, 0.78, furniture);
        b(0.85, 0.1, 0.6, "#b49b78", 0.85, 0.7, 0.6, furniture);
        b(0.65, 0.65, 0.5, "#b49b78", 0.85, 0.34, 0.6, furniture);
        b(0.7, 1.1, 0.5, "#ae9d80", 0.85, 0.58, -0.3, furniture);
        b(0.4, 1, 0.1, "#c6dbde", 0.85, 0.56, -0.9, furniture);
      } else if (r.type === "kitchen") {
        b(3.2, 0.7, 0.65, "#a3b7b3", 0, 0.35, 0.9);
        b(1.2, 0.08, 0.58, "#ecebdc", -0.65, 0.74, 0.9);
        b(0.7, 0.06, 0.5, "#6c8590", 0.6, 0.76, 0.9);
        b(0.8, 1.15, 0.3, "#ab9e83", -1, 0.58, -0.7);
        b(0.7, 0.08, 0.3, "#ede8d4", -1, 0.95, -0.7);
      } else if (r.type === "wash") {
        // Original map: both enclosed rooms open from the washstand zone.
        const p = frame(0, 0.25),
          q = frame(0, 1.45);
        this.wall(g, p, q, 0.6);
        const left = frame(-1.4, 0.25),
          right = frame(1.4, 0.25);
        this.opening(g, left, p, "door", 0.65);
        this.opening(g, p, right, "door", 0.65);
        b(1.2, 0.4, 0.7, "#edf1e8", -0.7, 0.23, 0.85);
        b(0.9, 0.08, 0.5, "#b4d1d8", -0.7, 0.47, 0.85);
        b(0.42, 0.4, 0.5, "#f5f2e6", 0.65, 0.23, 0.85);
        for (const [u, label] of [
          [-0.7, "浴室"],
          [0.7, "卫生间"],
        ]) {
          const p = frame(u, 1.25);
          this.label(g, label, p[0], 0.52, p[1], 1.3);
        }
        b(1, 0.6, 0.42, "#d6e0d7", 0, 0.34, -0.7);
      } else if (r.type === "entry") {
        for (let j = 0; j < 3; j++)
          b(
            1.8,
            (3 - j) * 0.08,
            0.35,
            "#b9c8c9",
            0,
            (3 - j) * 0.04,
            1.9 + j * 0.35,
          );
      }
    }
  }
  islandDetail(g, r) {
    const [x, z] = r.center;
    if (r.type === "house") {
      const geo = new T.CylinderGeometry(1.3, 1.3, 0.7, 10);
      const m = new T.Mesh(geo, this.material("#f1eee0"));
      m.position.set(x, 0.35, z);
      g.add(m);
      const roof = new T.Mesh(
        new T.ConeGeometry(1.4, 0.45, 10),
        this.material("#7195a9"),
      );
      roof.position.set(x, 0.95, z);
      g.add(roof);
    } else if (r.type === "ruins") {
      this.wall(g, [r.x, r.z], [r.x + r.w, r.z], 0.4, "#a5a79a");
      this.wall(g, [r.x, r.z], [r.x, r.z + r.d], 0.5, "#a5a79a");
      for (let i = 0; i < 8; i++)
        this.box(
          g,
          0.4,
          0.15,
          0.35,
          "#b3b0a1",
          r.x + 0.4 + (i % 4),
          0.1,
          r.z + 0.5 + Math.floor(i / 4),
          i * 0.3,
        );
    } else if (r.type === "pier") {
      this.box(g, 2, 0.15, 0.7, "#b6a489", x - 1, 0.02, z + 1.2, -0.45);
      this.box(g, 0.85, 0.65, 0.7, "#b8ad90", x, 0.3, z);
    } else if (r.type === "rocks") {
      for (let i = 0; i < 5; i++) {
        const m = new T.Mesh(
          new T.DodecahedronGeometry(0.55),
          this.material("#a8b4b0"),
        );
        m.position.set(x + (i % 2) * 0.7 - 0.4, 0.25, z + (i - 2) * 0.7);
        g.add(m);
      }
    }
  }
  setState(state) {
    const prev = this.state;
    this.state = state;
    const map = state.floor === "all" ? 0 : state.floor;
    this.island.visible = map === 1;
    for (const r of rooms) {
      const part = this.parts.get(r.id);
      part.visible =
        r.floor === map &&
        r.chapter <= state.chapter && state.unlocked.includes(r.id) &&
        (!state.focus || state.focus === r.id);
      if (r.type === "guest")
        part.userData.floorMesh.material.color.set(
          state.chapter >= 3 ? "#c4d4df" : "#e5dcc8",
        );
    }
    for (const g of this.details) g.visible = state.chapter >= 3 && !(state.truth && g.parent===this.parts.get("van"));
    if(!this.sleepingBag){this.sleepingBag=new T.Group();this.parts.get("van").add(this.sleepingBag);const r=byId("van");this.box(this.sleepingBag,.9,.14,1.8,"#78919a",r.center[0],.13,r.center[1]);}
    this.sleepingBag.visible=state.truth;
    for (const p of this.pawns.values()) p.visible = false;
    if (state.showPeople)
      for (const [id, p] of Object.entries(state.positions)) {
        const r = byId(p.room);
        if (
          !r ||
          r.floor !== map ||
          r.chapter > state.chapter ||
          (state.focus && r.id !== state.focus)
        )
          continue;
        let g = this.pawns.get(id);
        if (!g) {
          g = createCharacter(roles[id], colors[id]);
          g.traverse((o) => {
            if (
              o.isMesh &&
              ["a17a4c", "73766b"].includes(o.material.color.getHexString())
            )
              o.material.color.set(colors[id]);
          });
          g.scale.setScalar(0.65);
          this.label(g, personNames[id], 0, 1.5, 0, 1.8);
          this.scene.add(g);
          this.pawns.set(id, g);
        }
        const pos = constrain(r, r.x + p.u * r.w, r.z + p.v * r.d);
        g.position.set(pos.x, 0, pos.z);
        g.visible = true;
      }
    if (!prev || prev.floor !== state.floor || prev.focus !== state.focus)
      this.fit();
    if(this.evidenceGroup){this.scene.remove(this.evidenceGroup);this.evidenceGroup.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
    this.evidenceGroup=new T.Group();this.scene.add(this.evidenceGroup);
    const perRoom={};
    for(const c of state.clues){
      const r=byId(c.place);if(!r||r.floor!==map||!state.unlocked.includes(r.id)||(state.focus&&state.focus!==r.id))continue;
      const n=perRoom[r.id]||0;perRoom[r.id]=n+1;
      const x=r.center[0]+(n%3-1)*.45,z=r.center[1]+Math.floor(n/3)*.45;
      const color=c.kind==="判断"?"#b39457":"#b35c47";
      const pin=new T.Mesh(new T.CylinderGeometry(.13,.13,.18,12),this.material(color));pin.position.set(x,.25,z);this.evidenceGroup.add(pin);
      this.label(this.evidenceGroup,String(c.number),x,.6,z,.7);
    }
    if(state.fire&&map===0)this.label(this.evidenceGroup,"火灾阶段 · 保留结构示意",0,2.6,0,6);
    for(const [id,g] of this.pawns){
      const dead=state.dead.includes(id);g.rotation.z=dead?-Math.PI/2:0;if(dead&&g.visible)g.position.y=.25;
      g.traverse(o=>{if(o.isMesh){o.material.transparent=true;o.material.opacity=dead?.42:1;}});
    }
    this.renderer.render(this.scene, this.camera);
  }
  fit() {
    if (!this.state) return;
    const map = this.state.floor === "all" ? 0 : this.state.floor;
    let target = new T.Vector3(0, 0.3, 0),
      span = map === 1 ? 31 : 21;
    if (this.state.focus) {
      const r = byId(this.state.focus);
      target.set(r.center[0], 0.4, r.center[1]);
      span = Math.max(r.w, r.d) * 1.65;
    }
    const aspect = this.host.clientWidth / Math.max(1, this.host.clientHeight),
      h = Math.max(span / aspect, span * 0.72);
    this.camera.left = (-h * aspect) / 2;
    this.camera.right = (h * aspect) / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.zoom = 1;
    this.camera.position.copy(target).add(new T.Vector3(18, 23, 22));
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
