import { drawCover, getPanelRects, exportCoverPNG } from './cover.js';
import { parseShotParams, sizeForKey } from './shots.js';

function defaultTransform() {
  return { scale: 100, offsetX: 0, offsetY: 0 };
}

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
const tabsEl = document.getElementById('panel-tabs');
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
  scaleValue.textContent = `${t.scale}%`;
  offsetXValue.textContent = String(t.offsetX);
  offsetYValue.textContent = String(t.offsetY);
}

function buildTabs() {
  tabsEl.innerHTML = '';
  const count = panelCount();
  for (let i = 0; i < count; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `Panel ${i + 1}`;
    btn.setAttribute('role', 'tab');
    if (i === state.selectedPanel) btn.classList.add('active-tab');
    btn.addEventListener('click', () => selectPanel(i));
    tabsEl.appendChild(btn);
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
    img.onload = () => {
      setImage(img, panelIndex);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = `samples/${name}.jpg`;
  });
}

function loadSampleImageOnly(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `samples/${name}.jpg`;
  });
}

const photoInput = document.getElementById('photo-input');
photoInput.addEventListener('change', () => {
  const file = photoInput.files && photoInput.files[0];
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
    const name = btn.getAttribute('data-sample');
    if (name) loadSample(name, state.selectedPanel);
  });
});

document.getElementById('fill-all').addEventListener('click', () => {
  let img = state.currentImage >= 0 ? state.images[state.currentImage] : null;
  if (!img) img = state.images.find((x) => x) || null;
  if (!img) return;
  for (let i = 0; i < 4; i++) state.images[i] = img;
  redraw();
});

const layoutSelect = document.getElementById('layout-select');
layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value;
  const count = panelCount();
  if (state.selectedPanel >= count) state.selectedPanel = count - 1;
  buildTabs();
  syncSliders();
  redraw();
});

const gradeSelect = document.getElementById('grade-select');
gradeSelect.addEventListener('change', () => {
  state.grade = gradeSelect.value;
  redraw();
});

const captionInput = document.getElementById('caption-input');
captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});

function bindSlider(range, valueEl, key, format) {
  range.addEventListener('input', () => {
    const v = parseInt(range.value, 10) || 0;
    const t = state.transforms[state.selectedPanel];
    if (t) t[key] = v;
    valueEl.textContent = format(v);
    redraw();
  });
}

bindSlider(scaleRange, scaleValue, 'scale', (v) => `${v}%`);
bindSlider(offsetXRange, offsetXValue, 'offsetX', (v) => String(v));
bindSlider(offsetYRange, offsetYValue, 'offsetY', (v) => String(v));

preview.addEventListener('click', (ev) => {
  const rect = preview.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * preview.width;
  const y = ((ev.clientY - rect.top) / rect.height) * preview.height;
  const rects = getPanelRects(state.layout, preview.width, preview.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      selectPanel(i);
      break;
    }
  }
});

document.getElementById('export-btn').addEventListener('click', () => {
  const key = document.getElementById('size-select').value;
  const size = sizeForKey(key);
  exportCoverPNG(state, size.w, size.h);
});

async function ensureFont() {
  try {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load('80px Anton');
    }
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch {
    // Font loading is best-effort for screenshots.
  }
}

async function runShotMode(shot) {
  await ensureFont();
  if (shot.shot === 'cover') {
    document.body.classList.add('shot-cover');
    const stage = document.getElementById('shotStage');
    stage.hidden = false;
    const canvas = document.getElementById('shotCanvas');
    canvas.width = window.innerWidth || shot.w;
    canvas.height = window.innerHeight || shot.h;
    const img = await loadSampleImageOnly(shot.photo || 'boulevard');
    const shotState = {
      images: [img, img, img, img],
      transforms: [
        defaultTransform(),
        { scale: 135, offsetX: 30, offsetY: -10 },
        { scale: 150, offsetX: -35, offsetY: 15 },
        { scale: 125, offsetX: 15, offsetY: 25 },
      ],
      layout: shot.layout || 'classic',
      grade: shot.grade || 'sunset',
      caption: shot.caption || 'Vice Heat',
      selectedPanel: 0,
      showSelection: false,
    };
    const sctx = canvas.getContext('2d');
    drawCover(sctx, shotState, canvas.width, canvas.height);
    window.__shotReady = true;
    return;
  }
  state.layout = shot.layout || 'classic';
  state.grade = shot.grade || 'sunset';
  if (shot.caption) state.caption = shot.caption;
  layoutSelect.value = state.layout;
  gradeSelect.value = state.grade;
  captionInput.value = state.caption;
  const img = await loadSampleImageOnly(shot.photo || 'pier');
  if (img) {
    for (let i = 0; i < 4; i++) state.images[i] = img;
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
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => redraw()).catch(() => {});
}
if (shot.shot) {
  runShotMode(shot);
}
