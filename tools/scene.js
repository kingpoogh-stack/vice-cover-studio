// Three.js sample scenes for Vice Cover Studio: boulevard, harbor, pier.
// Uses the global THREE loaded by scene.html. Renders a single 1280x720 frame.
(function () {
  const params = new URLSearchParams(location.search);
  const sceneName = params.get('scene') || 'boulevard';
  const WIDTH = 1280, HEIGHT = 720;

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(1);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, WIDTH / HEIGHT, 0.1, 500);

  function addSky(topColor, midColor, bottomColor) {
    const geo = new THREE.PlaneGeometry(400, 200);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color(topColor) }, mid: { value: new THREE.Color(midColor) }, bot: { value: new THREE.Color(bottomColor) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec2 vUv; void main(){ vec3 c = vUv.y>0.55 ? mix(mid,top,smoothstep(0.55,1.0,vUv.y)) : mix(bot,mid,smoothstep(0.0,0.55,vUv.y)); gl_FragColor=vec4(c,1.0); }',
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.position.set(0, 30, -120);
    scene.add(sky);
  }
  function addSun(x, y, z, color, size) {
    const sun = new THREE.Mesh(new THREE.CircleGeometry(size, 40), new THREE.MeshBasicMaterial({ color }));
    sun.position.set(x, y, z); scene.add(sun);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(size * 1.7, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 }));
    glow.position.set(x, y, z + 0.1); scene.add(glow);
  }
  function addBox(x, y, z, w, h, d, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    m.position.set(x, y, z); scene.add(m); return m;
  }
  function addPalm(x, z, s) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 7 * s, 6), new THREE.MeshStandardMaterial({ color: 0x7a5230 }));
    trunk.position.set(x, 3.5 * s, z); trunk.rotation.z = 0.08; scene.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(4.4 * s, 0.12 * s, 0.7 * s), new THREE.MeshStandardMaterial({ color: 0x1e7d46 }));
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(x + Math.cos(a) * 1.8 * s, 7.2 * s, z + Math.sin(a) * 1.8 * s);
      leaf.rotation.y = -a; leaf.rotation.z = -0.35; scene.add(leaf);
    }
  }
  function addCar(x, z, color) {
    addBox(x, 0.75, z, 4.2, 0.9, 1.9, color);
    addBox(x - 0.2, 1.45, z, 2.2, 0.7, 1.7, 0x18222e);
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]].forEach(([dx, dz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2; w.position.set(x + dx, 0.42, z + dz * 0.95); scene.add(w);
    });
  }
  function addLights(warm, cool) {
    scene.add(new THREE.HemisphereLight(warm, 0x1a0f24, 0.95));
    const dir = new THREE.DirectionalLight(cool, 1.6);
    dir.position.set(-18, 26, 14); scene.add(dir);
  }

  if (sceneName === 'harbor') {
    scene.fog = new THREE.Fog(0xe8a35c, 55, 170);
    addSky(0x3a4a7a, 0xe88a4a, 0xffd27a); addSun(26, 16, -110, 0xffdf8a, 11); addLights(0xffd9a0, 0xffb060);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 120), new THREE.MeshStandardMaterial({ color: 0x1d5f7a, roughness: 0.35, metalness: 0.4 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0, -20); scene.add(water);
    addBox(0, 1, 18, 300, 2, 26, 0x5a4632); // quay
    for (let i = 0; i < 5; i++) { // boats
      const bx = -38 + i * 18;
      addBox(bx, 1.2, -12 - (i % 2) * 9, 7, 1.6, 2.6, [0xd84a4a, 0xf2f2f2, 0x3a7bd8, 0xf2b13c, 0x39b27a][i]);
      addBox(bx, 3.4, -12 - (i % 2) * 9, 0.35, 4.6, 0.35, 0xdddddd);
      addBox(bx + 1.4, 4.6, -12 - (i % 2) * 9, 2.8, 0.15, 1.6, 0xffffff);
    }
    [-30, 22].forEach((cx) => { // cranes
      addBox(cx, 9, -26, 1.4, 18, 1.4, 0xc75b21);
      addBox(cx + 7, 17.5, -26, 16, 1.2, 1.2, 0xc75b21);
      addBox(cx + 13, 12, -26, 0.25, 10, 0.25, 0x333333);
    });
    for (let i = 0; i < 9; i++) addBox(-52 + i * 6, 0.9, 8, 4.6, 1.8, 2.4, [0x2e6f8e, 0xb84a32, 0x3f7d4e, 0x8e6f2e][i % 4]); // containers
    camera.position.set(0, 9, 42); camera.lookAt(0, 5, -20);
  } else if (sceneName === 'pier') {
    scene.fog = new THREE.Fog(0x40205e, 50, 165);
    addSky(0x1c1440, 0x8a2a6e, 0xff7a4a); addSun(-30, 10, -110, 0xff9a5c, 8); addLights(0xff9ad5, 0x7dd8ff);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(300, 90), new THREE.MeshStandardMaterial({ color: 0x6e4a2c, roughness: 0.95 }));
    board.rotation.x = -Math.PI / 2; board.position.set(0, 0, 5); scene.add(board);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 70), new THREE.MeshStandardMaterial({ color: 0x142c52, roughness: 0.3, metalness: 0.5 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.4, -65); scene.add(sea);
    // ferris wheel
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(11, 0.35, 8, 40), new THREE.MeshBasicMaterial({ color: 0xff5ee1 }));
    wheel.add(rim);
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.3, 21, 0.3), new THREE.MeshBasicMaterial({ color: 0x7df9ff }));
      spoke.rotation.z = (i / 8) * Math.PI; wheel.add(spoke);
      const a = (i / 8) * Math.PI * 2;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.5, 1.2), new THREE.MeshBasicMaterial({ color: [0xffd257, 0xff5e62, 0x7df9ff, 0xb28dff][i % 4] }));
      cab.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0); wheel.add(cab);
    }
    wheel.position.set(24, 13, -34); scene.add(wheel);
    addBox(24, 5, -35, 1.2, 10, 1.2, 0x444455);
    for (let i = 0; i < 7; i++) { // stalls with neon signs
      const sx = -46 + i * 11;
      addBox(sx, 2.4, -8, 7, 4.8, 5, [0x7a2a4a, 0x2a4a7a, 0x6e4a1e][i % 3]);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 0.25), new THREE.MeshBasicMaterial({ color: [0xff5ee1, 0x00e5ff, 0xffd257][i % 3] }));
      sign.position.set(sx, 5.6, -5.3); scene.add(sign);
    }
    for (let i = 0; i < 10; i++) { // string lights poles
      addBox(-50 + i * 10, 3, 8, 0.25, 6, 0.25, 0x332211);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd257 : 0xff5ee1 }));
      bulb.position.set(-50 + i * 10, 6.2, 8); scene.add(bulb);
    }
    addCar(-14, 12, 0x2222aa); addCar(6, 14, 0xcc2244);
    camera.position.set(0, 8, 44); camera.lookAt(0, 7, -18);
  } else {
    // boulevard
    scene.fog = new THREE.Fog(0xd86a4a, 55, 175);
    addSky(0x2e2a6e, 0xd84a6e, 0xffb35c); addSun(0, 15, -115, 0xffcf6e, 13); addLights(0xffc9a0, 0xff8a5c);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(34, 220), new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -30); scene.add(road);
    for (let i = 0; i < 12; i++) addBox(0, 0.06, 18 - i * 13, 0.7, 0.05, 5.5, 0xffd76e);
    [-22, 22].forEach((sx) => {
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(16, 220), new THREE.MeshStandardMaterial({ color: 0x8a6a52 }));
      walk.rotation.x = -Math.PI / 2; walk.position.set(sx, 0.02, -30); scene.add(walk);
    });
    for (let i = 0; i < 6; i++) {
      addPalm(-19, 14 - i * 16, 1); addPalm(19, 6 - i * 16, 1.1);
      addBox(-36, 7 + (i % 3) * 2, -6 - i * 17, 12, 14 + (i % 3) * 4, 10, [0x4a3555, 0x5c3a4a, 0x35505c][i % 3]);
      addBox(36, 8, -14 - i * 17, 12, 16, 10, [0x503a5c, 0x3a4a5c, 0x5c4a35][i % 3]);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.4, 2.2), new THREE.MeshBasicMaterial({ color: [0xff5ee1, 0x00e5ff, 0xffd257][i % 3] }));
      sign.position.set(-29.5, 8, -6 - i * 17); scene.add(sign);
    }
    addCar(-5, 10, 0xd8233a); addCar(5.5, -4, 0x2266cc); addCar(-5.5, -22, 0xf2a516);
    camera.position.set(0, 6.5, 38); camera.lookAt(0, 6, -30);
  }

  renderer.render(scene, camera);
  window.__sceneReady = true;
})();
