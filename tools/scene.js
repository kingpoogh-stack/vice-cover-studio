// Deterministic low-poly sample scenes for Vice Cover Studio.
// Each scene is a fixed camera composition rendered once at 1280x720.

function gradientTexture(top, mid, bottom) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, top);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyPlane(tex, w, h, z) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.position.set(0, h * 0.32, z);
  return mesh;
}

function box(w, h, d, color, x, y, z, opts) {
  const mat = new THREE.MeshLambertMaterial({ color: color });
  if (opts && opts.emissive) { mat.emissive = new THREE.Color(opts.emissive); mat.emissiveIntensity = opts.ei || 1; }
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (opts && opts.ry) m.rotation.y = opts.ry;
  if (opts && opts.rz) m.rotation.z = opts.rz;
  if (opts && opts.rx) m.rotation.x = opts.rx;
  return m;
}

function basicBox(w, h, d, color, x, y, z, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: color }));
  m.position.set(x, y, z);
  if (opts && opts.ry) m.rotation.y = opts.ry;
  if (opts && opts.rz) m.rotation.z = opts.rz;
  if (opts && opts.rx) m.rotation.x = opts.rx;
  return m;
}

function palmTree(x, z, s, lean) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6844 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 3.4 * s, 6), trunkMat);
  trunk.position.y = 1.7 * s;
  trunk.rotation.z = lean;
  group.add(trunk);
  const topX = -Math.sin(lean) * 3.4 * s;
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8b57, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.32 * s, 2.3 * s, 4), leafMat);
    frond.position.set(topX + Math.cos(a) * 0.85 * s, 3.55 * s, Math.sin(a) * 0.85 * s);
    frond.rotation.z = Math.PI / 2.4;
    frond.rotation.y = -a;
    group.add(frond);
  }
  const nutMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  const nut = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 8, 6), nutMat);
  nut.position.set(topX, 3.3 * s, 0);
  group.add(nut);
  group.position.set(x, 0, z);
  return group;
}

function car(x, z, color, ry) {
  const group = new THREE.Group();
  group.add(box(2.3, 0.5, 1.05, color, 0, 0.45, 0));
  group.add(box(1.25, 0.42, 0.92, 0x1c2733, -0.1, 0.9, 0));
  group.add(box(2.34, 0.14, 1.08, 0x111111, 0, 0.18, 0));
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d });
  [[-0.78, 0.54], [0.78, 0.54], [-0.78, -0.54], [0.78, -0.54]].forEach(function (p) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 12), wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(p[0], 0.26, p[1]);
    group.add(wheel);
  });
  const lightMat = { emissive: 0xffdf8a, ei: 1.6 };
  group.add(box(0.08, 0.12, 0.24, 0xfff2b0, 1.16, 0.52, 0.3, lightMat));
  group.add(box(0.08, 0.12, 0.24, 0xfff2b0, 1.16, 0.52, -0.3, lightMat));
  group.position.set(x, 0, z);
  group.rotation.y = ry || 0;
  return group;
}

function buildBoulevard(scene) {
  scene.background = new THREE.Color(0xd76d77);
  scene.add(skyPlane(gradientTexture('#3a1c71', '#d76d77', '#ffaf7b'), 190, 76, -48));
  const sun = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), new THREE.MeshBasicMaterial({ color: 0xffd98a }));
  sun.position.set(-7, 6.5, -45);
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(190, 60), new THREE.MeshLambertMaterial({ color: 0x7a5a78 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -16;
  scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 60), new THREE.MeshLambertMaterial({ color: 0x2e2a33 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, -16);
  scene.add(road);
  for (let i = 0; i < 7; i++) {
    scene.add(basicBox(0.28, 0.02, 1.7, 0xffe9a8, 0, 0.045, 2 - i * 5.4));
  }
  const walkMat = new THREE.MeshLambertMaterial({ color: 0xc9a189 });
  [-5.4, 5.4].forEach(function (x) {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 60), walkMat);
    walk.rotation.x = -Math.PI / 2; walk.position.set(x, 0.03, -16);
    scene.add(walk);
  });
  const palette = [0xf7c8d8, 0xa8d8ea, 0xfdebd3, 0xc3e6c0, 0xf9d976, 0xe6b8f0];
  for (let i = 0; i < 6; i++) {
    const z = -4 - i * 6.5;
    const hL = 4.5 + (i % 3) * 1.6;
    const hR = 5.2 + ((i + 1) % 3) * 1.4;
    scene.add(box(4.6, hL, 4, palette[i % 6], -10.5, hL / 2, z));
    scene.add(box(4.6, hR, 4, palette[(i + 2) % 6], 10.5, hR / 2, z - 2.5));
    scene.add(box(4.8, 0.35, 4.2, 0xffffff, -10.5, hL + 0.15, z));
    scene.add(box(4.8, 0.35, 4.2, 0xffffff, 10.5, hR + 0.15, z - 2.5));
    for (let f = 0; f < 3; f++) {
      scene.add(basicBox(0.55, 0.7, 0.06, 0xfff3b0, -11.6 + (f % 2) * 1.6, 1.4 + f * 1.3, z + 2.03));
      scene.add(basicBox(0.55, 0.7, 0.06, 0xbfefff, 9.4 + (f % 2) * 1.6, 1.6 + f * 1.3, z - 0.47));
    }
    scene.add(palmTree(-6.6, z + 1.5, 1.05, 0.09));
    scene.add(palmTree(6.6, z - 1, 0.95, -0.08));
  }
  scene.add(car(1.4, -3.5, 0xff5da2, 0.04));
  scene.add(car(-1.7, -11, 0x2ee6ff, -0.03));
  scene.add(car(1.2, -19, 0xffb03a, 0.02));
}

function buildPier(scene) {
  scene.background = new THREE.Color(0x0a1440);
  scene.add(skyPlane(gradientTexture('#02021a', '#0a1440', '#123a6e'), 190, 76, -48));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32), new THREE.MeshBasicMaterial({ color: 0xeaf4ff }));
  moon.position.set(11, 9, -45);
  scene.add(moon);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(190, 60), new THREE.MeshLambertMaterial({ color: 0x0a2a52 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.4, -14);
  scene.add(water);
  for (let i = 0; i < 16; i++) {
    const sx = -18 + (i * 2.37) % 36;
    const sz = -2 - (i * 1.93) % 22;
    scene.add(basicBox(1.4 + (i % 3) * 0.5, 0.03, 0.16, i % 2 ? 0x2ee6ff : 0xff7ac0, sx, -0.36, sz));
  }
  const deckMat = new THREE.MeshLambertMaterial({ color: 0x7d5a36 });
  const deck = box(6.4, 0.35, 30, 0x7d5a36, 0, 0.35, -10);
  scene.add(deck);
  for (let i = 0; i < 9; i++) {
    scene.add(box(6.6, 0.1, 0.16, 0x5d4126, 0, 0.56, 3 - i * 3.2));
  }
  for (let i = 0; i < 6; i++) {
    scene.add(box(0.32, 1.6, 0.32, 0x4a341f, -2.8, -0.3, 2 - i * 4.4));
    scene.add(box(0.32, 1.6, 0.32, 0x4a341f, 2.8, -0.3, 2 - i * 4.4));
  }
  // Lamp posts with glowing spheres.
  for (let i = 0; i < 4; i++) {
    const z = 1.5 - i * 6;
    [-2.9, 2.9].forEach(function (x) {
      scene.add(box(0.12, 2.6, 0.12, 0x222233, x, 1.8, z));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(x, 3.25, z);
      scene.add(bulb);
    });
  }
  // Neon signs on stalls.
  const neon = [0xff2d95, 0x2ee6ff, 0xffe14d, 0x7cff4d];
  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? -4.6 : 4.6;
    const z = -1 - i * 5.2;
    scene.add(box(2.4, 2.2, 2, 0x2a2140, side, 1.6, z));
    scene.add(basicBox(1.9, 0.62, 0.08, neon[i], side + (side < 0 ? 1.32 : -1.32), 2.2, z, { ry: side < 0 ? Math.PI / 2 : -Math.PI / 2 }));
    scene.add(basicBox(1.9, 0.2, 0.08, neon[(i + 1) % 4], side + (side < 0 ? 1.32 : -1.32), 1.55, z, { ry: side < 0 ? Math.PI / 2 : -Math.PI / 2 }));
  }
  // Ferris wheel ring in the distance.
  const wheel = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff7ac0 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.3), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2ee6ff : 0xffe14d }));
    cab.position.set(Math.cos(a) * 5.2, Math.sin(a) * 5.2, 0);
    wheel.add(cab);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.09, 5.2, 0.09), ringMat);
    spoke.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0);
    spoke.rotation.z = a - Math.PI / 2;
    wheel.add(spoke);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  wheel.add(hub);
  wheel.position.set(-13, 6.4, -34);
  scene.add(wheel);
  scene.add(box(0.3, 6.4, 0.3, 0x334, -14.6, 3.2, -34, { rz: 0.22 }));
  scene.add(box(0.3, 6.4, 0.3, 0x333344, -11.4, 3.2, -34, { rz: -0.22 }));
}

function buildHarbor(scene) {
  scene.background = new THREE.Color(0xe2703a);
  scene.add(skyPlane(gradientTexture('#7a2d5e', '#e2703a', '#ffc46b'), 190, 76, -48));
  const sun = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: 0xfff0b0 }));
  sun.position.set(4, 4.2, -45);
  scene.add(sun);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(190, 80), new THREE.MeshLambertMaterial({ color: 0x9a7a56 }));
  apron.rotation.x = -Math.PI / 2; apron.position.set(0, -0.28, -6);
  scene.add(apron);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(190, 42), new THREE.MeshLambertMaterial({ color: 0x2a6a8a }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.25, -22);
  scene.add(water);
  for (let i = 0; i < 14; i++) {
    const sx = -20 + (i * 3.1) % 40;
    const sz = -8 - (i * 1.7) % 20;
    scene.add(basicBox(1.8 + (i % 3) * 0.7, 0.03, 0.18, 0xffd98a, sx, -0.2, sz));
  }
  const quay = box(46, 0.7, 7, 0x8a715a, 0, 0.1, 1.5);
  scene.add(quay);
  // Warehouse.
  scene.add(box(11, 4.4, 5.5, 0xb0563a, -11, 2.65, -1.5));
  scene.add(box(11.6, 0.4, 6.1, 0x6e341f, -11, 5.02, -1.5));
  for (let i = 0; i < 4; i++) scene.add(basicBox(1.1, 1.1, 0.07, 0xffe9a8, -14.6 + i * 2.4, 3.2, 1.28));
  // Cranes.
  scene.add(box(0.4, 7, 0.4, 0x3a4a5a, 7.5, 3.9, -1));
  scene.add(box(6.5, 0.35, 0.35, 0x3a4a5a, 4.6, 7.3, -1));
  // Crates.
  const crateCols = [0xc98a3a, 0x7a9a5a, 0x5a7a9a, 0xb05a3a];
  for (let i = 0; i < 8; i++) {
    scene.add(box(1.15, 1.15, 1.15, crateCols[i % 4], 2.2 + (i % 4) * 1.35, 1.02 + Math.floor(i / 4) * 1.18, 2.6));
  }
  // Boats.
  function boat(x, z, hullColor, sailColor, s) {
    const g = new THREE.Group();
    const hull = box(2.9 * s, 0.65 * s, 1.05 * s, hullColor, 0, 0.3 * s, 0);
    g.add(hull);
    g.add(box(2.2 * s, 0.28 * s, 0.8 * s, 0xffffff, 0, 0.72 * s, 0));
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 3.1 * s, 6), new THREE.MeshLambertMaterial({ color: 0x5a4632 }));
    mast.position.set(0.1 * s, 2.2 * s, 0);
    g.add(mast);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(0, 2.5 * s); shape.lineTo(1.35 * s, 0.25 * s); shape.lineTo(0, 0);
    const sail = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshLambertMaterial({ color: sailColor, side: THREE.DoubleSide }));
    sail.position.set(0.16 * s, 0.95 * s, 0);
    g.add(sail);
    g.position.set(x, -0.15, z);
    return g;
  }
  scene.add(boat(-4.5, -8.5, 0xd84a6a, 0xffffff, 1.15));
  scene.add(boat(3.5, -12.5, 0x2a7ab0, 0xffe9a8, 1.45));
  scene.add(boat(11, -8, 0x3aa06a, 0xffffff, 0.95));
  scene.add(boat(-12, -14, 0xe08a2a, 0xfff4d6, 1.3));
  // Gull silhouettes.
  const gullMat = new THREE.MeshBasicMaterial({ color: 0x2b1a2e });
  [[-6, 8.5, -30], [2, 10, -32], [9, 9, -29]].forEach(function (p) {
    const gull = basicBox(1.1, 0.09, 0.09, 0x2b1a2e, p[0], p[1], p[2], { rz: 0.35 });
    scene.add(gull);
    scene.add(basicBox(1.1, 0.09, 0.09, 0x2b1a2e, p[0] + 0.95, p[1], p[2], { rz: -0.35 }));
  });
  scene.add(palmTree(15.5, 1.5, 1.1, -0.07));
  scene.add(palmTree(-17, 1, 1.0, 0.08));
}

function main() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('scene') || 'boulevard';
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1280, 720);
  renderer.setPixelRatio(1);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 300);
  if (name === 'pier') {
    camera.position.set(0, 3.1, 10.5);
    camera.lookAt(0, 2.2, -14);
    scene.add(new THREE.HemisphereLight(0x8aa8ff, 0x1a1030, 0.85));
    const dir = new THREE.DirectionalLight(0xbcd2ff, 1.1);
    dir.position.set(6, 12, 6);
    scene.add(dir);
    const pink = new THREE.PointLight(0xff2d95, 60, 30);
    pink.position.set(-4, 3, -4);
    scene.add(pink);
    const cyan = new THREE.PointLight(0x2ee6ff, 60, 30);
    cyan.position.set(4, 3, -10);
    scene.add(cyan);
    buildPier(scene);
  } else if (name === 'harbor') {
    camera.position.set(0, 3.4, 12.5);
    camera.lookAt(0, 2.4, -12);
    scene.add(new THREE.HemisphereLight(0xffd9a0, 0x4a2c14, 1.0));
    const dir = new THREE.DirectionalLight(0xffc46b, 2.0);
    dir.position.set(5, 9, -6);
    scene.add(dir);
    buildHarbor(scene);
  } else {
    camera.position.set(0, 2.6, 11.5);
    camera.lookAt(0, 2.6, -14);
    scene.add(new THREE.HemisphereLight(0xffd9c0, 0x5a2c4a, 1.0));
    const dir = new THREE.DirectionalLight(0xffb27a, 1.9);
    dir.position.set(-6, 12, 4);
    scene.add(dir);
    buildBoulevard(scene);
  }
  renderer.render(scene, camera);
  window.__sceneReady = true;
}

try { main(); } catch (err) {
  window.__sceneError = String(err && err.stack || err);
  window.__sceneReady = true;
}
