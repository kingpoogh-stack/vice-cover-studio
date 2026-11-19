// Three.js sample scenes for Vice Cover Studio — real 3D geometry, lights, fog.
const params = new URLSearchParams(location.search);
const sceneName = params.get('scene') || 'boulevard';

function mat(color, opts = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts }); }
function box(w, h, d, color, opts) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)); m.castShadow = false; return m; }
function addPalm(scene, x, z, h, lean) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, h, 6), mat(0x4a3220));
  trunk.position.y = h / 2; trunk.rotation.z = lean || 0; g.add(trunk);
  const topX = -(lean || 0) * h * 0.5;
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshStandardMaterial({ color: 0x1d6b2f, side: THREE.DoubleSide, roughness: 1 }));
    const a = (i / 7) * Math.PI * 2;
    frond.position.set(topX + Math.cos(a) * 1.1, h + 0.15, Math.sin(a) * 1.1);
    frond.rotation.set(0.5, -a, 0.35);
    g.add(frond);
  }
  g.position.set(x, 0, z); scene.add(g);
}
function addBuilding(scene, x, z, w, h, d, color, winColor) {
  const b = box(w, h, d, color); b.position.set(x, h / 2, z); scene.add(b);
  const winMat = new THREE.MeshStandardMaterial({ color: winColor, emissive: winColor, emissiveIntensity: 1.4 });
  for (let fy = 1.2; fy < h - 0.6; fy += 1.4) {
    for (let fx = -w / 2 + 0.6; fx < w / 2 - 0.3; fx += 1.0) {
      if (((fx * 7 + fy * 13) % 3) === 0) continue;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), winMat);
      win.position.set(x + fx, fy, z + d / 2 + 0.02); scene.add(win);
    }
  }
}
function addCar(scene, x, z, color, ry) {
  const g = new THREE.Group();
  const body = box(2.2, 0.55, 1.0, color, { metalness: 0.5, roughness: 0.35 }); body.position.y = 0.5; g.add(body);
  const cab = box(1.15, 0.5, 0.9, 0x18222e, { metalness: 0.4, roughness: 0.2 }); cab.position.set(-0.1, 0.98, 0); g.add(cab);
  const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 12);
  [[-0.75, 0.5], [0.75, 0.5], [-0.75, -0.5], [0.75, -0.5]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelGeo, mat(0x111111)); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.26, wz); g.add(w);
  });
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.7), new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffdf80, emissiveIntensity: 2 }));
  light.position.set(1.12, 0.55, 0); g.add(light);
  g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g);
}
function skyDome(scene, topColor, midColor, botColor) {
  const geo = new THREE.SphereGeometry(220, 24, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color(topColor) }, mid: { value: new THREE.Color(midColor) }, bot: { value: new THREE.Color(botColor) } },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c = h>0.25 ? mix(mid,top,smoothstep(0.25,0.9,h)) : mix(bot,mid,smoothstep(-0.1,0.25,h)); gl_FragColor=vec4(c,1.0); }',
  });
  scene.add(new THREE.Mesh(geo, material));
}

function boulevard() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xff8c5a, 30, 160);
  skyDome(scene, 0x3b1d6e, 0xff5e7a, 0xffb347);
  const renderer = baseRenderer();
  scene.add(new THREE.AmbientLight(0xffc9a3, 0.7));
  const sun = new THREE.DirectionalLight(0xffa040, 1.6); sun.position.set(-30, 14, -40); scene.add(sun);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  sunBall.position.set(-55, 13, -110); scene.add(sunBall);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), mat(0x8a6a4a)); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
  const road = box(300, 0.06, 13, 0x2b2b33); road.position.set(0, 0.03, 2); scene.add(road);
  const median = box(300, 0.3, 1.2, 0xc9a06a); median.position.set(0, 0.15, 2); scene.add(median);
  for (let x = -70; x < 75; x += 7) { const dash = box(3, 0.02, 0.28, 0xfff3b0, { emissive: 0x665511 }); dash.position.set(x, 0.08, 5.6); scene.add(dash); }
  addBuilding(scene, -26, -22, 14, 22, 10, 0x5a3a6e, 0xffc46b);
  addBuilding(scene, -6, -26, 12, 30, 10, 0x3a2a5e, 0x9be8ff);
  addBuilding(scene, 16, -24, 13, 18, 10, 0x6e3a4a, 0xffd98a);
  addBuilding(scene, 38, -28, 16, 34, 12, 0x2e2450, 0xff9de2);
  addBuilding(scene, -44, -30, 12, 15, 10, 0x4a2a3a, 0xffe1a8);
  addBuilding(scene, 58, -24, 12, 20, 10, 0x503a2a, 0xa8fff0);
  for (let x = -34; x <= 36; x += 10) { addPalm(scene, x, -4.5, 6.5 + ((x * 7) % 3), 0.06); addPalm(scene, x + 4, 9.5, 6 + ((x * 5) % 2), -0.05); }
  addCar(scene, -8, 4.6, 0xe62e6b, 0); addCar(scene, 10, -0.4, 0x19b8d6, Math.PI); addCar(scene, 24, 4.6, 0xffb020, 0);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffdf9e, emissive: 0xffc46b, emissiveIntensity: 2 });
  for (let x = -40; x <= 44; x += 14) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), lampMat); lamp.position.set(x, 4.6, -5.4); scene.add(lamp); const pole = box(0.14, 4.6, 0.14, 0x222233); pole.position.set(x, 2.3, -5.4); scene.add(pole); }
  const camera = new THREE.PerspectiveCamera(55, 1280 / 960, 0.1, 500);
  camera.position.set(0, 4.2, 22); camera.lookAt(0, 5, -30);
  renderer.render(scene, camera);
  finish();
}

function pier() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a0b3a, 25, 140);
  skyDome(scene, 0x0a0630, 0x5b1160, 0xff4d8a);
  const renderer = baseRenderer();
  scene.add(new THREE.AmbientLight(0x7a6cff, 0.55));
  const moon = new THREE.DirectionalLight(0x9be8ff, 0.7); moon.position.set(20, 30, -20); scene.add(moon);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 160), new THREE.MeshStandardMaterial({ color: 0x0b2a5e, roughness: 0.25, metalness: 0.6 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.4, -50); scene.add(water);
  // reflection streaks
  for (let i = 0; i < 26; i++) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.5 + (i % 4) * 0.3, 3 + (i % 5)), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff2d9e : 0x19e0ff, transparent: true, opacity: 0.35 }));
    streak.rotation.x = -Math.PI / 2; streak.position.set(-30 + i * 2.5, -0.35, -18 - (i % 7) * 4); scene.add(streak);
  }
  const deck = box(70, 0.5, 11, 0x5e4028); deck.position.set(0, 0.6, 4); scene.add(deck);
  for (let x = -32; x <= 32; x += 4) { const plank = box(0.18, 0.56, 11, 0x3a2818); plank.position.set(x, 0.62, 4); scene.add(plank); }
  for (let x = -32; x <= 32; x += 4) { const post = box(0.22, 1.6, 0.22, 0x2e1f14); post.position.set(x, 1.4, -1.2); scene.add(post); const post2 = post.clone(); post2.position.z = 9.2; scene.add(post2); }
  const rail = box(68, 0.14, 0.14, 0x8a6a4a); rail.position.set(0, 2.1, -1.2); scene.add(rail);
  const rail2 = rail.clone(); rail2.position.z = 9.2; scene.add(rail2);
  // ferris wheel
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(11, 0.35, 10, 40), new THREE.MeshStandardMaterial({ color: 0xff2d9e, emissive: 0xff2d9e, emissiveIntensity: 1.2 }));
  wheel.add(rim);
  for (let i = 0; i < 8; i++) { const spoke = box(21, 0.22, 0.22, 0x19e0ff, { emissive: 0x19e0ff, emissiveIntensity: 0.9 }); spoke.rotation.z = (i / 8) * Math.PI; wheel.add(spoke); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const cab = box(1.6, 1.4, 1.2, 0xffc46b, { emissive: 0xff9d2e, emissiveIntensity: 0.8 }); cab.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0); wheel.add(cab); }
  wheel.position.set(26, 13, -34); scene.add(wheel);
  const tower = box(1.2, 13, 1.2, 0x1c1430); tower.position.set(26, 6.5, -34); scene.add(tower);
  // neon sign
  const sign = box(13, 3.2, 0.4, 0x140a2a, { emissive: 0xff2d9e, emissiveIntensity: 0.35 }); sign.position.set(-18, 5.4, -6); scene.add(sign);
  const signGlow = new THREE.PointLight(0xff2d9e, 2.2, 30); signGlow.position.set(-18, 5.4, 0); scene.add(signGlow);
  const cyanGlow = new THREE.PointLight(0x19e0ff, 1.8, 28); cyanGlow.position.set(8, 4, 2); scene.add(cyanGlow);
  for (let x = -30; x <= 30; x += 6) { const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffc46b, emissiveIntensity: 2.4 })); bulb.position.set(x, 3.1, -1.2); scene.add(bulb); }
  addPalm(scene, -28, 8, 7, 0.1); addPalm(scene, 30, 8.5, 6.4, -0.08);
  addCar(scene, -6, 4.5, 0x7a1fff, 0);
  const camera = new THREE.PerspectiveCamera(55, 1280 / 960, 0.1, 500);
  camera.position.set(-2, 4.6, 24); camera.lookAt(2, 6, -30);
  renderer.render(scene, camera);
  finish();
}

function harbor() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffb060, 35, 170);
  skyDome(scene, 0x4a5aa8, 0xff9a5a, 0xffe1a8);
  const renderer = baseRenderer();
  scene.add(new THREE.AmbientLight(0xffe1b0, 0.75));
  const sun = new THREE.DirectionalLight(0xffb050, 1.7); sun.position.set(25, 16, -50); scene.add(sun);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(5.5, 20, 20), new THREE.MeshBasicMaterial({ color: 0xfff3c4 }));
  sunBall.position.set(42, 11, -115); scene.add(sunBall);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(320, 200), new THREE.MeshStandardMaterial({ color: 0x1a5a7a, roughness: 0.3, metalness: 0.5 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.3, -40); scene.add(water);
  for (let i = 0; i < 30; i++) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.6 + (i % 3) * 0.4, 4 + (i % 6)), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.4 }));
    streak.rotation.x = -Math.PI / 2; streak.position.set(18 + (i % 8) * 2.2 - 8, -0.22, -14 - i * 1.6); scene.add(streak);
  }
  const dock = box(64, 0.6, 8, 0x6e4e30); dock.position.set(-4, 0.5, 6); scene.add(dock);
  for (let x = -34; x <= 28; x += 5) { const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.4, 8), mat(0x3a2818)); piling.position.set(x, -0.4, 9.6); scene.add(piling); }
  function boat(x, z, hullColor, sailColor, s) {
    const g = new THREE.Group();
    const hull = box(3.4 * s, 0.9 * s, 1.3 * s, hullColor, { metalness: 0.3, roughness: 0.4 }); hull.position.y = 0.3 * s; g.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 6.4 * s, 6), mat(0xd8d8d8)); mast.position.y = 3.6 * s; g.add(mast);
    const sailShape = new THREE.Shape(); sailShape.moveTo(0, 0); sailShape.lineTo(0, 5.4 * s); sailShape.lineTo(2.4 * s, 0.4 * s); sailShape.lineTo(0, 0);
    const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), new THREE.MeshStandardMaterial({ color: sailColor, side: THREE.DoubleSide, roughness: 0.9 }));
    sail.position.set(0.1 * s, 1.1 * s, 0); g.add(sail);
    g.position.set(x, 0, z); g.rotation.y = 0.3; scene.add(g);
  }
  boat(-16, -10, 0xffffff, 0xfff6e0, 1); boat(-4, -18, 0xe62e6b, 0xffffff, 1.25); boat(10, -12, 0x19b8d6, 0xffe9a8, 0.95); boat(24, -22, 0xffb020, 0xffffff, 1.4); boat(-26, -24, 0x2e7ad6, 0xfff6e0, 1.1);
  addBuilding(scene, -40, -52, 14, 20, 10, 0x6e5a4a, 0xffd98a);
  addBuilding(scene, -20, -56, 12, 26, 10, 0x5a4a6e, 0xffc46b);
  addBuilding(scene, 2, -54, 13, 17, 10, 0x7a5a3a, 0xffe1a8);
  addBuilding(scene, 24, -58, 15, 30, 12, 0x4a3a5e, 0x9be8ff);
  addBuilding(scene, 46, -52, 12, 21, 10, 0x6e3a3a, 0xffd98a);
  addPalm(scene, -30, 8, 7, 0.07); addPalm(scene, 22, 8.5, 6.6, -0.06); addPalm(scene, -12, 9, 6.2, 0.04);
  addCar(scene, 6, 6.5, 0xf5f0e6, 0);
  const camera = new THREE.PerspectiveCamera(55, 1280 / 960, 0.1, 500);
  camera.position.set(0, 5, 26); camera.lookAt(2, 5, -40);
  renderer.render(scene, camera);
  finish();
}

function baseRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1280, 960);
  renderer.setPixelRatio(1);
  document.body.appendChild(renderer.domElement);
  return renderer;
}
function finish() {
  requestAnimationFrame(() => { window.__sceneReady = true; });
}

if (sceneName === 'pier') pier();
else if (sceneName === 'harbor') harbor();
else boulevard();
