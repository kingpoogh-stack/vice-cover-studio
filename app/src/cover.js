// Vice Cover Studio — cover renderer.
// Draws a multi-panel poster cover: graded background, tilted photo panels
// with thick white poster borders, and bold Anton caption lettering.

const GRADES = {
  sunset: {
    bg: ['#2b1055', '#8f2d7a', '#1c0b2e'],
    glow: 'rgba(255, 138, 76, 0.55)',
    overlay: ['rgba(255, 122, 69, 0.20)', 'rgba(64, 12, 84, 0.28)'],
    empty: ['#5b2a86', '#2b1055'],
    accent: '#ffd23f',
  },
  neon: {
    bg: ['#160a3a', '#123a8f', '#05030f'],
    glow: 'rgba(38, 198, 255, 0.45)',
    overlay: ['rgba(38, 198, 255, 0.14)', 'rgba(10, 4, 40, 0.34)'],
    empty: ['#1d2f7a', '#0a0630'],
    accent: '#2ee6ff',
  },
  gold: {
    bg: ['#2e1a08', '#8a5a16', '#180c02'],
    glow: 'rgba(255, 196, 64, 0.5)',
    overlay: ['rgba(255, 186, 64, 0.16)', 'rgba(46, 22, 2, 0.3)'],
    empty: ['#7a5216', '#2e1a08'],
    accent: '#ffe08a',
  },
};

export function getPanelRects(layout, w, h) {
  const m = Math.min(w, h);
  const pad = m * 0.035;
  const gap = m * 0.022;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  if (layout === 'duo') {
    const pw = (iw - gap) / 2;
    return [
      { x: pad, y: pad, w: pw, h: ih, tilt: -0.012 },
      { x: pad + pw + gap, y: pad, w: pw, h: ih, tilt: 0.012 },
    ];
  }
  if (layout === 'grid') {
    const pw = (iw - gap) / 2;
    const ph = (ih - gap) / 2;
    return [
      { x: pad, y: pad, w: pw, h: ph, tilt: -0.01 },
      { x: pad + pw + gap, y: pad, w: pw, h: ph, tilt: 0.01 },
      { x: pad, y: pad + ph + gap, w: pw, h: ph, tilt: 0.01 },
      { x: pad + pw + gap, y: pad + ph + gap, w: pw, h: ph, tilt: -0.01 },
    ];
  }
  // classic
  const leftW = (iw - gap) * 0.62;
  const rightX = pad + leftW + gap;
  const rightW = iw - gap - leftW;
  const rightH = (ih - gap) / 2;
  return [
    { x: pad, y: pad, w: leftW, h: ih, tilt: -0.014 },
    { x: rightX, y: pad, w: rightW, h: rightH, tilt: 0.018 },
    { x: rightX, y: pad + rightH + gap, w: rightW, h: rightH, tilt: -0.018 },
  ];
}

function drawBackground(ctx, grade, w, h) {
  const g = GRADES[grade] || GRADES.sunset;
  const grad = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grad.addColorStop(0, g.bg[0]);
  grad.addColorStop(0.52, g.bg[1]);
  grad.addColorStop(1, g.bg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.72, h * 0.2, 0, w * 0.72, h * 0.2, Math.max(w, h) * 0.75);
  glow.addColorStop(0, g.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function drawEmptyPanel(ctx, grade, pw, ph) {
  const g = GRADES[grade] || GRADES.sunset;
  const grad = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
  grad.addColorStop(0, g.empty[0]);
  grad.addColorStop(1, g.empty[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = Math.max(6, pw * 0.045);
  const step = Math.max(28, pw * 0.16);
  ctx.beginPath();
  for (let x = -ph; x < pw + ph; x += step) {
    ctx.moveTo(-pw / 2 + x, ph / 2);
    ctx.lineTo(-pw / 2 + x + ph, -ph / 2);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPanelImage(ctx, img, t, pw, ph) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = (t && t.scale ? t.scale : 100) / 100;
  const base = Math.max(pw / iw, ph / ih);
  const dw = iw * base * scale;
  const dh = ih * base * scale;
  const ox = Math.max(0, dw - pw);
  const oy = Math.max(0, dh - ph);
  const shiftX = ((t && t.offsetX) || 0) / 100 * 0.45 * ox;
  const shiftY = ((t && t.offsetY) || 0) / 100 * 0.45 * oy;
  ctx.drawImage(img, -dw / 2 + shiftX, -dh / 2 + shiftY, dw, dh);
}

function drawGradeOverlay(ctx, grade, pw, ph) {
  const g = GRADES[grade] || GRADES.sunset;
  const grad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
  grad.addColorStop(0, g.overlay[0]);
  grad.addColorStop(1, g.overlay[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
}

function drawCaption(ctx, state, w, h) {
  const caption = (state.caption || '').trim();
  if (!caption) return;
  const text = caption.toUpperCase();
  const m = Math.min(w, h);
  let size = m * 0.115;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = (s) => { ctx.font = s + 'px Anton, Impact, sans-serif'; };
  setFont(size);
  try { ctx.letterSpacing = Math.max(1, size * 0.03) + 'px'; } catch (e) { /* older canvas */ }
  const maxW = w * 0.9;
  const measured = ctx.measureText(text).width;
  if (measured > maxW) {
    size = Math.max(18, size * (maxW / measured));
    setFont(size);
  }
  const cy = h * 0.8;
  // Soft dark band so lettering stays legible over busy photos.
  const bandH = size * 1.55;
  const band = ctx.createLinearGradient(0, cy - bandH / 2, 0, cy + bandH / 2);
  band.addColorStop(0, 'rgba(8,2,18,0)');
  band.addColorStop(0.5, 'rgba(8,2,18,0.55)');
  band.addColorStop(1, 'rgba(8,2,18,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, cy - bandH / 2, w, bandH);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.07;
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.strokeStyle = '#17082b';
  ctx.strokeText(text, w / 2, cy);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, cy);
  // Accent underline.
  const tw = Math.min(ctx.measureText(text).width, maxW);
  const g = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = g.accent;
  ctx.fillRect(w / 2 - tw / 2, cy + size * 0.62, tw, Math.max(3, size * 0.07));
  ctx.restore();
}

export function drawCover(ctx, state, w, h) {
  const grade = state.grade || 'sunset';
  const layout = state.layout || 'classic';
  drawBackground(ctx, grade, w, h);
  const rects = getPanelRects(layout, w, h);
  const borderW = Math.max(6, Math.min(w, h) * 0.011);
  rects.forEach((r, i) => {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(r.tilt);
    ctx.beginPath();
    ctx.rect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.clip();
    const img = state.images ? state.images[i] : null;
    const t = state.transforms ? state.transforms[i] : null;
    if (img) drawPanelImage(ctx, img, t, r.w, r.h);
    else drawEmptyPanel(ctx, grade, r.w, r.h);
    drawGradeOverlay(ctx, grade, r.w, r.h);
    ctx.restore();
    // Poster border.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(r.tilt);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = borderW * 1.6;
    ctx.shadowOffsetY = borderW * 0.5;
    ctx.lineWidth = borderW;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.restore();
    if (state.showSelection && state.selectedPanel === i) {
      const g = GRADES[grade] || GRADES.sunset;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(r.tilt);
      ctx.lineWidth = Math.max(3, borderW * 0.55);
      ctx.strokeStyle = g.accent;
      ctx.strokeRect(-r.w / 2 - borderW, -r.h / 2 - borderW, r.w + borderW * 2, r.h + borderW * 2);
      ctx.restore();
    }
  });
  // Vignette.
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  drawCaption(ctx, state, w, h);
}

export function exportCoverPNG(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const exportState = Object.assign({}, state, { showSelection: false });
  drawCover(ctx, exportState, w, h);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vice-cover-' + w + 'x' + h + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
