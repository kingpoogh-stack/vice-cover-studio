// Sample scene renderer for Vice Cover Studio — plain script, global THREE.
function gradientTexture(top, mid, bottom) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyPlane(tex, w, h, z) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.position.set(0, 0.32 * h, z);
  return mesh;
}

function box(w, h, d, color, x, y, z, opts) {
  opts = opts || {};
  const mat = new THREE.MeshLambertMaterial({ color: color });
  if (opts.emissive !== undefined) {
    mat.emissive = new THREE.Color(opts.emissive);
    mat.emissiveIntensity = opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1;
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  return mesh;
}

function basicBox(w, h, d, color, x, y, z, opts) {
  opts = opts || {};
  const mat = new THREE.MeshBasicMaterial({ color: color });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  return mesh;
}

function palmTree(x, z, s, lean) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6844 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 3.4 * s, 6), trunkMat);
  trunk.position.y = 1.7 * s;
  trunk.rotation.z = lean;
  group.add(trunk);
  const topX = -Math.sin(lean) * 3.4 * s;
  const topY = Math.cos(lean) * 3.4 * s;
  const frondMat = new THREE.MeshLambertMaterial({ color: 0x2e8b57, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.32 * s, 2.3 * s, 4), frondMat);
    frond.position.set(topX + Math.cos(angle) * 0.7 * s, topY + 0.25 * s, Math.sin(angle) * 0.7 * s);
    frond.rotation.z = Math.PI / 2.4;
    frond.rotation.y = -angle;
    group.add(frond);
  }
  const coconut = new THREE.Mesh(
    new THREE.SphereGeometry(0.28 * s, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2a })
  );
  coconut.position.set(topX, topY - 0.2 * s, 0);
  group.add(coconut);
  group.position.set(x, 0, z);
  return group;
}

function car(x, z, color, ry) {
  const group = new THREE.Group();
  group.add(box(2.3, 0.5, 1.05, color, 0, 0.45, 0));
  group.add(box(1.25, 0.42, 0.92, 0x1c2733, -0.1, 0.9, 0));
  group.add(box(2.34, 0.14, 1.08, 0x111111, 0, 0.18, 0));
  const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  [[0.78, 0.54], [0.78, -0.54], [-0.78, 0.54], [-0.78, -0.54]].forEach(function (pos) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(pos[0], 0.26, pos[1]);
    group.add(wheel);
  });
  const lightMat = new THREE.MeshLambertMaterial({ color: 0xfff2b0, emissive: 0xffdf8a, emissiveIntensity: 1.6 });
  [0.3, -0.3].forEach(function (lz) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.24), lightMat);
    hl.position.set(1.16, 0.52, lz);
    group.add(hl);
  });
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
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -16);
  scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 60), new THREE.MeshLambertMaterial({ color: 0x2e2a33 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, -16);
  scene.add(road);
  for (let i = 0; i < 7; i++) {
    scene.add(basicBox(0.28, 0.02, 1.7, 0xffe9a8, 0, 0.04, 2 - i * 6));
  }
  [-5.4, 5.4].forEach(function (sx) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 60), new THREE.MeshLambertMaterial({ color: 0xc9a189 }));
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(sx, 0.03, -16);
    scene.add(sw);
  });
  const palette = [0xf7c8d8, 0xa8d8ea, 0xfdebd3, 0xc3e6c0, 0xf9d976, 0xe6b8f0];
  for (let i = 0; i < 6; i++) {
    const z = -4 - 6.5 * i;
    const mod = i % 3;
    const leftH = 4.5 + mod * 1.6;
    const rightH = 7.7 - mod * 1.6;
    scene.add(box(4.6, leftH, 4, palette[i % palette.length], -10.5, leftH / 2, z));
    scene.add(box(4.6, rightH, 4, palette[(i + 3) % palette.length], 10.5, rightH / 2, z));
    scene.add(basicBox(4.8, 0.35, 4.2, 0xffffff, -10.5, leftH + 0.18, z));
    scene.add(basicBox(4.8, 0.35, 4.2, 0xffffff, 10.5, rightH + 0.18, z));
    for (let k = 0; k < 3; k++) {
      const wy = 1.2 + k * 1.3;
      if (wy < leftH - 0.4) scene.add(basicBox(0.55, 0.7, 0.06, 0xfff3b0, -8.15, wy, z - 1 + k * 0.9));
      if (wy < rightH - 0.4) scene.add(basicBox(0.55, 0.7, 0.06, 0xbfefff, 8.15, wy, z - 1 + k * 0.9));
    }
    scene.add(palmTree(-6.6, z + 1.5, 1.0, 0.06));
    scene.add(palmTree(6.6, z - 1.5, 1.05, -0.06));
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
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.4, -14);
  scene.add(water);
  for (let i = 0; i < 16; i++) {
    const wx = ((i * 37) % 60) - 30;
    const wz = -4 - ((i * 23) % 28);
    const ww = 1.4 + ((i * 13) % 10) / 10;
    scene.add(basicBox(ww, 0.02, 0.18, i % 2 === 0 ? 0x2ee6ff : 0xff7ac0, wx, -0.35, wz));
  }
  scene.add(box(6.4, 0.35, 30, 0x7d5a36, 0, 0.35, -10));
  for (let i = 0; i < 9; i++) {
    scene.add(box(6.6, 0.1, 0.16, 0x5d4126, 0, 0.55, 3 - i * 3.2));
  }
  for (let i = 0; i < 6; i++) {
    const pz = 2 - i * 5;
    scene.add(box(0.32, 1.6, 0.32, 0x4a341f, -2.8, -0.4, pz));
    scene.add(box(0.32, 1.6, 0.32, 0x4a341f, 2.8, -0.4, pz));
  }
  for (let side = 0; side < 2; side++) {
    const lx = side === 0 ? -2.9 : 2.9;
    for (let i = 0; i < 4; i++) {
      const lz = 1 - i * 7;
      scene.add(box(0.12, 2.6, 0.12, 0x222233, lx, 1.9, lz));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(lx, 3.25, lz);
      scene.add(bulb);
    }
  }
  const signColors = [0xff2d95, 0x2ee6ff, 0xffe14d, 0x7cff4d];
  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const sx = side * 4.6;
    const sz = -2 - i * 6;
    scene.add(box(2.4, 2.2, 2, 0x2a2140, sx, 1.4, sz));
    const bar1 = basicBox(1.9, 0.62, 0.08, signColors[i], sx - side * 1.25, 2.0, sz);
    bar1.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    // position sign on pier-facing side
    bar1.position.set(sx - side * 1.22, 2.0, sz);
    scene.add(bar1);
    const bar2 = basicBox(1.9, 0.2, 0.08, signColors[(i + 1) % 4], sx - side * 1.22, 1.25, sz);
    bar2.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(bar2);
  }
  const wheel = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const cabin = basicBox(0.62, 0.62, 0.3, i % 2 === 0 ? 0x2ee6ff : 0xffe14d, Math.cos(a) * 5.2, Math.sin(a) * 5.2, 0);
    wheel.add(cabin);
    const spoke = basicBox(0.09, 5.2, 0.09, 0xff7ac0, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0);
    spoke.rotation.z = a - Math.PI / 2;
    wheel.add(spoke);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  wheel.add(hub);
  wheel.position.set(-13, 6.4, -34);
  scene.add(wheel);
  const leg1 = box(0.3, 6.4, 0.3, 0x2a3350, -14.2, 3.2, -34, { rz: 0.22 });
  const leg2 = box(0.3, 6.4, 0.3, 0x2a3350, -11.8, 3.2, -34, { rz: -0.22 });
  scene.add(leg1); scene.add(leg2);
}

function boat(x, z, hullColor, sailColor, s) {
  const group = new THREE.Group();
  group.add(box(2.9 * s, 0.65 * s, 1.05 * s, hullColor, 0, 0.3 * s, 0));
  group.add(box(2.2 * s, 0.28 * s, 0.8 * s, 0xffffff, 0, 0.72 * s, 0));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 3.1 * s, 6), new THREE.MeshLambertMaterial({ color: 0x5a4632 }));
  mast.position.set(0.1 * s, 2.2 * s, 0);
  group.add(mast);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, 2.5 * s);
  shape.lineTo(1.35 * s, 0.25 * s);
  shape.lineTo(0, 0);
  const sailGeo = new THREE.ShapeGeometry(shape);
  const sail = new THREE.Mesh(sailGeo, new THREE.MeshLambertMaterial({ color: sailColor, side: THREE.DoubleSide }));
  sail.position.set(0.16 * s, 0.95 * s, 0);
  group.add(sail);
  group.position.set(x, -0.15, z);
  return group;
}

function buildHarbor(scene) {
  scene.background = new THREE.Color(0xe2703a);
  scene.add(skyPlane(gradientTexture('#7a2d5e', '#e2703a', '#ffc46b'), 190, 76, -48));
  const sun = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: 0xfff0b0 }));
  sun.position.set(4, 4.2, -45);
  scene.add(sun);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(190, 80), new THREE.MeshLambertMaterial({ color: 0x9a7a56 }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(0, -0.28, 0);
  scene.add(apron);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(190, 42), new THREE.MeshLambertMaterial({ color: 0x2a6a8a }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.25, -22);
  scene.add(water);
  for (let i = 0; i < 14; i++) {
    const wx = ((i * 41) % 70) - 35;
    const wz = -10 - ((i * 17) % 22);
    scene.add(basicBox(1.2 + ((i * 7) % 10) / 8, 0.02, 0.16, 0xffd98a, wx, -0.18, wz));
  }
  scene.add(box(46, 0.7, 7, 0x8a715a, 0, 0.1, 1.5));
  scene.add(box(11, 4.4, 5.5, 0xb0563a, -11, 2.65, -1.5));
  scene.add(box(11.6, 0.4, 6.1, 0x6e341f, -11, 5.02, -1.5));
  for (let i = 0; i < 4; i++) {
    scene.add(basicBox(0.9, 0.9, 0.06, 0xffe9a8, -14 + i * 2.2, 3.2, 1.28));
  }
  scene.add(box(0.4, 7, 0.4, 0x3a4a5a, 7.5, 3.9, -1));
  scene.add(box(6.5, 0.35, 0.35, 0x3a4a5a, 4.6, 7.3, -1));
  const cratePalette = [0xc98a3a, 0x7a9a5a, 0x5a7a9a, 0xb05a3a];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 4; i++) {
      scene.add(box(1.15, 1.15, 1.15, cratePalette[(i + row) % 4], 2.2 + i * 1.35, 0.85 + row * 1.2, 2.6));
    }
  }
  scene.add(boat(-4.5, -8.5, 0xd84a6a, 0xffffff, 1.15));
  scene.add(boat(3.5, -12.5, 0x2a7ab0, 0xffe9a8, 1.45));
  scene.add(boat(11, -8, 0x3aa06a, 0xffffff, 0.95));
  scene.add(boat(-12, -14, 0xe08a2a, 0xfff4d6, 1.3));
  [[-6, 8.5, -30], [2, 10, -32], [9, 9, -29]].forEach(function (pos) {
    const gull = new THREE.Group();
    const w1 = basicBox(1.1, 0.09, 0.09, 0x2b1a2e, -0.5, 0, 0, { rz: 0.35 });
    const w2 = basicBox(1.1, 0.09, 0.09, 0x2b1a2e, 0.5, 0, 0, { rz: -0.35 });
    gull.add(w1); gull.add(w2);
    gull.position.set(pos[0], pos[1], pos[2]);
    scene.add(gull);
  });
  scene.add(palmTree(15.5, 1.5, 1.1, -0.07));
  scene.add(palmTree(-17, 1, 1.0, 0.08));
}

function main() {
  const params = new URLSearchParams(window.location.search);
  const sceneName = params.get('scene') || 'boulevard';
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1280, 720);
  renderer.setPixelRatio(1);
  document.body.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 300);
  const scene = new THREE.Scene();
  if (sceneName === 'pier') {
    camera.position.set(0, 3.1, 10.5);
    camera.lookAt(0, 2.2, -14);
    scene.add(new THREE.HemisphereLight(0x8aa8ff, 0x1a1030, 0.85));
    const dir = new THREE.DirectionalLight(0xbcd2ff, 1.1);
    dir.position.set(6, 12, 6);
    scene.add(dir);
    const p1 = new THREE.PointLight(0xff2d95, 60, 30);
    p1.position.set(-4, 3, -4);
    scene.add(p1);
    const p2 = new THREE.PointLight(0x2ee6ff, 60, 30);
    p2.position.set(4, 3, -10);
    scene.add(p2);
    buildPier(scene);
  } else if (sceneName === 'harbor') {
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

try {
  main();
} catch (err) {
  window.__sceneError = err && err.stack ? err.stack : String(err);
  window.__sceneReady = true;
}
