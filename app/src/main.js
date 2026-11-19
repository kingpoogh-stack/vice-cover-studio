// Editor wiring and screenshot mode for Vice Cover Studio.
import { drawCover, exportCoverPNG, getPanelRects } from './cover.js';
import { parseShot, isShotMode } from './shots.js';

const state = {
  images: [null, null, null, null],
  transforms: [
    { scale: 1, offsetX: 0, offsetY: 0 },
    { scale: 1, offsetX: 0, offsetY: 0 },
    { scale: 1, offsetX: 0, offsetY: 0 },
    { scale: 1, offsetX: 0, offsetY: 0 },
  ],
  layout: 'classic',
  grade: 'sunset',
  caption: 'Vice Heat',
  selectedPanel: 0,
  currentImage: null,
};

const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
let lastRects = [];

function loadSampleImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `samples/${name}.jpg`;
  });
}

function panelCount() {
  return getPanelRects(state.layout, 100, 100).length;
}

function refreshPanelTabs() {
  const tabs = document.getElementById('panelTabs');
  if (!tabs) return;
  tabs.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-tab' + (i === state.selectedPanel ? ' active' : '');
    btn.textContent = `Panel ${i + 1}`;
    btn.addEventListener('click', () => { state.selectedPanel = i; syncSliders(); redrawPreview(); });
    tabs.appendChild(btn);
  }
}

function syncSliders() {
  const t = state.transforms[state.selectedPanel];
  document.getElementById('scaleSlider').value = String(t.scale);
  document.getElementById('offsetXSlider').value = String(t.offsetX);
  document.getElementById('offsetYSlider').value = String(t.offsetY);
  document.getElementById('scaleVal').textContent = Number(t.scale).toFixed(2);
  document.getElementById('offsetXVal').textContent = String(t.offsetX);
  document.getElementById('offsetYVal').textContent = String(t.offsetY);
}

function redrawPreview() {
  const w = previewCanvas.width;
  const h = previewCanvas.height;
  lastRects = drawCover(previewCtx, w, h, {
    images: state.images,
    layout: state.layout,
    caption: state.caption,
    grade: state.grade,
    transforms: state.transforms,
    selectedIndex: state.selectedPanel,
  });
  refreshPanelTabs();
}

function scheduleRedraw() {
  requestAnimationFrame(redrawPreview);
}

async function assignSampleToAllPanels(name) {
  const img = await loadSampleImage(name);
  state.currentImage = img;
  for (let i = 0; i < state.images.length; i++) state.images[i] = img;
  scheduleRedraw();
  return img;
}

function wireEditorControls() {
  document.getElementById('photoInput').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.currentImage = img;
        state.images[state.selectedPanel] = img;
        scheduleRedraw();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  document.querySelectorAll('.sample-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const img = await loadSampleImage(btn.dataset.sample);
      state.currentImage = img;
      state.images[state.selectedPanel] = img;
      scheduleRedraw();
    });
  });

  document.getElementById('fillAllBtn').addEventListener('click', () => {
    if (!state.currentImage) return;
    for (let i = 0; i < state.images.length; i++) state.images[i] = state.currentImage;
    scheduleRedraw();
  });

  document.getElementById('layoutSelect').addEventListener('change', (e) => {
    state.layout = e.target.value;
    if (state.selectedPanel >= panelCount()) state.selectedPanel = 0;
    scheduleRedraw();
  });
  document.getElementById('gradeSelect').addEventListener('change', (e) => { state.grade = e.target.value; scheduleRedraw(); });
  document.getElementById('captionInput').addEventListener('input', (e) => { state.caption = e.target.value; scheduleRedraw(); });

  const bindSlider = (id, key, labelId, format) => {
    document.getElementById(id).addEventListener('input', (e) => {
      const value = Number(e.target.value);
      state.transforms[state.selectedPanel][key] = value;
      document.getElementById(labelId).textContent = format(value);
      scheduleRedraw();
    });
  };
  bindSlider('scaleSlider', 'scale', 'scaleVal', (v) => v.toFixed(2));
  bindSlider('offsetXSlider', 'offsetX', 'offsetXVal', (v) => String(v));
  bindSlider('offsetYSlider', 'offsetY', 'offsetYVal', (v) => String(v));

  document.getElementById('sizeSelect').addEventListener('change', (e) => {
    const [w, h] = e.target.value.split('x').map(Number);
    previewCanvas.width = w; previewCanvas.height = h;
    previewCanvas.style.aspectRatio = `${w} / ${h}`;
    scheduleRedraw();
  });

  previewCanvas.addEventListener('click', (event) => {
    const box = previewCanvas.getBoundingClientRect();
    const px = (event.clientX - box.left) * (previewCanvas.width / box.width);
    const py = (event.clientY - box.top) * (previewCanvas.height / box.height);
    const hit = lastRects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (hit >= 0) {
      state.selectedPanel = hit;
      if (state.currentImage) state.images[hit] = state.currentImage;
      syncSliders();
      scheduleRedraw();
    }
  });

  document.getElementById('exportBtn').addEventListener('click', async () => {
    const [w, h] = document.getElementById('sizeSelect').value.split('x').map(Number);
    const blob = await exportCoverPNG(w, h, {
      images: state.images, layout: state.layout, caption: state.caption, grade: state.grade, transforms: state.transforms,
    });
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'vice-cover.png';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
}

async function waitForFontsAndPaint() {
  try { await document.fonts.load('80px Anton'); await document.fonts.ready; } catch { /* font fallback is fine */ }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function runShotMode(shot) {
  if (shot.mode === 'editor') {
    document.body.classList.add('shot-editor');
    state.layout = 'classic';
    state.grade = 'sunset';
    state.caption = shot.caption;
    document.getElementById('captionInput').value = shot.caption;
    const img = await assignSampleToAllPanels(shot.photo);
    void img;
    await waitForFontsAndPaint();
    redrawPreview();
    await waitForFontsAndPaint();
    window.__shotReady = true;
    return;
  }
  // cover mode: full-viewport cover, editor chrome hidden
  document.body.classList.add('shot-mode');
  const stage = document.getElementById('shotStage');
  stage.hidden = false;
  const canvas = document.getElementById('shotCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const img = await loadSampleImage(shot.photo);
  const images = [img, img, img, img];
  await waitForFontsAndPaint();
  drawCover(canvas.getContext('2d'), canvas.width, canvas.height, {
    images, layout: shot.layout, caption: shot.caption, grade: shot.grade,
    transforms: state.transforms, selectedIndex: -1,
  });
  await waitForFontsAndPaint();
  window.__shotReady = true;
}

async function bootEditor() {
  wireEditorControls();
  syncSliders();
  try { await assignSampleToAllPanels('boulevard'); } catch { redrawPreview(); }
}

const shot = parseShot();
if (isShotMode() && shot) {
  runShotMode(shot);
} else {
  bootEditor();
}
