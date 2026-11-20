export const GRADES = {
  sunset: {
    bg: ['#2b1055', '#8f2d7a', '#1c0b2e'],
    glow: 'rgba(255,138,76,0.55)',
    overlay: ['rgba(255,122,69,0.20)', 'rgba(64,12,84,0.28)'],
    empty: ['#5b2a86', '#2b1055'],
    accent: '#ffd23f',
  },
  neon: {
    bg: ['#160a3a', '#123a8f', '#05030f'],
    glow: 'rgba(38,198,255,0.45)',
    overlay: ['rgba(38,198,255,0.14)', 'rgba(10,4,40,0.34)'],
    empty: ['#1d2f7a', '#0a0630'],
    accent: '#2ee6ff',
  },
  gold: {
    bg: ['#2e1a08', '#8a5a16', '#180c02'],
    glow: 'rgba(255,196,64,0.5)',
    overlay: ['rgba(255,186,64,0.16)', 'rgba(46,22,2,0.3)'],
    empty: ['#7a5216', '#2e1a08'],
    accent: '#ffe08a',
  },
};

export function getPanelRects(layout, w, h) {
  const minDim = Math.min(w, h);
  const pad = 0.035 * minDim;
  const gap = 0.022 * minDim;
  const innerW = w - 2 * pad;
  const innerH = h - 2 * pad;
  if (layout === 'duo') {
    const pw = (innerW - gap) / 2;
    return [
      { x: pad, y: pad, w: pw, h: innerH, tilt: -0.012 },
      { x: pad + pw + gap, y: pad, w: pw, h: innerH, tilt: 0.012 },
    ];
  }
  if (layout === 'grid') {
    const pw = (innerW - gap) / 2;
    const ph = (innerH - gap) / 2;
    const tilts = [-0.01, 0.01, 0.01, -0.01];
    const rects = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        rects.push({
          x: pad + col * (pw + gap),
          y: pad + row * (ph + gap),
          w: pw,
          h: ph,
          tilt: tilts[row * 2 + col],
        });
      }
    }
    return rects;
  }
  // classic
  const heroW = 0.62 * (innerW - gap);
  const rightX = pad + heroW + gap;
  const rightW = innerW - gap - heroW;
  const rightH = (innerH - gap) / 2;
  return [
    { x: pad, y: pad, w: heroW, h: innerH, tilt: -0.014 },
    { x: rightX, y: pad, w: rightW, h: rightH, tilt: 0.018 },
    { x: rightX, y: pad + rightH + gap, w: rightW, h: rightH, tilt: -0.018 },
  ];
}

function drawPanelContent(ctx, rect, panelState, grade) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rect.tilt || 0);
  ctx.beginPath();
  ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.clip();
  const img = panelState ? panelState.image : null;
  const transform = panelState && panelState.transform ? panelState.transform : { scale: 100, offsetX: 0, offsetY: 0 };
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (iw && ih) {
      const baseScale = Math.max(rect.w / iw, rect.h / ih);
      const scale = baseScale * ((transform.scale || 100) / 100);
      const dw = iw * scale;
      const dh = ih * scale;
      const overflowX = Math.max(0, dw - rect.w);
      const overflowY = Math.max(0, dh - rect.h);
      const shiftX = ((transform.offsetX || 0) / 100) * 0.45 * overflowX;
      const shiftY = ((transform.offsetY || 0) / 100) * 0.45 * overflowY;
      ctx.drawImage(img, -dw / 2 + shiftX, -dh / 2 + shiftY, dw, dh);
    }
  } else {
    const grad = ctx.createLinearGradient(-rect.w / 2, -rect.h / 2, rect.w / 2, rect.h / 2);
    grad.addColorStop(0, grade.empty[0]);
    grad.addColorStop(1, grade.empty[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = Math.max(6, 0.045 * rect.w);
    const step = Math.max(28, 0.16 * rect.w);
    ctx.beginPath();
    for (let x = -rect.w; x < rect.w * 2; x += step) {
      ctx.moveTo(-rect.w / 2 + x, -rect.h / 2);
      ctx.lineTo(-rect.w / 2 + x - rect.h, rect.h / 2);
    }
    ctx.stroke();
    ctx.restore();
  }
  const overlayGrad = ctx.createLinearGradient(0, -rect.h / 2, 0, rect.h / 2);
  overlayGrad.addColorStop(0, grade.overlay[0]);
  overlayGrad.addColorStop(1, grade.overlay[1]);
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.restore();
}

function normalizePanels(state, rects) {
  return rects.map((_, i) => ({
    image: state.images ? state.images[i] : null,
    transform: state.transforms ? state.transforms[i] : undefined,
  }));
}

export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = getPanelRects(state.layout, w, h);
  const panels = normalizePanels(state, rects);

  // (i) background
  const bgGrad = ctx.createLinearGradient(0, 0, 0.25 * w, h);
  bgGrad.addColorStop(0, grade.bg[0]);
  bgGrad.addColorStop(0.52, grade.bg[1]);
  bgGrad.addColorStop(1, grade.bg[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  const glowGrad = ctx.createRadialGradient(0.72 * w, 0.20 * h, 0, 0.72 * w, 0.20 * h, 0.75 * Math.max(w, h));
  glowGrad.addColorStop(0, grade.glow);
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // (ii) panels
  rects.forEach((rect, i) => drawPanelContent(ctx, rect, panels[i], grade));

  // (iii) borders pass
  const borderW = Math.max(6, 0.011 * Math.min(w, h));
  rects.forEach((rect, i) => {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rect.tilt || 0);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 1.6 * borderW;
    ctx.shadowOffsetY = 0.5 * borderW;
    ctx.shadowOffsetX = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = borderW;
    ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(2, 0.35 * borderW);
    ctx.strokeRect(-rect.w / 2 + borderW, -rect.h / 2 + borderW, rect.w - 2 * borderW, rect.h - 2 * borderW);
    ctx.restore();
    ctx.restore();
    if (state.showSelection && state.selectedPanel === i) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rect.tilt || 0);
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = 0.55 * borderW;
      const expand = borderW;
      ctx.strokeRect(-rect.w / 2 - expand, -rect.h / 2 - expand, rect.w + 2 * expand, rect.h + 2 * expand);
      ctx.restore();
    }
  });

  // (iv) vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, 0.42 * Math.min(w, h), w / 2, h / 2, 0.78 * Math.max(w, h));
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // (v) caption
  drawCaption(ctx, state, w, h, grade);
}

function drawCaption(ctx, state, w, h, grade) {
  const raw = (state.caption || '').trim();
  if (!raw) return;
  const text = raw.toUpperCase();
  let size = 0.115 * Math.min(w, h);
  const setFont = () => {
    ctx.font = `${size}px Anton, Impact, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(0.03 * size)}px`; } catch {}
  };
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setFont();
  let measured = ctx.measureText(text).width;
  const maxW = 0.9 * w;
  if (measured > maxW && measured > 0) {
    size = Math.max(18, size * (maxW / measured));
    setFont();
    measured = ctx.measureText(text).width;
  }
  const cy = 0.80 * h;
  const bandH = 1.55 * size;
  const bandGrad = ctx.createLinearGradient(0, cy - bandH / 2, 0, cy + bandH / 2);
  bandGrad.addColorStop(0, 'rgba(8,2,18,0)');
  bandGrad.addColorStop(0.5, 'rgba(8,2,18,0.55)');
  bandGrad.addColorStop(1, 'rgba(8,2,18,0)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, cy - bandH / 2, w, bandH);

  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#17082b';
  ctx.lineWidth = Math.max(4, 0.16 * size);
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 0.16 * size;
  ctx.shadowOffsetY = 0.07 * size;
  ctx.shadowOffsetX = 0;
  ctx.strokeText(text, w / 2, cy);
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, cy);

  const underlineW = Math.min(measured, maxW);
  const underlineH = Math.max(3, 0.07 * size);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(w / 2 - underlineW / 2, cy + 0.62 * size, underlineW, underlineH);
  try { ctx.letterSpacing = '0px'; } catch {}
  ctx.restore();
}

export function exportCoverPNG(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const exportState = { ...state, showSelection: false };
  drawCover(ctx, exportState, w, h);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-cover-${w}x${h}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
