function gradientTexture(top, mid, bottom) {
  var c = document.createElement('canvas');
  c.width = 64;
  c.height = 512;
  var g = c.getContext('2d');
  var grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, top);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 512);
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyPlane(tex, w, h, z) {
  var mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.position.set(0, 0.32 * h, z);
  return mesh;
}

function box(w, h, d, color, x, y, z, opts) {
  opts = opts || {};
  var mat = new THREE.MeshLambertMaterial({ color: color });
  if (opts.emissive !== undefined) {
    mat.emissive = new THREE.Color(opts.emissive);
    mat.emissiveIntensity = opts.ei !== undefined ? opts.ei : 1;
  }
  var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  return mesh;
}

function basicBox(w, h, d, color, x, y, z, opts) {
  opts = opts || {};
  var mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color: color })
  );
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  return mesh;
}

function palmTree(x, z, s, lean) {
  var group = new THREE.Group();
  var trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 3.4 * s, 6),
    new THREE.MeshLambertMaterial({ color: 0x8a6844 })
  );
  trunk.position.set(0, 1.7 * s, 0);
  trunk.rotation.z = lean;
  group.add(trunk);
  var topX = -Math.sin(lean) * 3.4 * s;
  for (var i = 0; i < 7; i++) {
    var a = (i / 7) * Math.PI * 2;
    var frond = new THREE.Mesh(
      new THREE.ConeGeometry(0.32 * s, 2.3 * s, 4),
      new THREE.MeshLambertMaterial({ color: 0x2e8b57, side: THREE.DoubleSide })
    );
    frond.position.set(topX + Math.cos(a) * 0.85 * s, 3.55 * s, Math.sin(a) * 0.85 * s);
    frond.rotation.z = Math.PI / 2.4;
    frond.rotation.y = -a;
    group.add(frond);
  }
  var coconut = new THREE.Mesh(
    new THREE.SphereGeometry(0.28 * s, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2a })
  );
  coconut.position.set(topX, 3.3 * s, 0);
  group.add(coconut);
  group.position.set(x, 0, z);
  return group;
}

function car(x, z, color, ry) {
  var group = new THREE.Group();
  group.add(box(2.3, 0.5, 1.05, color, 0, 0.45, 0));
  group.add(box(1.25, 0.42, 0.92, 0x1c2733, -0.1, 0.9, 0));
  group.add(box(2.34, 0.14, 1.08, 0x111111, 0, 0.18, 0));
  var wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 12);
  var wheelMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d });
  var positions = [[0.78, 0.54], [0.78, -0.54], [-0.78, 0.54], [-0.78, -0.54]];
  for (var i = 0; i < positions.length; i++) {
    var wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(positions[i][0], 0.26, positions[i][1]);
    group.add(wheel);
  }
  group.add(box(0.08, 0.12, 0.24, 0xfff2b0, 1.16, 0.52, 0.3, { emissive: 0xffdf8a, ei: 1.6 }));
  group.add(box(0.08, 0.12, 0.24, 0xfff2b0, 1.16, 0.52, -0.3, { emissive: 0xffdf8a, ei: 1.6 }));
  group.position.set(x, 0, z);
  group.rotation.y = ry || 0;
  return group;
}

function buildBoulevard(scene) {
  scene.background = new THREE.Color(0xd76d77);
  scene.add(skyPlane(gradientTexture('#3a1c71', '#d76d77', '#ffaf7b'), 190, 76, -48));
  var sun = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd98a })
  );
  sun.position.set(-7, 6.5, -45);
  scene.add(sun);
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 60),
    new THREE.MeshLambertMaterial({ color: 0x7a5a78 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -16);
  scene.add(ground);
  var road = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 60),
    new THREE.MeshLambertMaterial({ color: 0x2e2a33 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, -16);
  scene.add(road);
  for (var d = 0; d < 7; d++) {
    scene.add(basicBox(0.28, 0.02, 1.7, 0xffe9a8, 0, 0.045, 2 - d * 5.4));
  }
  [-5.4, 5.4].forEach(function (sx) {
    var walk = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 60),
      new THREE.MeshLambertMaterial({ color: 0xc9a189 })
    );
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(sx, 0.03, -16);
    scene.add(walk);
  });
  var palette = [0xf7c8d8, 0xa8d8ea, 0xfdebd3, 0xc3e6c0, 0xf9d976, 0xe6b8f0];
  for (var i = 0; i < 6; i++) {
    var z = -4 - i * 6.5;
    var hL = 4.5 + (i % 3) * 1.6;
    var hR = 5.2 + ((i + 1) % 3) * 1.4;
    scene.add(box(4.6, hL, 4, palette[i % 6], -10.5, hL / 2, z));
    scene.add(box(4.6, hR, 4, palette[(i + 2) % 6], 10.5, hR / 2, z - 2.5));
    scene.add(box(4.8, 0.35, 4.2, 0xffffff, -10.5, hL + 0.15, z));
    scene.add(box(4.8, 0.35, 4.2, 0xffffff, 10.5, hR + 0.15, z - 2.5));
    for (var f = 0; f < 3; f++) {
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
  var moon = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 32),
    new THREE.MeshBasicMaterial({ color: 0xeaf4ff })
  );
  moon.position.set(11, 9, -45);
  scene.add(moon);
  var water = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 60),
    new THREE.MeshLambertMaterial({ color: 0x0a2a52 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.4, -14);
  scene.add(water);
  for (var i = 0; i < 16; i++) {
    var col = i % 2 === 1 ? 0x2ee6ff : 0xff7ac0;
    scene.add(basicBox(1.4 + (i % 3) * 0.5, 0.03, 0.16, col, -18 + ((i * 2.37) % 36), -0.36, -2 - ((i * 1.93) % 22)));
  }
  scene.add(box(6.4, 0.35, 30, 0x7d5a36, 0, 0.35, -10));
  for (var p = 0; p < 9; p++) {
    scene.add(box(6.6, 0.1, 0.16, 0x5d4126, 0, 0.56, 3 - p * 3.2));
  }
  for (var q = 0; q < 6; q++) {
    scene.add(box(0.32, 1.6, 0.32, 0x4a341f, 2.8, -0.3, 2 - q * 4.4));
    scene.add(box(0.32, 1.6, 0.32, 0x4a341f, -2.8, -0.3, 2 - q * 4.4));
  }
  for (var l = 0; l < 4; l++) {
    var lz = 1.5 - l * 6;
    [-2.9, 2.9].forEach(function (lx) {
      scene.add(box(0.12, 2.6, 0.12, 0x222233, lx, 1.8, lz));
      var bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xffe9a8 })
      );
      bulb.position.set(lx, 3.25, lz);
      scene.add(bulb);
    });
  }
  var neon = [0xff2d95, 0x2ee6ff, 0xffe14d, 0x7cff4d];
  for (var s = 0; s < 4; s++) {
    var side = s % 2 === 0 ? -4.6 : 4.6;
    var sz = -1 - s * 5.2;
    scene.add(box(2.4, 2.2, 2, 0x2a2140, side, 1.6, sz));
    var signX = side < 0 ? side + 1.32 : side - 1.32;
    var signRy = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(basicBox(1.9, 0.62, 0.08, neon[s], signX, 2.2, sz, { ry: signRy }));
    scene.add(basicBox(1.9, 0.2, 0.08, neon[(s + 1) % 4], signX, 1.55, sz, { ry: signRy }));
  }
  var wheel = new THREE.Group();
  for (var w = 0; w < 14; w++) {
    var a = (w / 14) * Math.PI * 2;
    var cabinColor = w % 2 === 0 ? 0x2ee6ff : 0xffe14d;
    wheel.add(basicBox(0.62, 0.62, 0.3, cabinColor, Math.cos(a) * 5.2, Math.sin(a) * 5.2, 0));
    wheel.add(basicBox(0.09, 5.2, 0.09, 0xff7ac0, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0, { rz: a - Math.PI / 2 }));
  }
  var hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  wheel.add(hub);
  wheel.position.set(-13, 6.4, -34);
  scene.add(wheel);
  scene.add(box(0.3, 6.4, 0.3, 0x2a3350, -14.6, 3.2, -34, { rz: 0.22 }));
  scene.add(box(0.3, 6.4, 0.3, 0x2a3350, -11.4, 3.2, -34, { rz: -0.22 }));
}

function boat(x, z, hullColor, sailColor, s) {
  var group = new THREE.Group();
  group.add(box(2.9 * s, 0.65 * s, 1.05 * s, hullColor, 0, 0.3 * s, 0));
  group.add(box(2.2 * s, 0.28 * s, 0.8 * s, 0xffffff, 0, 0.72 * s, 0));
  var mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 3.1 * s, 6),
    new THREE.MeshLambertMaterial({ color: 0x5a4632 })
  );
  mast.position.set(0.1 * s, 2.2 * s, 0);
  group.add(mast);
  var shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, 2.5 * s);
  shape.lineTo(1.35 * s, 0.25 * s);
  shape.lineTo(0, 0);
  var sail = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshLambertMaterial({ color: sailColor, side: THREE.DoubleSide })
  );
  sail.position.set(0.16 * s, 0.95 * s, 0);
  group.add(sail);
  group.position.set(x, -0.15, z);
  return group;
}

function buildHarbor(scene) {
  scene.background = new THREE.Color(0xe2703a);
  scene.add(skyPlane(gradientTexture('#7a2d5e', '#e2703a', '#ffc46b'), 190, 76, -48));
  var sun = new THREE.Mesh(
    new THREE.CircleGeometry(3, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff0b0 })
  );
  sun.position.set(4, 4.2, -45);
  scene.add(sun);
  var apron = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 80),
    new THREE.MeshLambertMaterial({ color: 0x9a7a56 })
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(0, -0.28, -6);
  scene.add(apron);
  var water = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 42),
    new THREE.MeshLambertMaterial({ color: 0x2a6a8a })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.25, -22);
  scene.add(water);
  for (var i = 0; i < 14; i++) {
    scene.add(basicBox(1.8 + (i % 3) * 0.7, 0.03, 0.18, 0xffd98a, -20 + ((i * 3.1) % 40), -0.2, -8 - ((i * 1.7) % 20)));
  }
  scene.add(box(46, 0.7, 7, 0x8a715a, 0, 0.1, 1.5));
  scene.add(box(11, 4.4, 5.5, 0xb0563a, -11, 2.65, -1.5));
  scene.add(box(11.6, 0.4, 6.1, 0x6e341f, -11, 5.02, -1.5));
  for (var wn = 0; wn < 4; wn++) {
    scene.add(basicBox(1.1, 1.1, 0.07, 0xffe9a8, -14.6 + wn * 2.4, 3.2, 1.28));
  }
  scene.add(box(0.4, 7, 0.4, 0x3a4a5a, 7.5, 3.9, -1));
  scene.add(box(6.5, 0.35, 0.35, 0x3a4a5a, 4.6, 7.3, -1));
  var cratePalette = [0xc98a3a, 0x7a9a5a, 0x5a7a9a, 0xb05a3a];
  for (var cr = 0; cr < 8; cr++) {
    scene.add(box(1.15, 1.15, 1.15, cratePalette[cr % 4], 2.2 + (cr % 4) * 1.35, 1.02 + Math.floor(cr / 4) * 1.18, 2.6));
  }
  scene.add(boat(-4.5, -8.5, 0xd84a6a, 0xffffff, 1.15));
  scene.add(boat(3.5, -12.5, 0x2a7ab0, 0xffe9a8, 1.45));
  scene.add(boat(11, -8, 0x3aa06a, 0xffffff, 0.95));
  scene.add(boat(-12, -14, 0xe08a2a, 0xfff4d6, 1.3));
  var gullPts = [[-6, 8.5, -30], [2, 10, -32], [9, 9, -29]];
  for (var gi = 0; gi < gullPts.length; gi++) {
    var gp = gullPts[gi];
    scene.add(basicBox(1.1, 0.09, 0.09, 0x2b1a2e, gp[0], gp[1], gp[2], { rz: 0.35 }));
    scene.add(basicBox(1.1, 0.09, 0.09, 0x2b1a2e, gp[0] + 0.95, gp[1], gp[2], { rz: -0.35 }));
  }
  scene.add(palmTree(15.5, 1.5, 1.1, -0.07));
  scene.add(palmTree(-17, 1, 1.0, 0.08));
}

function main() {
  var params = new URLSearchParams(window.location.search);
  var sceneName = params.get('scene') || 'boulevard';
  var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1280, 720);
  renderer.setPixelRatio(1);
  document.body.appendChild(renderer.domElement);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 300);
  if (sceneName === 'pier') {
    camera.position.set(0, 3.1, 10.5);
    camera.lookAt(0, 2.2, -14);
    scene.add(new THREE.HemisphereLight(0x8aa8ff, 0x1a1030, 0.85));
    var dl = new THREE.DirectionalLight(0xbcd2ff, 1.1);
    dl.position.set(6, 12, 6);
    scene.add(dl);
    var p1 = new THREE.PointLight(0xff2d95, 60, 30);
    p1.position.set(-4, 3, -4);
    scene.add(p1);
    var p2 = new THREE.PointLight(0x2ee6ff, 60, 30);
    p2.position.set(4, 3, -10);
    scene.add(p2);
    buildPier(scene);
  } else if (sceneName === 'harbor') {
    camera.position.set(0, 3.4, 12.5);
    camera.lookAt(0, 2.4, -12);
    scene.add(new THREE.HemisphereLight(0xffd9a0, 0x4a2c14, 1.0));
    var dh = new THREE.DirectionalLight(0xffc46b, 2.0);
    dh.position.set(5, 9, -6);
    scene.add(dh);
    buildHarbor(scene);
  } else {
    camera.position.set(0, 2.6, 11.5);
    camera.lookAt(0, 2.6, -14);
    scene.add(new THREE.HemisphereLight(0xffd9c0, 0x5a2c4a, 1.0));
    var db = new THREE.DirectionalLight(0xffb27a, 1.9);
    db.position.set(-6, 12, 4);
    scene.add(db);
    buildBoulevard(scene);
  }
  renderer.render(scene, camera);
  window.__sceneReady = true;
}

try {
  main();
} catch (err) {
  window.__sceneError = err && err.stack ? String(err.stack) : String(err);
  window.__sceneReady = true;
}
