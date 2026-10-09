import * as T from "three";
// Role-based costume designs, not claims about clothing described in the novels.
export function costume(role = "", japanese = false) {
  if (/医生|村医/.test(role))
    return { type: "doctor", coat: "#eee9db", hair: "#4c3b32" };
  if (/警|刑|将军/.test(role))
    return { type: "uniform", coat: "#435765", hair: "#39322e" };
  if (/管家|用人|乳母/.test(role))
    return { type: "apron", coat: "#54545d", hair: "#443b33" };
  if (/法官/.test(role))
    return { type: "suit", coat: "#484152", hair: "#ddd2bc" };
  if (japanese && /妻|女|家族|户主|姐|妹/.test(role))
    return { type: "kimono", coat: "#8e6d7c", hair: "#302e32" };
  if (/冒险|青年/.test(role))
    return { type: "casual", coat: "#a17a4c", hair: "#573d2a" };
  return {
    type: japanese ? "kimono" : "suit",
    coat: japanese ? "#627c70" : "#73766b",
    hair: "#443b35",
  };
}
export function createCharacter(role, color, japanese = false) {
  const g = new T.Group(),
    c = costume(role, japanese);
  const add = (geo, col, x, y, z) => {
    const m = new T.Mesh(
      geo,
      new T.MeshStandardMaterial({ color: col, roughness: 0.85 }),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const box = (w, h, d, col, x, y, z) =>
    add(new T.BoxGeometry(w, h, d), col, x, y, z);
  add(new T.CylinderGeometry(0.28, 0.32, 0.09, 24), color, 0, 0.05, 0);
  for (const x of [-0.1, 0.1]) box(0.13, 0.14, 0.19, "#393438", x, 0.16, 0.04);
  add(new T.CylinderGeometry(0.17, 0.23, 0.37, 20), c.coat, 0, 0.4, 0);
  for (const x of [-0.24, 0.24]) {
    add(new T.SphereGeometry(0.075, 12, 8), "#e8c7ad", x, 0.32, 0.015);
    box(0.12, 0.25, 0.14, c.coat, x, 0.44, 0);
  }
  add(new T.SphereGeometry(0.26, 24, 16), "#efcfb3", 0, 0.84, 0);
  const hair = add(
    new T.SphereGeometry(0.268, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
    c.hair,
    0,
    0.86,
    0,
  );
  for (const x of [-0.085, 0.085]) {
    add(new T.SphereGeometry(0.023, 10, 8), "#343338", x, 0.84, 0.242);
    add(new T.SphereGeometry(0.029, 10, 8), "#db9e94", x * 1.7, 0.77, 0.216);
  }
  box(0.04, 0.016, 0.01, "#875c50", 0, 0.76, 0.259);
  if (c.type === "kimono") {
    const lapel = box(0.045, 0.31, 0.025, "#ece2c6", -0.035, 0.45, 0.181);
    lapel.rotation.z = 0.35;
    const other = box(0.045, 0.31, 0.025, "#ece2c6", 0.04, 0.45, 0.187);
    other.rotation.z = -0.35;
    box(0.39, 0.09, 0.36, color, 0, 0.31, 0);
  } else if (c.type === "apron") {
    box(0.28, 0.28, 0.025, "#e9e5d9", 0, 0.39, 0.19);
    box(0.055, 0.15, 0.025, "#e9e5d9", -0.11, 0.59, 0.16);
    box(0.055, 0.15, 0.025, "#e9e5d9", 0.11, 0.59, 0.16);
  } else {
    box(0.1, 0.27, 0.022, "#f2ead7", 0, 0.45, 0.177);
    box(0.035, 0.17, 0.03, color, 0, 0.43, 0.2);
  }
  if (c.type === "uniform") {
    add(new T.CylinderGeometry(0.23, 0.23, 0.07, 20), c.coat, 0, 1.075, 0);
    box(0.28, 0.025, 0.2, "#353b41", 0, 1.05, 0.12);
  }
  if (c.type === "doctor") {
    for (const x of [-0.1, 0.1]) {
      const lens = add(
        new T.TorusGeometry(0.055, 0.007, 6, 16),
        "#776e5f",
        x,
        0.86,
        0.25,
      );
    }
    box(0.08, 0.008, 0.01, "#776e5f", 0, 0.86, 0.26);
  }
  g.userData.costume = c.type;
  return g;
}
export function characterIcon(role, color, japanese = false) {
  const c = costume(role, japanese);
  return `<path d="M-10 9 Q-12 0 -6 -2 L6 -2 Q12 0 10 9Z" fill="${c.coat}" stroke="#334e55" stroke-width="1"/><path d="M-7 6H7" stroke="${color}" stroke-width="3"/><circle cy="-9" r="10" fill="#f0ceb1" stroke="#334e55" stroke-width="1"/><path d="M-10 -11 Q-8 -23 2 -19 Q10 -18 10 -10 Q3 -13 -2 -15Z" fill="${c.hair}"/><circle cx="-3" cy="-8" r="1" fill="#343338"/><circle cx="3" cy="-8" r="1" fill="#343338"/>`;
}
