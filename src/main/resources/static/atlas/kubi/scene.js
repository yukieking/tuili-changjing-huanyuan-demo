import { createCharacter } from "../../character-model.js";
import * as T from "three";
import { OrbitControls } from "../../vendor/OrbitControls.js";
import {
  rooms,
  places,
  byPlace as byId,
  people,
  edges,
  segment,
  helix,
} from "./geometry.js";
export class ReadingScene {
  constructor(host, onPick, onError) {
    this.host = host;
    this.onPick = onPick;
    this.roofs = [];
    this.shells = [];
    this.targets = [];
    this.labels = [];
    this.scene = new T.Scene();
    this.scene.background = new T.Color("#f4f2e8");
    this.scene.fog = null;
    this.renderer = new T.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor("#f4f2e8");
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    this.camera = new T.OrthographicCamera(-65, 65, 45, -45, 0.1, 350);
    this.camera.position.set(57, 66, 76);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(2, 0, 0);
    this.controls.enableDamping = false;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.maxPolarAngle = Math.PI / 2.04;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 4;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 145;
    this.scene.add(new T.HemisphereLight("#fffdf3", "#a1a99c", 2.6));
    const sun = new T.DirectionalLight("#fff2df", 2.4);
    sun.position.set(-30, 70, 35);
    sun.castShadow = true; sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,far:180});sun.shadow.bias=-.001;
    this.scene.add(sun);
    this.base = new T.Group();
    this.scene.add(this.base);
    this.pawnModels = new Map();
    this.pawns = new T.Group();
    this.scene.add(this.pawns);
    this.routeGroup = new T.Group();
    this.scene.add(this.routeGroup);
    this.build();
    for(const group of this.base.children){const ids=new Set();group.traverse(o=>{if(o.userData.place)ids.add(o.userData.place);});if(ids.has("towerTop"))rooms.filter(r=>r.id.startsWith("tower")).forEach(r=>ids.add(r.id));group.userData.places=[...ids];}
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    let down = null;
    host.addEventListener(
      "pointerdown",
      (e) => (down = { x: e.clientX, y: e.clientY }),
    );
    host.addEventListener("pointerup", (e) => {
      if (e.button !== 0) return;
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
        .find((h) => {let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});
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
    m.castShadow = true; m.receiveShadow = true;
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
    ctx.fillStyle = "rgba(248,246,235,.9)";
    ctx.beginPath();
    ctx.roundRect(4, 5, 504, 85, 18);
    ctx.fill();
    ctx.fillStyle = "#355e64";
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
    s.scale.set(6.5, 1.22, 1);
    s.renderOrder = 10;
    parent.add(s);
    s.userData.text = text;
    if (parent === this.base || parent.parent === this.base) this.labels.push(s);
    return s;
  }
  roof(w, d, x, z, parent = this.base) {
    const m = this.mesh(
      new T.ConeGeometry(Math.max(w, d) * 0.76, 2.7, 4),
      "#8c9e9b",
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
  window(x,y,z,w,h,parent){
    this.box(w,h,.05,"#c5d8d7",x,y,z,parent);
    for(const dx of [-w/2,0,w/2])this.box(.055,h+.1,.08,"#ad9b7e",x+dx,y,z+.04,parent);
    for(const dy of [-h/2,0,h/2])this.box(w+.1,.055,.08,"#ad9b7e",x,y+dy,z+.04,parent);
  }
  cabinet(x,z,parent){
    this.box(.75,.9,1.25,"#bba383",x,1,z,parent);
    for(const dz of [-.3,.3]){this.box(.035,.72,.53,"#cbb997",x+.395,1,z+dz,parent);this.box(.055,.04,.18,"#85765f",x+.425,1,z+dz,parent);}
    this.box(.84,.08,1.32,"#d8c5a4",x,1.5,z,parent);
  }
  table(x,z,parent){
    this.box(.95,.09,.75,"#bea887",x,.86,z,parent);
    for(const dx of [-.35,.35])for(const dz of [-.25,.25])this.box(.07,.28,.07,"#a68b6a",x+dx,.68,z+dz,parent);
    const pot=this.mesh(new T.SphereGeometry(.13,12,8),"#91a8a0",x,.99,z,parent);pot.scale.y=.8;
    this.mesh(new T.CylinderGeometry(.04,.04,.04,12),"#738e86",x,1.12,z,parent);
    this.line([{x:x+.1,y:1,z},{x:x+.2,y:1.06,z}],"#91a8a0",.035,parent);
    for(const dz of [-.22,.22])this.mesh(new T.CylinderGeometry(.065,.05,.08,12),"#faf8ef",x+.28,.96,z+dz,parent);
  }
  house(p, w = 7, d = 5) {
    const group = new T.Group();
    group.userData.place = p.id;
    this.base.add(group);
    this.targets.push(group);
    this.box(w, 0.35, d, "#aa9572", p.x, 0.25, p.z, group);
    const body = this.box(w, 3.4, d, "#faf8ef", p.x, 2, p.z, group);
    this.shells.push(body);
    const facade=new T.Group();group.add(facade);this.shells.push(facade);
    this.box(1.25,2.4,.12,"#bba383",p.x,1.55,p.z+d/2+.08,facade);
    this.mesh(new T.SphereGeometry(.07,8,6),"#8a7861",p.x+.4,1.5,p.z+d/2+.16,facade);
    for(const side of [-1,1])this.window(p.x+side*w*.3,2.1,p.z+d/2+.09,1.2,1.25,facade);
    for(let i=0;i<3;i++)this.box(2.4,.14, .5,"#d8cbb6",p.x,.12+i*.13,p.z+d/2+.85-i*.3,group);
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
    this.mesh(new T.CylinderGeometry(59, 61, 1, 100), "#ddd7c7", 0, -1.25, 0);
    this.mesh(
      new T.CylinderGeometry(32, 35, 2, 100),
      "#d9ddc9",
      0,
      -0.7,
      0,
    ).scale.set(1.3, 1, 0.86);
    this.mesh(
      new T.CylinderGeometry(24, 24, 0.15, 80),
      "#eee8d6",
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
    for (let i = 0; i < 42; i++) {
      const x = (random() - 0.5) * 99,
        z = (random() - 0.5) * 78;
      if (
        (Math.abs(x) < 27 && Math.abs(z) < 16) ||
        Math.abs(x - 4) < 9 ||
        (x > 15 && Math.abs(z) < 11) ||
        Math.hypot(x - 29, z + 26) < 10
      )
        continue;
      const h = 2.5 + random() * 2.5;
      this.mesh(
        new T.ConeGeometry(1.4 + random(), h, 7),
        "#a4b5a0",
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
        "#c5cebc",
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
      this.box(1.8,.12,.65,"#a1b9b6",p.x,.93,p.z,g);
      for(const dx of [-1.1,1.1])this.box(.2,.2,1.2,"#c9c8b8",p.x+dx,.93,p.z,g);
      for(const dz of [-.5,.5])this.box(2.4,.2,.2,"#c9c8b8",p.x,.93,p.z+dz,g);
      this.box(1.8,.04,.04,"#b1a280",p.x,1.12,p.z+.2,g);
      this.mesh(new T.CylinderGeometry(.12,.1,.13,16,1,true),"#c0b396",p.x+.45,1.15,p.z+.2,g);
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
      this.shells.push(this.box(w, 3.6, d, "#faf8ef", x, 2.25, z, g));
    }
    for (const x of [5.2, 14.8])
      for (const z of [-4.3, 4.3])
        this.box(0.28, 4, 0.28, "#69573e", x, 2.4, z, g);
    const door = this.box(2, 0.08, 0.45, "#dbbb82", 10.4, 0.57, -4.5, g);
    door.userData.place = "shrine";
    const screen=new T.Group();g.add(screen);screen.userData.front=true;this.shells.push(screen);
    for(const x of [9.45,9.75,10.05,10.35,10.65,10.95,11.25])this.box(.05,2.7,.07,"#ad9b7e",x,1.92,-4.4,screen);
    for(const y of [.6,1.3,2,2.7,3.25])this.box(1.9,.05,.07,"#ad9b7e",10.35,y,-4.4,screen);
    this.box(1.7,.15,4,"#b49b78",6.2,1.05,0,g);
    for(const z of [-1.65,1.65])for(const x of [5.65,6.75])this.box(.16,.55,.16,"#a58a69",x,.72,z,g);
    // Low ceremonial platform: shape follows the recorded fixture, ornament is illustrative.
    this.box(1.8,.18,4.1,"#c9b595",6.2,.58,0,g);
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
      ["A", "#bca789"],
      ["B", "#91afb0"],
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
      // Flush board joints, not stair treads: the novel describes a continuous sloping wooden passage.
      for(let i=0;i<64;i++){const p=helix(lane,i/64),v=new T.Vector3(p.x+3,0,p.z).normalize();this.line([{x:p.x-v.x*.53,y:p.y+.015,z:p.z-v.z*.53},{x:p.x+v.x*.53,y:p.y+.015,z:p.z+v.z*.53}],"#a49b87",.013,g);}
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
      "#8c9e9b",
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
    const tea = this.box(3.5, 0.32, 3.8, "#e5dcc8", p.x, 0.38, p.z, group);
    tea.userData.place = p.id;
    const inner = this.box(
      4.4,
      0.32,
      3.8,
      "#e5dcc8",
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
        this.box(8, .75, 0.15, "#faf8ef", center, .92, p.z + z, group),
      );

    }
    this.shells.push(
      this.box(0.15, 2.7, 4, "#faf8ef", room.x - 2.2, 1.8, p.z, group),
    );
    for (const z of [-1.2, 1.2])
      this.shells.push(
        this.box(0.15, 2.7, 1.4, "#faf8ef", p.x - 1.8, 1.8, p.z + z, group),
      );
    // Open tokonoma beside the built-in cupboard, facing the entrance.
    this.box(.85,.12,1.25,"#c6b08d",room.x-1.6,.65,p.z-.8,group);
    this.box(.1,1.4,1.25,"#faf8ef",room.x-2,.95,p.z-.8,group);
    this.box(.7,1.2,.06,"#ddd5be",room.x-1.6,1.3,p.z-1.38,group);
    this.cabinet(room.x-1.6,p.z+.8,group);
    this.box(2,.8,.7,"#bba383",p.x,.95,p.z-1.6,group);
    for(const y of [.7,.95,1.2]){this.box(1.85,.21,.035,"#ccb798",p.x,y,p.z-1.23,group);this.box(.25,.035,.06,"#85765f",p.x,y,p.z-1.19,group);}
    this.table(p.x,p.z,group);
    const wash=new T.Group();group.add(wash);
    this.box(.9,.6,.6,"#bda98c",p.x+1,.85,p.z+1.35,wash);
    this.box(.98,.08,.68,"#deddd0",p.x+1,1.18,p.z+1.35,wash);
    this.mesh(new T.CylinderGeometry(.22,.17,.08,20),"#8fa6a4",p.x+1,1.23,p.z+1.35,wash);
    this.line([{x:p.x+1,y:1.25,z:p.z+1.62},{x:p.x+1,y:1.52,z:p.z+1.62},{x:p.x+1,y:1.52,z:p.z+1.4}],"#a4b5b4",.025,wash);
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
    for(const z of [-2,2])for(const dx of [-2.12,2.12])this.shells.push(this.box(.12,2.7,.15,"#faf8ef",room.x+dx,1.8,p.z+z,group));
    for (const z of [-1.95, 1.95]) {
      const frame = new T.Group();
      group.add(frame);frame.userData.back=z<0;
      this.box(1.8,1.3,.035,"#eeeede",room.x,1.8,p.z+z,frame);
      this.shells.push(frame);
      for (let column = 0; column < 5; column++)
        this.box(
          0.025,
          1.3,
          0.025,
          "#776d55",
          room.x - 0.9 + column * 0.45,
          1.8,
          p.z + z + .04,
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
          p.z + z + .04,
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
    const bridge=this.box(
      Math.hypot(p.x+7,p.z),
      0.16,
      1.5,
      "#b9a47f",
      (p.x - 7) / 2,
      0.3,
      p.z / 2,
      group,
    );bridge.rotation.y=Math.atan2(-p.z,-7-p.x);bridge.userData.context=true;
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    const span=this.viewSpan||45;this.camera.left=-span*w/h;this.camera.right=span*w/h;this.camera.top=span;this.camera.bottom=-span;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.fit();
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
    this.viewSpan=mode==='village'?48:mode==='tower'?9:mode==='room'?5.5:21;
    const aspect=this.host.clientWidth/this.host.clientHeight;
    this.camera.left=-this.viewSpan*aspect;this.camera.right=this.viewSpan*aspect;this.camera.top=this.viewSpan;this.camera.bottom=-this.viewSpan;this.camera.updateProjectionMatrix();
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
    this.shells.forEach(m=>{
      if(!m.userData.cutOriginal)m.userData.cutOriginal={y:m.position.y,scale:m.scale.y};
      const o=m.userData.cutOriginal,focus=this.state?.focus;
      m.scale.y=o.scale;m.position.y=o.y;
      if(!value){m.visible=true;return;}
      const target=focus?byId(focus):null;
      m.visible=focus?!!m.userData.back||!m.userData.front&&!!target&&m.position.z<target.z-.5:true;
      if(!focus){m.scale.y=o.scale*.28;const h=m.geometry?.parameters?.height||0;m.position.y=o.y-h*.36;}
    });
  }
  top(value) {
    if (value) {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 100, 0.05);
    } else this.view("compound");
    this.controls.update();
  }
  setState(state){
    const previous=this.state;this.state=state;
    this.labels=this.labels.filter(s=>s.parent);
    if(!previous||previous.floor!==state.floor||previous.focus!==state.focus)this.fit();
    this.cut(state.floor===1||!!state.focus);
    for(const group of this.base.children){const ids=group.userData.places||[];group.visible=state.focus?ids.includes(state.focus):state.floor===0||ids.some(id=>rooms.find(r=>r.id===id)?.floor===1);}
    this.base.traverse(o=>{if(o.userData.context)o.visible=!state.focus;});
    // Remove distant context and label clutter while inspecting a single building.
    this.labels.forEach(l=>{l.scale.set(state.focus?3.8:6.5,state.focus?.length ? .72 : 1.22,1);const ids=l.parent?.userData.places||[];l.visible=state.focus?ids.includes(state.focus):state.floor===0?['ichimori','nimori','sanmori','jinja','north','east','south','well','kannon'].some(id=>ids.includes(id)):ids.some(id=>rooms.find(r=>r.id===id)?.floor===1);});
    for(const g of this.pawnModels.values())g.visible=false;
    const counts={};
    for(const [id,pos] of Object.entries(state.positions)){
      const p=byId(pos.room),r=rooms.find(r=>r.id===pos.room);if(!p||r?.floor!==state.floor||state.focus&&pos.room!==state.focus)continue;
      let g=this.pawnModels.get(id);if(!g){const person=people[Number(id)];g=createCharacter(person.role,person.color,true);g.scale.setScalar(1.05);this.pawns.add(g);this.pawnModels.set(id,g);const l=this.label(person.name,0,1.6,0,g);l.scale.set(3.8,.8,1);}
      const n=counts[p.id]||0;counts[p.id]=n+1;const y=p.id==='towerTop'?8.35:.15;
      g.position.set(p.x+(n%3-1)*1.1,y,p.z+Math.floor(n/3));g.visible=true;const dead=state.dead.includes(id);g.rotation.z=dead?-Math.PI/2:0;if(dead)g.position.y+=.35;g.traverse(o=>{if(o.isMesh){o.material.transparent=true;o.material.opacity=dead?.42:1;}});
    }
    this.clear(this.routeGroup);const nums={};
    for(const c of state.clues){const p=byId(c.place),r=rooms.find(r=>r.id===c.place);if(!p||r?.floor!==state.floor||state.focus&&c.place!==state.focus)continue;const n=nums[p.id]||0;nums[p.id]=n+1;const l=this.label(String(c.number),p.x+(n%3)*.7,p.id==='towerTop'?9:1.2,p.z+Math.floor(n/3),this.routeGroup);l.scale.set(1.4,.7,1);}
    this.renderer.render(this.scene,this.camera);
  }
  fit(){if(!this.state)return;this.camera.zoom=1;const focus=this.state.focus;this.view(focus?.startsWith('tower')?'tower':focus?'room':this.state.floor===0?'village':'compound',focus);this.camera.updateProjectionMatrix();}
  zoom(f){this.camera.zoom=Math.max(.5,Math.min(3,this.camera.zoom*f));this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);}
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
