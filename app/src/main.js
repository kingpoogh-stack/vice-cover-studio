import { drawCover, getPanelRects, exportCoverPNG } from './cover.js';
import { parseShotParams, sizeForKey } from './shots.js';

const defaultTransform = () => ({ scale: 100, offsetX: 0, offsetY: 0 });

const state = {
  images: [null, null, null, null],
  transforms: [defaultTransform(), defaultTransform(), defaultTransform(), defaultTransform()],
  layout: 'classic',
  grade: 'sunset',
  caption: 'Vice Heat',
  selectedPanel: 0,
  currentImage: -1,
  showSelection: true,
};

const preview = document.getElementById('preview');
const pctx = preview.getContext('2d');
const panelTabs = document.getElementById('panel-tabs');
const scaleRange = document.getElementById('scale-range');
const offsetXRange = document.getElementById('offsetx-range');
const offsetYRange = document.getElementById('offsety-range');
const scaleValue = document.getElementById('scale-value');
const offsetXValue = document.getElementById('offsetx-value');
const offsetYValue = document.getElementById('offsety-value');

function panelCount() {
  return getPanelRects(state.layout, 1080, 1080).length;
}

function redraw() {
  drawCover(pctx, state, preview.width, preview.height);
}

function syncSliders() {
  const t = state.transforms[state.selectedPanel] || defaultTransform();
  scaleRange.value = String(t.scale);
  offsetXRange.value = String(t.offsetX);
  offsetYRange.value = String(t.offsetY);
  scaleValue.textContent = t.scale + '%';
  offsetXValue.textContent = String(t.offsetX);
  offsetYValue.textContent = String(t.offsetY);
}

function buildTabs() {
  panelTabs.innerHTML = '';
  const n = panelCount();
  for (let i = 0; i < n; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Panel ' + (i + 1);
    if (i === state.selectedPanel) btn.classList.add('active-tab');
    btn.addEventListener('click', () => selectPanel(i));
    panelTabs.appendChild(btn);
  }
}

function selectPanel(i) {
  state.selectedPanel = i;
  buildTabs();
  syncSliders();
  redraw();
}

function setImage(img, panelIndex) {
  state.images[panelIndex] = img;
  state.currentImage = panelIndex;
  redraw();
}

function loadSample(name, panelIndex) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { setImage(img, panelIndex); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = 'samples/' + name + '.jpg';
  });
}

function loadSampleImageOnly(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'samples/' + name + '.jpg';
  });
}

// ---- Editor wiring ----

document.getElementById('photo-input').addEventListener('change', (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => setImage(img, state.selectedPanel);
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll('.sample-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    loadSample(btn.getAttribute('data-sample'), state.selectedPanel);
  });
});

document.getElementById('fill-all').addEventListener('click', () => {
  let img = state.currentImage >= 0 ? state.images[state.currentImage] : null;
  if (!img) img = state.images.find((im) => im) || null;
  if (!img) return;
  for (let i = 0; i < state.images.length; i++) state.images[i] = img;
  redraw();
});

document.getElementById('layout-select').addEventListener('change', (ev) => {
  state.layout = ev.target.value;
  if (state.selectedPanel >= panelCount()) state.selectedPanel = 0;
  buildTabs();
  syncSliders();
  redraw();
});

document.getElementById('grade-select').addEventListener('change', (ev) => {
  state.grade = ev.target.value;
  redraw();
});

document.getElementById('caption-input').addEventListener('input', (ev) => {
  state.caption = ev.target.value;
  redraw();
});

function bindSlider(range, valueEl, key, format) {
  range.addEventListener('input', () => {
    const t = state.transforms[state.selectedPanel];
    t[key] = parseInt(range.value, 10);
    valueEl.textContent = format(t[key]);
    redraw();
  });
}
bindSlider(scaleRange, scaleValue, 'scale', (v) => v + '%');
bindSlider(offsetXRange, offsetXValue, 'offsetX', (v) => String(v));
bindSlider(offsetYRange, offsetYValue, 'offsetY', (v) => String(v));

preview.addEventListener('click', (ev) => {
  const rect = preview.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width * preview.width;
  const y = (ev.clientY - rect.top) / rect.height * preview.height;
  const rects = getPanelRects(state.layout, preview.width, preview.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      selectPanel(i);
      return;
    }
  }
});

document.getElementById('export-btn').addEventListener('click', () => {
  const key = document.getElementById('size-select').value;
  const size = sizeForKey(key);
  exportCoverPNG(state, size.w, size.h);
});

// ---- Shot mode ----

async function ensureFont() {
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch (e) { /* fall back to Impact */ }
}

async function runShotMode(shot) {
  await ensureFont();
  if (shot.shot === 'cover') {
    document.body.classList.add('shot-cover');
    const stage = document.getElementById('shotStage');
    stage.hidden = false;
    const canvas = document.getElementById('shotCanvas');
    const w = window.innerWidth || shot.w;
    const h = window.innerHeight || shot.h;
    canvas.width = w;
    canvas.height = h;
    const img = await loadSampleImageOnly(shot.photo);
    const shotState = {
      images: [img, img, img, img],
      transforms: [defaultTransform(), defaultTransform(), defaultTransform(), defaultTransform()],
      layout: shot.layout,
      grade: shot.grade,
      caption: shot.caption,
      selectedPanel: 0,
      showSelection: false,
    };
    // Slight per-panel crop variety so panels do not look cloned.
    shotState.transforms[1] = { scale: 135, offsetX: 30, offsetY: -10 };
    shotState.transforms[2] = { scale: 150, offsetX: -35, offsetY: 15 };
    shotState.transforms[3] = { scale: 125, offsetX: 15, offsetY: 25 };
    drawCover(canvas.getContext('2d'), shotState, w, h);
    window.__shotReady = true;
    return;
  }
  // shot=editor: normal editor with sample + caption applied.
  state.layout = shot.layout || 'classic';
  state.grade = shot.grade || 'sunset';
  state.caption = shot.caption || state.caption;
  document.getElementById('layout-select').value = state.layout;
  document.getElementById('grade-select').value = state.grade;
  document.getElementById('caption-input').value = state.caption;
  const img = await loadSampleImageOnly(shot.photo || 'pier');
  if (img) {
    // Show the studio as a user would after "Fill all panels": every panel
    // holds the photo, each reframed with its own crop.
    for (let i = 0; i < state.images.length; i++) state.images[i] = img;
    state.currentImage = 0;
    state.transforms[1] = { scale: 145, offsetX: 25, offsetY: -15 };
    state.transforms[2] = { scale: 160, offsetX: -30, offsetY: 10 };
    state.transforms[3] = { scale: 130, offsetX: 10, offsetY: 20 };
  }
  buildTabs();
  syncSliders();
  redraw();
  window.__shotReady = true;
}

const shot = parseShotParams(window.location.search);
buildTabs();
syncSliders();
redraw();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => redraw());
if (shot.shot) runShotMode(shot);
