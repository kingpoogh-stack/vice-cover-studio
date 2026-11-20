const GRADES = {
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
    const tilts = [-0.01, 0.01, 0.01, -0.01];
    const rects = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        rects.push({
          x: pad + c * (pw + gap),
          y: pad + r * (ph + gap),
          w: pw,
          h: ph,
          tilt: tilts[r * 2 + c],
        });
      }
    }
    return rects;
  }
  const heroW = (iw - gap) * 0.62;
  const rightX = pad + heroW + gap;
  const rightW = iw - gap - heroW;
  const halfH = (ih - gap) / 2;
  return [
    { x: pad, y: pad, w: heroW, h: ih, tilt: -0.014 },
    { x: rightX, y: pad, w: rightW, h: halfH, tilt: 0.018 },
    { x: rightX, y: pad + halfH + gap, w: rightW, h: halfH, tilt: -0.018 },
  ];
}

function drawBackground(ctx, grade, w, h) {
  const g = ctx.createLinearGradient(0, 0, w * 0.25, h);
  g.addColorStop(0, grade.bg[0]);
  g.addColorStop(0.52, grade.bg[1]);
  g.addColorStop(1, grade.bg[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const rg = ctx.createRadialGradient(w * 0.72, h * 0.2, 0, w * 0.72, h * 0.2, Math.max(w, h) * 0.75);
  rg.addColorStop(0, grade.glow);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
}

function drawEmptyPanel(ctx, grade, pw, ph) {
  const g = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
  g.addColorStop(0, grade.empty[0]);
  g.addColorStop(1, grade.empty[1]);
  ctx.fillStyle = g;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = Math.max(6, pw * 0.045);
  const step = Math.max(28, pw * 0.16);
  ctx.beginPath();
  for (let x = -pw; x < pw; x += step) {
    ctx.moveTo(-pw / 2 + x, ph / 2);
    ctx.lineTo(-pw / 2 + x + ph, -ph / 2);
  }
  ctx.stroke();
}

function drawPanelImage(ctx, img, t, pw, ph) {
  const iw = img.naturalWidth || img.width || 0;
  const ih = img.naturalHeight || img.height || 0;
  if (!iw || !ih) return;
  const scale = ((t && t.scale) || 100) / 100;
  const base = Math.max(pw / iw, ph / ih);
  const dw = iw * base * scale;
  const dh = ih * base * scale;
  const ox = Math.max(0, dw - pw);
  const oy = Math.max(0, dh - ph);
  const shiftX = (((t && t.offsetX) || 0) / 100) * 0.45 * ox;
  const shiftY = (((t && t.offsetY) || 0) / 100) * 0.45 * oy;
  ctx.drawImage(img, -dw / 2 + shiftX, -dh / 2 + shiftY, dw, dh);
}

function drawGradeOverlay(ctx, grade, pw, ph) {
  const g = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
  g.addColorStop(0, grade.overlay[0]);
  g.addColorStop(1, grade.overlay[1]);
  ctx.fillStyle = g;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
}

function drawCaption(ctx, state, w, h) {
  const raw = (state.caption || '').trim();
  if (!raw) return;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const text = raw.toUpperCase();
  const m = Math.min(w, h);
  let size = m * 0.115;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px Anton, Impact, sans-serif`;
  try {
    ctx.letterSpacing = `${Math.max(1, size * 0.03)}px`;
  } catch {
    // letterSpacing is not supported everywhere; ignore.
  }
  let measured = ctx.measureText(text).width;
  const maxW = w * 0.9;
  if (measured > maxW) {
    size = Math.max(18, size * (maxW / measured));
    ctx.font = `${size}px Anton, Impact, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(1, size * 0.03)}px`;
    } catch {
      // ignore
    }
    measured = ctx.measureText(text).width;
  }
  const cy = h * 0.8;
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
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, cy);

  const uw = Math.min(measured, w * 0.9);
  const uh = Math.max(3, size * 0.07);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(w / 2 - uw / 2, cy + size * 0.62, uw, uh);
}

export function drawCover(ctx, state, w, h) {
  const gradeKey = state.grade || 'sunset';
  const grade = GRADES[gradeKey] || GRADES.sunset;
  const layout = state.layout || 'classic';
  drawBackground(ctx, grade, w, h);
  const rects = getPanelRects(layout, w, h);
  const borderW = Math.max(6, Math.min(w, h) * 0.011);
  const images = state.images || [];
  const transforms = state.transforms || [];

  rects.forEach((rect, i) => {
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.tilt || 0);
    ctx.beginPath();
    ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.clip();
    const img = images[i];
    if (img) {
      drawPanelImage(ctx, img, transforms[i] || null, rect.w, rect.h);
    } else {
      drawEmptyPanel(ctx, grade, rect.w, rect.h);
    }
    drawGradeOverlay(ctx, grade, rect.w, rect.h);
    ctx.restore();
  });

  rects.forEach((rect, i) => {
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.tilt || 0);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = borderW * 1.6;
    ctx.shadowOffsetY = borderW * 0.5;
    ctx.lineWidth = borderW;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.restore();

    if (state.showSelection && state.selectedPanel === i) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt || 0);
      ctx.lineWidth = Math.max(3, borderW * 0.55);
      ctx.strokeStyle = grade.accent;
      ctx.strokeRect(
        -rect.w / 2 - borderW,
        -rect.h / 2 - borderW,
        rect.w + borderW * 2,
        rect.h + borderW * 2
      );
      ctx.restore();
    }
  });

  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.78
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  drawCaption(ctx, state, w, h);
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
