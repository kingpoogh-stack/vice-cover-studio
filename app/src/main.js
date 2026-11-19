import { drawCover, hitTestPanel, LAYOUTS } from './cover.js';
import { parseShot } from './shots.js';

const SAMPLES = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
  harbor: 'samples/harbor.jpg',
};

const shot = parseShot();
const isCoverShot = shot.mode === 'cover';
const isEditorShot = shot.mode === 'editor';

const state = {
  layout: shot.layout && LAYOUTS[shot.layout] ? shot.layout : 'classic',
  grade: shot.grade || 'sunset',
  caption: shot.caption || 'Vice Heat',
  captionSize: 1,
  captionPos: 'bottom',
  selected: 0,
  onePhoto: false,
  images: [],
  transforms: [],
};

function ensureTransforms() {
  const count = LAYOUTS[state.layout].panels.length;
  while (state.transforms.length < count) state.transforms.push({ panX: 0, panY: 0, zoom: 1 });
  while (state.images.length < count) state.images.push(null);
}
ensureTransforms();

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

function render() {
  if (!canvas) return;
  if (isCoverShot) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  drawCover(ctx, canvas.width, canvas.height, state);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSampleIntoAll(name) {
  const img = await loadImage(SAMPLES[name]);
  ensureTransforms();
  for (let i = 0; i < state.images.length; i++) state.images[i] = img;
  render();
  return img;
}
async function loadSampleIntoSelected(name) {
  const img = await loadImage(SAMPLES[name]);
  state.images[state.selected] = img;
  render();
  return img;
}

// --- Shot mode setup ---
async function initShot() {
  document.body.classList.add(isCoverShot ? 'shot-cover' : 'shot-editor');
  if (shot.caption) {
    state.caption = shot.caption;
    const inp = document.getElementById('captionInput');
    if (inp) inp.value = shot.caption;
  }
  if (shot.layout) state.layout = shot.layout;
  if (shot.grade) state.grade = shot.grade;
  ensureTransforms();
  syncControls();
  try { await document.fonts.ready; } catch {}
  const photoName = shot.photo || 'boulevard';
  if (SAMPLES[photoName]) {
    await loadSampleIntoAll(photoName);
  }
  render();
  // double rAF to ensure paint
  requestAnimationFrame(() => requestAnimationFrame(() => { render(); window.__shotReady = true; }));
}

// --- Editor wiring ---
function syncControls() {
  document.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach(b => b.classList.toggle('active', b.dataset.grade === state.grade));
  const cap = document.getElementById('captionInput');
  if (cap && cap.value !== state.caption) cap.value = state.caption;
  const zoom = document.getElementById('zoomSlider');
  if (zoom) zoom.value = String((state.transforms[state.selected]?.zoom || 1) * 100);
  const selLabel = document.getElementById('selectedLabel');
  if (selLabel) selLabel.textContent = `Panel ${state.selected + 1} selected — drag to pan, scroll to zoom`;
}

function bindEditor() {
  document.querySelectorAll('[data-layout]').forEach(btn => {
    btn.addEventListener('click', () => { state.layout = btn.dataset.layout; ensureTransforms(); syncControls(); render(); });
  });
  document.querySelectorAll('[data-grade]').forEach(btn => {
    btn.addEventListener('click', () => { state.grade = btn.dataset.grade; syncControls(); render(); });
  });
  document.querySelectorAll('[data-sample]').forEach(btn => {
    btn.addEventListener('click', async () => { await loadSampleIntoSelected(btn.dataset.sample); });
  });
  const cap = document.getElementById('captionInput');
  cap?.addEventListener('input', () => { state.caption = cap.value; render(); });
  const size = document.getElementById('captionSize');
  size?.addEventListener('input', () => { state.captionSize = Number(size.value) / 100; render(); });
  const posTop = document.getElementById('posTop');
  const posBottom = document.getElementById('posBottom');
  posTop?.addEventListener('click', () => { state.captionPos = 'top'; render(); });
  posBottom?.addEventListener('click', () => { state.captionPos = 'bottom'; render(); });
  const zoom = document.getElementById('zoomSlider');
  zoom?.addEventListener('input', () => {
    const t = state.transforms[state.selected]; if (t) t.zoom = Number(zoom.value) / 100; render();
  });
  const one = document.getElementById('onePhotoToggle');
  one?.addEventListener('change', () => { state.onePhoto = one.checked; render(); });
  const fileInput = document.getElementById('fileInput');
  document.getElementById('loadBtn')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const f = fileInput.files?.[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const img = await loadImage(url);
    state.images[state.selected] = img;
    if (state.onePhoto) { for (let i = 0; i < state.images.length; i++) state.images[i] = img; }
    render();
  });

  // canvas interactions
  let dragging = false, lastX = 0, lastY = 0;
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPos(e);
    const idx = hitTestPanel(canvas.width, canvas.height, state.layout, p.x, p.y);
    if (idx >= 0) { state.selected = idx; syncControls(); }
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const t = state.transforms[state.selected]; if (!t) return;
    t.panX += (e.clientX - lastX) / 220;
    t.panY += (e.clientY - lastY) / 220;
    lastX = e.clientX; lastY = e.clientY;
    render();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const t = state.transforms[state.selected]; if (!t) return;
    t.zoom = Math.min(3, Math.max(0.6, t.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    syncControls(); render();
  }, { passive: false });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', async (e) => {
    e.preventDefault();
    const p = canvasPos(e);
    const idx = hitTestPanel(canvas.width, canvas.height, state.layout, p.x, p.y);
    if (idx >= 0) state.selected = idx;
    const f = e.dataTransfer?.files?.[0]; if (!f) return;
    const img = await loadImage(URL.createObjectURL(f));
    state.images[state.selected] = img; render();
  });

  document.querySelectorAll('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => exportPNG(btn.dataset.export));
  });
  window.addEventListener('resize', render);
}

function exportPNG(sizeStr) {
  const [w, h] = sizeStr.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), w, h, state);
  const a = document.createElement('a');
  a.download = `vice-cover-${w}x${h}.png`;
  a.href = off.toDataURL('image/png');
  a.click();
}

// boot
(async () => {
  bindEditor();
  syncControls();
  if (shot.mode) {
    await initShot();
  } else {
    try { await document.fonts.ready; } catch {}
    await loadSampleIntoAll('boulevard');
    render();
  }
})();
