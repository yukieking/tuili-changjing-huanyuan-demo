import { createCharacter } from "./character-model.js";
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import {
  rooms,
  roomById,
  connections,
  windows,
  threshold,
  center,
  people,
  positionsAt,
  pathPoints,
  nodeAt,
} from "./domain.js";
const SCALE = 0.028,
  LEVEL = 3.25;
const world = (p) =>
  new THREE.Vector3(
    (p.x - 407) * SCALE,
    (p.floor || 0) * LEVEL,
    (p.z - 295) * SCALE,
  );
export class VillaScene {
  constructor(host, callbacks) {
    this.host = host;
    this.cb = callbacks;
    this.floor = -1;
    this.focus = null;
    this.explode = false;
    this.cut = false;
    this.hideRoof = false;
    this.ghost = false;
    this.top = false;
    this.roomMeshes = new Map();
    this.roomOutlines = new Map();
    this.floorGroups = [];
    this.walls = [];
    this.doors = [];
    this.labels = [];
    this.pawns = [];
    this.pickables = [];
    this.routeKey = "";
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor("#182d29");
    host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "可旋转、缩放的三维别墅",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog("#182d29", 55, 125);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 180);
    this.camera.position.set(23, 19, 26);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 65;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.target.set(0, 2.4, 0);
    this.scene.add(new THREE.HemisphereLight("#fff5d8", "#416458", 2.5));
    let sun = new THREE.DirectionalLight("#fff1cf", 3);
    sun.position.set(-15, 30, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 25,
      bottom: -25,
      near: 1,
      far: 75,
    });
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
    this.build();
    this.ray = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.installEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => {
      if (document.hidden || !this.host.clientWidth) return;
      this.controls.update();
      if (this.state) this.updatePawns(this.state.plan, this.cb.getTime());
      this.renderer.render(this.scene, this.camera);
    });
  }
  material(color, opts = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.83, ...opts });
  }
  box(parent, w, h, d, x, y, z, color, opts = {}) {
    let mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      this.material(color, opts),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  label(text, color = "#e3ecd4", width = 3) {
    let canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 96;
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#12231edb";
    ctx.beginPath();
    ctx.roundRect(0, 0, 384, 96, 14);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = "500 34px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 192, 48);
    let texture = new THREE.CanvasTexture(canvas),
      s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          depthTest: false,
          transparent: true,
        }),
      );
    s.scale.set(width, width / 4, 1);
    return s;
  }
  build() {
    let ocean = this.box(this.scene, 130, 0.3, 130, 0, -1.1, 0, "#254f4b", {
      metalness: 0.25,
      roughness: 0.4,
    });
    ocean.castShadow = false;
    let island = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 20, 1.6, 10),
      this.material("#52624c"),
    );
    island.scale.z = 0.8;
    island.rotation.y = 0.2;
    island.position.y = -0.9;
    island.receiveShadow = true;
    this.scene.add(island);
    this.island = island;
    let foundation = this.box(
      this.scene,
      18.7,
      0.45,
      12.2,
      0,
      -0.25,
      0,
      "#596455",
    );
    foundation.castShadow = false;
    this.foundation = foundation;
    let grid = new THREE.GridHelper(80, 50, "#678778", "#355c51");
    grid.position.y = -0.91;
    grid.material.transparent = true;
    grid.material.opacity = 0.18;
    this.scene.add(grid);
    for (let f = 0; f < 2; f++) {
      let g = new THREE.Group();
      g.position.y = f * LEVEL;
      this.scene.add(g);
      this.floorGroups[f] = g;
    }
    rooms.forEach((r) => {
      let g = r.floor === 2 ? this.scene : this.floorGroups[r.floor],
        firstChild = g.children.length,
        c = world(center(r.id));
      c.y = 0;
      if (r.floor === 2) {
        c.y = -0.05;
        if (r.kind === "rock") {
          let rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(1.8, 0),
            this.material("#75806b"),
          );
          rock.position.copy(c);
          rock.userData = { kind: "room", room: r.id, floor: 2 };
          g.add(rock);
          this.pickables.push(rock);
          return;
        }
      }
      let slab = this.box(
        g,
        r.w * SCALE,
        0.16,
        r.h * SCALE,
        c.x,
        -0.04,
        c.z,
        r.kind === "terrace" || r.floor === 2
          ? "#6e7f60"
          : r.floor === 0
            ? "#b5ae88"
            : "#9ea88a",
      );
      slab.userData = { kind: "room", room: r.id, floor: r.floor };
      this.pickables.push(slab);
      this.roomMeshes.set(r.id, slab);
      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(
            c.x - (r.w * SCALE) / 2,
            0.05,
            c.z - (r.h * SCALE) / 2,
          ),
          new THREE.Vector3(
            c.x + (r.w * SCALE) / 2,
            0.05,
            c.z - (r.h * SCALE) / 2,
          ),
          new THREE.Vector3(
            c.x + (r.w * SCALE) / 2,
            0.05,
            c.z + (r.h * SCALE) / 2,
          ),
          new THREE.Vector3(
            c.x - (r.w * SCALE) / 2,
            0.05,
            c.z + (r.h * SCALE) / 2,
          ),
        ]),
        new THREE.LineBasicMaterial({ color: "#e4ddbd" }),
      );
      outline.userData = { kind: "outline", room: r.id };
      g.add(outline);
      this.roomOutlines.set(r.id, outline);
      const tag = this.label(
        r.name,
        "#e6edcc",
        Math.min(3.3, r.w * SCALE * 0.7),
      );
      tag.position.set(c.x, 0.19, c.z);
      tag.userData = { kind: "room", room: r.id, floor: r.floor };
      g.add(tag);
      this.labels.push({ tag, room: r.id, floor: r.floor });
      this.pickables.push(tag);
      if (r.floor < 2 && r.kind !== "terrace") this.buildWalls(r, g);
      if (r.kind === "lounge") {
        this.box(g, 2.6, 0.65, 0.85, c.x - 0.8, 0.45, c.z - 0.7, "#5b775f");
        this.box(g, 2.6, 0.85, 0.18, c.x - 0.8, 0.65, c.z - 1.07, "#5b775f");
        this.box(g, 1.3, 0.4, 0.85, c.x, 0.25, c.z + 0.8, "#765c3d");
        this.box(
          g,
          0.6,
          1.1,
          0.6,
          c.x + 2,
          0.55,
          c.z - 1.2,
          "#775f43",
        ).userData = {
          kind: "object",
          id: "gramophone",
          floor: r.floor,
          room: r.id,
        };
        this.pickables.push(g.children.at(-1));
      }
      if (r.kind === "dining") {
        let table = this.box(g, 3, 0.6, 1.5, c.x, 0.5, c.z, "#8a6746");
        table.userData = {
          kind: "object",
          id: "figurines",
          floor: 0,
          room: r.id,
        };
        this.pickables.push(table);
        for (let i = 0; i < 10; i++) {
          let figurine = new THREE.Mesh(
            new THREE.ConeGeometry(0.055, 0.17, 7),
            this.material("#dfd1a2"),
          );
          figurine.position.set(c.x - 1.1 + i * 0.24, 0.91, c.z);
          g.add(figurine);
        }
        for (let x of [-1, 0, 1])
          for (let z of [-1.1, 1.1])
            this.box(g, 0.45, 0.5, 0.45, c.x + x, 0.28, c.z + z, "#657359");
      }
      if (r.kind === "kitchen") {
        this.box(
          g,
          0.8,
          0.85,
          r.h * SCALE - 0.8,
          c.x + (r.w * SCALE) / 2 - 0.6,
          0.48,
          c.z,
          "#9eaa90",
        );
        this.box(
          g,
          r.w * SCALE - 0.8,
          0.85,
          0.7,
          c.x,
          0.48,
          c.z - (r.h * SCALE) / 2 + 0.5,
          "#9eaa90",
        );
      }
      if (r.kind === "bedroom") {
        this.box(g, 1.5, 0.55, 2.1, c.x + 0.5, 0.38, c.z + 0.25, "#6d8063");
        this.box(g, 1.4, 0.18, 0.55, c.x + 0.5, 0.73, c.z - 0.5, "#dfdfc0");
        this.box(
          g,
          0.7,
          1.5,
          0.55,
          c.x - (r.w * SCALE) / 2 + 0.7,
          0.8,
          c.z - 1,
          "#8c7859",
        );
      }
      if (r.kind === "stairs") {
        for (let i = 0; i < 14; i++)
          this.box(
            g,
            1.35,
            ((i + 1) * LEVEL) / 14,
            0.15,
            (642 - 407) * SCALE,
            ((i + 1) * LEVEL) / 28,
            (337 - i * 3.7 - 295) * SCALE,
            "#a9b394",
          );
      }
      if (r.floor < 2 && !["terrace", "stairs", "corridor"].includes(r.kind)) {
        this.box(
          g,
          Math.min(2.6, r.w * SCALE * 0.55),
          0.025,
          Math.min(1.7, r.h * SCALE * 0.45),
          c.x,
          0.065,
          c.z,
          "#8d7966",
        );
        const bx = c.x - (r.w * SCALE) / 2 + 0.3,
          bz = c.z - (r.h * SCALE) / 2 + 0.6;
        this.box(g, 0.38, 1.6, 1.15, bx, 0.85, bz, "#7a654f");
        for (let shelf = 0; shelf < 3; shelf++)
          for (let book = 0; book < 6; book++)
            this.box(
              g,
              0.11,
              0.27,
              0.1,
              bx + 0.2,
              0.36 + shelf * 0.43,
              bz - 0.45 + book * 0.17,
              ["#727d78", "#a58665", "#6c6c83"][book % 3],
            );
        const lamp = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 0.32, 20),
          this.material("#e9d8ac"),
        );
        lamp.position.set(c.x + (r.w * SCALE) / 2 - 0.6, 1.43, c.z - 0.4);
        g.add(lamp);
        this.box(
          g,
          0.035,
          1.3,
          0.035,
          lamp.position.x,
          0.72,
          lamp.position.z,
          "#685a49",
        );
      }
      for (let o of g.children.slice(firstChild))
        if (!o.userData.kind)
          o.userData = { kind: "furniture", room: r.id, floor: r.floor };
    });
    // Door leaves use precisely the same openings as the navigation graph.
    for (let e of connections.filter((e) => !e.stairs && !e.outdoor)) {
      let a = roomById(e.a),
        p = threshold(e.a, e.b),
        q = world(p),
        side = p.x === a.x || p.x === a.x + a.w ? "x" : "z";
      q.y = 0;
      let leaf = this.box(
        this.floorGroups[a.floor],
        side === "x" ? 0.06 : 0.85,
        1.9,
        side === "x" ? 0.85 : 0.06,
        q.x,
        1,
        q.z,
        "#ae8d5c",
      );
      leaf.userData = { kind: "door", id: e.id, floor: a.floor, room: a.id };
      leaf.userData.rest = leaf.position.clone();
      leaf.userData.side = side;
      this.doors.push(leaf);
      this.pickables.push(leaf);
    }
    this.roof = new THREE.Group();
    this.scene.add(this.roof);
    this.box(this.roof, 18.3, 0.23, 11.2, 0, LEVEL * 2 + 0.08, -0.6, "#58695a");
    this.box(this.roof, 18.3, 0.48, 0.14, 0, LEVEL * 2 + 0.35, -6.1, "#768576");
    this.box(this.roof, 18.3, 0.48, 0.14, 0, LEVEL * 2 + 0.35, 4.95, "#768576");
    this.box(
      this.roof,
      0.14,
      0.48,
      11.2,
      -9.1,
      LEVEL * 2 + 0.35,
      -0.6,
      "#768576",
    );
    this.box(
      this.roof,
      0.14,
      0.48,
      11.2,
      9.1,
      LEVEL * 2 + 0.35,
      -0.6,
      "#768576",
    );
    this.box(this.roof, 1.1, 1.1, 0.9, -4, LEVEL * 2 + 0.65, -3, "#86937b");
    this.roof.children.forEach((m) => {
      m.userData = { kind: "roof" };
      this.pickables.push(m);
    });
    this.floorTags = [];
    for (let f = 0; f < 2; f++) {
      let t = this.label(
        f === 0 ? "01 / 公共空间" : "02 / 客房层",
        "#dce8c8",
        3.4,
      );
      t.position.set(-11, f * LEVEL + 1.8, 2);
      t.userData = { kind: "floor", floor: f };
      this.scene.add(t);
      this.floorTags.push(t);
      this.pickables.push(t);
    }
    people.forEach((p, i) => {
      let g = createCharacter(p[1], p[2]);
      let label = this.label(p[0], p[2], 1.5);
      label.position.y = 1.2;
      g.add(label);
      g.userData = { kind: "person", id: i };
      g.traverse((m) => {
        if (m.isMesh || m.isSprite) {
          m.userData = { kind: "person", id: i };
          this.pickables.push(m);
        }
      });
      this.scene.add(g);
      this.pawns.push(g);
    });
    this.routeGroup = new THREE.Group();
    this.scene.add(this.routeGroup);
  }
  buildWalls(r, g) {
    const height = 2.75,
      thick = 0.1;
    let sides = ["top", "bottom", "left", "right"];
    for (let side of sides) {
      let horizontal = side === "top" || side === "bottom",
        base = horizontal ? r.x : r.y,
        len = horizontal ? r.w : r.h,
        fixed =
          side === "top"
            ? r.y
            : side === "bottom"
              ? r.y + r.h
              : side === "left"
                ? r.x
                : r.x + r.w,
        holes = [];
      for (let e of connections.filter(
        (e) => (e.a === r.id || e.b === r.id) && !e.stairs && !e.outdoor,
      )) {
        let p = threshold(r.id, e.a === r.id ? e.b : e.a),
          on = horizontal ? p.z === fixed : p.x === fixed;
        if (on)
          holes.push({
            at: (horizontal ? p.x : p.z) - base,
            width: 32,
            height: 2.1,
            bottom: 0,
          });
      }
      for (let w of windows.filter((w) => w.room === r.id && w.side === side))
        holes.push({
          at: len * 0.5,
          width: 48,
          height: 1.05,
          bottom: 1,
          id: w.id,
        });
      holes.sort((a, b) => a.at - b.at);
      const outer =
        (side === "top" && r.y === 100) ||
        (side === "bottom" && r.y + r.h >= 405) ||
        (side === "left" && r.x === 100) ||
        (side === "right" && r.x + r.w >= 715);
      let wall = (start, width, y, h) => {
        if (width <= 0) return;
        let x = horizontal ? base + start + width / 2 : fixed,
          z = horizontal ? fixed : base + start + width / 2;
        let m = this.box(
          g,
          horizontal ? width * SCALE : thick,
          h,
          horizontal ? thick : width * SCALE,
          (x - 407) * SCALE,
          y,
          (z - 295) * SCALE,
          outer ? "#c3c7ad" : "#b1b79d",
        );
        m.userData = { kind: "wall", room: r.id, floor: r.floor, outer, side };
        this.walls.push(m);
        this.pickables.push(m);
      };
      let cursor = 0;
      for (let hole of holes) {
        let start = Math.max(cursor, hole.at - hole.width / 2),
          end = Math.min(len, hole.at + hole.width / 2);
        wall(cursor, start - cursor, height / 2, height);
        if (hole.bottom) wall(start, end - start, hole.bottom / 2, hole.bottom);
        wall(
          start,
          end - start,
          (height + hole.bottom + hole.height) / 2,
          height - hole.bottom - hole.height,
        );
        if (hole.id) {
          let x = horizontal ? base + hole.at : fixed,
            z = horizontal ? fixed : base + hole.at,
            win = this.box(
              g,
              horizontal ? hole.width * SCALE : 0.08,
              hole.height,
              horizontal ? 0.08 : hole.width * SCALE,
              (x - 407) * SCALE,
              hole.bottom + hole.height / 2,
              (z - 295) * SCALE,
              "#83b6b4",
              { transparent: true, opacity: 0.5, metalness: 0.3 },
            );
          const wx = (x - 407) * SCALE,
            wz = (z - 295) * SCALE,
            ww = hole.width * SCALE;
          for (const offset of [-ww / 2, 0, ww / 2])
            this.box(
              g,
              0.055,
              hole.height + 0.1,
              0.055,
              wx + (horizontal ? offset : 0),
              hole.bottom + hole.height / 2,
              wz + (horizontal ? 0 : offset),
              "#e0d7be",
            );
          for (const wy of [hole.bottom, hole.bottom + hole.height])
            this.box(
              g,
              horizontal ? ww + 0.15 : 0.18,
              0.055,
              horizontal ? 0.18 : ww + 0.15,
              wx,
              wy,
              wz,
              "#e0d7be",
            );
          win.userData = {
            kind: "window",
            id: hole.id,
            floor: r.floor,
            room: r.id,
          };
          this.pickables.push(win);
        }
        cursor = end;
      }
      wall(cursor, len - cursor, height / 2, height);
    }
  }
  floorOffset(f) {
    return f * LEVEL + (this.explode ? f * 4.6 : 0);
  }
  setState(state) {
    this.state = state;
    let { floor, focus, explode, cut, hideRoof, ghost, top } = state;
    let cameraChange =
      this.floor !== floor ||
      this.focus !== focus ||
      this.top !== top ||
      this.explode !== explode;
    Object.assign(this, { floor, focus, explode, cut, hideRoof, ghost, top });
    this.island.visible = floor < 0 || floor === 2;
    this.foundation.visible = floor < 0;
    this.floorGroups.forEach((g, f) => {
      g.position.y = this.floorOffset(f);
      g.visible = floor < 0 || floor === f || ghost;
      g.traverse((o) => {
        if (o.isMesh) {
          let other = floor >= 0 && floor !== f;
          o.material.transparent = other;
          o.material.opacity = other ? 0.12 : 1;
          o.material.depthWrite = !other;
        }
      });
    });
    for (let w of this.walls) {
      w.visible =
        !(cut && w.userData.outer) && (!focus || w.userData.room === focus);
      w.castShadow = !focus;
      if (focus) {
        w.material.transparent = true;
        w.material.opacity = 0.12;
        w.visible = w.visible && !["bottom", "right"].includes(w.userData.side);
        w.material.depthWrite = false;
      }
    }
    for (let [id, m] of this.roomMeshes) {
      m.visible =
        floor === 2 ? roomById(id).floor === 2 : !focus || id === focus;
      this.roomOutlines.get(id).visible = m.visible;
      m.material.color.set(
        id === state.selectedRoom
          ? "#c5ba85"
          : roomById(id).floor === 0
            ? "#b5ae88"
            : "#9ea88a",
      );
    }
    this.floorGroups.forEach((g) =>
      g.children.forEach((o) => {
        if (o.userData.kind === "furniture" || o.userData.kind === "object")
          o.visible =
            (!focus || o.userData.room === focus) &&
            (o.userData.kind !== "object" || state.revealObjects);
      }),
    );
    this.roof.visible = floor < 0 && !hideRoof && !focus;
    this.roof.position.y = explode ? 4.6 : 0;
    this.labels.forEach(
      ({ tag, room, floor: f }) =>
        (tag.visible = (floor === f || explode) && !focus),
    );
    this.floorTags.forEach((tag, f) => {
      tag.visible = floor < 0;
      tag.position.y = this.floorOffset(f) + 1.8;
    });
    for (let d of this.doors) {
      let env = nodeAt(state.plan, state.time).environment;
      let locked = env?.doors?.[d.userData.id] === "locked";
      d.rotation.y = locked ? 0 : Math.PI / 3;
      d.position.copy(d.userData.rest);
      if (!locked) {
        if (d.userData.side === "x") d.position.z += 0.3;
        else d.position.x += 0.3;
      }
      d.material.color.set(locked ? "#c07d68" : "#ae8d5c");
      d.visible =
        (!focus || d.userData.room === focus) &&
        (floor < 0 || floor === d.userData.floor);
    }
    for (let o of this.pickables.filter((o) => o.userData.kind === "window")) {
      let opened =
        nodeAt(state.plan, state.time).environment?.windows?.[o.userData.id] ===
        "open";
      o.material.color.set(opened ? "#b8dbaa" : "#83b6b4");
      o.material.opacity = opened ? 0.2 : 0.55;
      o.visible =
        (!focus || o.userData.room === focus) &&
        (floor < 0 || floor === o.userData.floor);
    }
    const routeKey = JSON.stringify([
      state.plan.routes,
      state.showTrails,
      explode,
      floor,
    ]);
    if (routeKey !== this.routeKey) {
      this.routeKey = routeKey;
      this.routeGroup.children.forEach((o) => {
        o.geometry.dispose();
        o.material.dispose();
      });
      this.routeGroup.clear();
      if (state.showTrails)
        for (let route of state.plan.routes) {
          let points = pathPoints(route).map((p) => {
            let v = world(p);
            v.y = this.floorOffset(p.floor) + 0.22;
            return v;
          });
          if (points.length > 1) {
            let line = new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(points),
              new THREE.LineBasicMaterial({
                color: people[route.person][2],
                transparent: true,
                opacity: 0.9,
              }),
            );
            this.routeGroup.add(line);
          }
        }
    }
    if (cameraChange) this.reset();
    this.updatePawns(state.plan, state.time);
  }
  updatePawns(plan, t) {
    let pos = positionsAt(plan, t);
    this.pawns.forEach((g, i) => {
      let p = pos[i],
        floor = p?.world?.floor || 0;
      g.visible =
        !!p?.world &&
        this.state.showPeople &&
        !(this.floor < 0 && !this.hideRoof && !this.explode) &&
        (this.floor < 0 ||
          (this.floor === 2 && roomById(p.room)?.floor === 2) ||
          (this.floor >= 0 &&
            this.floor < 2 &&
            Math.abs(floor - this.floor) < 0.55)) &&
        (!this.focus || p.room === this.focus);
      if (p?.world) {
        let v = world(p.world);
        v.y = this.floorOffset(p.world.floor) + 0.14;
        g.position.copy(v);
        g.rotation.y = ((p.angle || 0) * Math.PI) / 180;
      }
    });
  }
  reset() {
    let target = new THREE.Vector3(
        0,
        this.floor < 0
          ? 2.5
          : this.floorOffset(this.floor === 2 ? 0 : this.floor),
        0,
      ),
      size = this.floor < 0 ? (this.explode ? 23 : 18) : 14;
    if (this.focus) {
      target = world(center(this.focus));
      target.y = this.floorOffset(
        roomById(this.focus).floor === 2 ? 0 : roomById(this.focus).floor,
      );
      size =
        Math.max(roomById(this.focus).w, roomById(this.focus).h) * SCALE * 1.3;
    }
    size *= Math.max(1, 0.9 / (this.host.clientWidth / this.host.clientHeight));
    this.controls.target.copy(target);
    this.camera.position
      .copy(target)
      .add(
        this.top
          ? new THREE.Vector3(0, size * 1.65, 0.01)
          : new THREE.Vector3(
              size * 0.7,
              size * (this.focus ? 1.35 : 0.95),
              size * 0.85,
            ),
      );
    this.controls.enableRotate = !this.top;
    this.controls.update();
  }
  zoomBy(f) {
    this.camera.position
      .sub(this.controls.target)
      .multiplyScalar(f)
      .add(this.controls.target);
    this.controls.update();
  }
  rotate() {
    let offset = this.camera.position.clone().sub(this.controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }
  resize() {
    let w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  hits(e) {
    let rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    return this.ray.intersectObjects(this.pickables).filter((h) => {
      let o = h.object;
      while (o) {
        if (!o.visible) return false;
        o = o.parent;
      }
      return true;
    });
  }
  installEvents() {
    let down;
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", (e) => {
      down = { x: e.clientX, y: e.clientY };
      let hit = this.hits(e)[0];
      if (hit?.object.userData.kind === "person") {
        down.person = hit.object.userData.id;
        this.controls.enabled = false;
      }
    });
    el.addEventListener("pointerup", (e) => {
      if (!down) return;
      this.controls.enabled = true;
      let moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5,
        hits = this.hits(e);
      if (down.person !== undefined) {
        this.cb.onPerson(down.person);
        if (moved) {
          let room = hits.find((h) => h.object.userData.kind === "room");
          if (room)
            this.cb.onPlace(down.person, room.object.userData.room, room.point);
        }
      } else if (!moved) {
        let hit = hits[0];
        if (hit) {
          let d = hit.object.userData;
          if (d.kind === "roof") this.cb.onRoof();
          else if (d.kind === "floor" || (d.kind === "wall" && this.floor < 0))
            this.cb.onFloor(d.floor);
          else if (
            d.kind === "door" ||
            d.kind === "window" ||
            d.kind === "object"
          )
            this.cb.onObject(d);
          else if (d.kind === "room") {
            if (this.cb.getSelectedPerson() !== null && this.floor >= 0)
              this.cb.onPlace(this.cb.getSelectedPerson(), d.room, hit.point);
            else if (this.floor < 0) this.cb.onFloor(d.floor);
            else this.cb.onRoom(d.room);
          }
        }
      }
      down = null;
    });
    el.addEventListener("pointercancel", () => {
      down = null;
      this.controls.enabled = true;
    });
  }
}
