// Cover renderer: angled poster panels, per-panel crop, colour grades,
// and a heavy caption across the lower third. Plain Canvas 2D, no libraries.

export function getPanelRects(layout, width, height) {
  const pad = Math.round(Math.min(width, height) * 0.035);
  const gap = Math.round(Math.min(width, height) * 0.022);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  if (layout === 'duo') {
    const panelW = Math.floor((innerW - gap) / 2);
    return [
      { x: pad, y: pad, w: panelW, h: innerH, tilt: -0.012 },
      { x: pad + panelW + gap, y: pad, w: panelW, h: innerH, tilt: 0.012 },
    ];
  }
  if (layout === 'grid') {
    const panelW = Math.floor((innerW - gap) / 2);
    const panelH = Math.floor((innerH - gap) / 2);
    return [
      { x: pad, y: pad, w: panelW, h: panelH, tilt: -0.01 },
      { x: pad + panelW + gap, y: pad, w: panelW, h: panelH, tilt: 0.01 },
      { x: pad, y: pad + panelH + gap, w: panelW, h: panelH, tilt: 0.01 },
      { x: pad + panelW + gap, y: pad + panelH + gap, w: panelW, h: panelH, tilt: -0.01 },
    ];
  }
  // classic: one large panel on the left, two stacked panels on the right
  const mainW = Math.floor(innerW * 0.62);
  const sideW = innerW - mainW - gap;
  const sideH = Math.floor((innerH - gap) / 2);
  return [
    { x: pad, y: pad, w: mainW, h: innerH, tilt: -0.014 },
    { x: pad + mainW + gap, y: pad, w: sideW, h: sideH, tilt: 0.018 },
    { x: pad + mainW + gap, y: pad + sideH + gap, w: sideW, h: sideH, tilt: -0.018 },
  ];
}

function paintBackgroundGradient(ctx, width, height, grade) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  if (grade === 'neon') {
    grad.addColorStop(0, '#160b2e'); grad.addColorStop(0.55, '#3b1150'); grad.addColorStop(1, '#0a1a33');
  } else if (grade === 'gold') {
    grad.addColorStop(0, '#2e1a08'); grad.addColorStop(0.55, '#5c3410'); grad.addColorStop(1, '#1c1006');
  } else {
    grad.addColorStop(0, '#2b0f2e'); grad.addColorStop(0.55, '#6e2145'); grad.addColorStop(1, '#1a0b26');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function applyGradeOverlay(ctx, rect, grade) {
  ctx.save();
  if (grade === 'neon') {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, 'rgba(255,0,160,0.28)'); g.addColorStop(0.5, 'rgba(90,0,180,0.10)'); g.addColorStop(1, 'rgba(0,210,255,0.30)');
    ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(0,255,230,0.10)'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else if (grade === 'gold') {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, 'rgba(255,190,60,0.16)'); g.addColorStop(0.6, 'rgba(255,130,30,0.10)'); g.addColorStop(1, 'rgba(60,25,0,0.34)');
    ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, 'rgba(255,120,80,0.10)'); g.addColorStop(0.55, 'rgba(255,60,140,0.14)'); g.addColorStop(1, 'rgba(30,5,50,0.38)');
    ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    // lifted shadows: a soft warm wash low in the frame
    ctx.fillStyle = 'rgba(255,170,90,0.08)'; ctx.fillRect(rect.x, rect.y + rect.h * 0.55, rect.w, rect.h * 0.45);
  }
  ctx.restore();
}

function drawImageCoverFitted(ctx, image, rect, transform) {
  if (!image) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#533'); g.addColorStop(1, '#225');
    ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const scaleFactor = Math.max(rect.w / image.width, rect.h / image.height) * (transform?.scale || 1);
  const drawnW = image.width * scaleFactor;
  const drawnH = image.height * scaleFactor;
  const offsetX = ((transform?.offsetX || 0) / 100) * Math.max(0, drawnW - rect.w) * 0.9;
  const offsetY = ((transform?.offsetY || 0) / 100) * Math.max(0, drawnH - rect.h) * 0.9;
  const dx = rect.x + (rect.w - drawnW) / 2 + offsetX;
  const dy = rect.y + (rect.h - drawnH) / 2 + offsetY;
  ctx.drawImage(image, dx, dy, drawnW, drawnH);
}

function drawSinglePanel(ctx, rect, image, transform, grade, isSelected) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rect.tilt || 0);
  ctx.translate(-cx, -cy);
  // white poster border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rect.x - 7, rect.y - 7, rect.w + 14, rect.h + 14);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  drawImageCoverFitted(ctx, image, rect, transform);
  applyGradeOverlay(ctx, rect, grade);
  ctx.restore();
  if (isSelected) {
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 5;
    ctx.strokeRect(rect.x - 7, rect.y - 7, rect.w + 14, rect.h + 14);
  }
  ctx.restore();
}

function drawBoldCaption(ctx, width, height, caption, grade) {
  const text = (caption || '').trim().toUpperCase();
  if (!text) return;
  const baseSize = Math.round(height * 0.115);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = baseSize;
  ctx.font = `${fontSize}px Anton, sans-serif`;
  const maxWidth = width * 0.92;
  while (ctx.measureText(text).width > maxWidth && fontSize > 18) {
    fontSize = Math.round(fontSize * 0.92);
    ctx.font = `${fontSize}px Anton, sans-serif`;
  }
  const y = height * 0.845;
  // backing band so lettering reads over any photo
  const bandH = fontSize * 1.45;
  const bandGrad = ctx.createLinearGradient(0, y - bandH / 2, 0, y + bandH / 2);
  bandGrad.addColorStop(0, 'rgba(10,4,18,0)');
  bandGrad.addColorStop(0.35, 'rgba(10,4,18,0.72)');
  bandGrad.addColorStop(0.65, 'rgba(10,4,18,0.72)');
  bandGrad.addColorStop(1, 'rgba(10,4,18,0)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, y - bandH / 2, width, bandH);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = Math.round(fontSize * 0.18);
  ctx.shadowOffsetY = Math.round(fontSize * 0.06);
  ctx.strokeStyle = '#14061f';
  ctx.lineWidth = Math.max(4, fontSize * 0.14);
  ctx.strokeText(text, width / 2, y);
  const fillGrad = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
  if (grade === 'neon') { fillGrad.addColorStop(0, '#ffffff'); fillGrad.addColorStop(0.55, '#7df9ff'); fillGrad.addColorStop(1, '#ff5ee1'); }
  else if (grade === 'gold') { fillGrad.addColorStop(0, '#fff7d6'); fillGrad.addColorStop(0.55, '#ffd257'); fillGrad.addColorStop(1, '#ff8a3c'); }
  else { fillGrad.addColorStop(0, '#ffffff'); fillGrad.addColorStop(0.55, '#ffb3d1'); fillGrad.addColorStop(1, '#ff5e62'); }
  ctx.fillStyle = fillGrad;
  ctx.fillText(text, width / 2, y);
  ctx.restore();
}

function drawVignette(ctx, width, height) {
  const radial = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.42, width / 2, height / 2, Math.max(width, height) * 0.78);
  radial.addColorStop(0, 'rgba(0,0,0,0)');
  radial.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
}

export function drawCover(ctx, width, height, options) {
  const { images = [], layout = 'classic', caption = 'Vice Heat', grade = 'sunset', transforms = [], selectedIndex = -1 } = options || {};
  paintBackgroundGradient(ctx, width, height, grade);
  const rects = getPanelRects(layout, width, height);
  rects.forEach((rect, index) => {
    const image = images[index] || images[0] || null;
    drawSinglePanel(ctx, rect, image, transforms[index], grade, index === selectedIndex);
  });
  drawBoldCaption(ctx, width, height, caption, grade);
  drawVignette(ctx, width, height);
  return rects;
}

export function exportCoverPNG(width, height, options) {
  return new Promise((resolve) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    drawCover(ctx, width, height, { ...options, selectedIndex: -1 });
    offscreen.toBlob((blob) => resolve(blob), 'image/png');
  });
}
