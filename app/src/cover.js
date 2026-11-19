// Vice Cover Studio renderer — deterministic, no Math.random / Date
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LAYOUTS = {
  classic: {
    label: 'Classic Poster',
    panels: [
      [[0.02,0.02],[0.62,0.02],[0.58,0.58],[0.02,0.62]],
      [[0.64,0.02],[0.98,0.02],[0.98,0.36],[0.60,0.40]],
      [[0.60,0.42],[0.98,0.38],[0.98,0.68],[0.60,0.70]],
      [[0.02,0.64],[0.58,0.60],[0.62,0.98],[0.02,0.98]],
      [[0.64,0.72],[0.98,0.70],[0.98,0.98],[0.66,0.98]],
    ],
  },
  duo: {
    label: 'Duo Split',
    panels: [
      [[0.02,0.02],[0.52,0.02],[0.46,0.66],[0.02,0.66]],
      [[0.54,0.02],[0.98,0.02],[0.98,0.66],[0.48,0.66]],
      [[0.02,0.68],[0.98,0.68],[0.98,0.98],[0.02,0.98]],
    ],
  },
  grid: {
    label: 'Grid Collage',
    panels: [
      [[0.02,0.02],[0.33,0.02],[0.31,0.32],[0.02,0.34]],
      [[0.35,0.02],[0.66,0.02],[0.64,0.32],[0.33,0.32]],
      [[0.68,0.02],[0.98,0.02],[0.98,0.32],[0.66,0.32]],
      [[0.02,0.36],[0.31,0.34],[0.33,0.66],[0.02,0.68]],
      [[0.33,0.34],[0.64,0.34],[0.66,0.66],[0.35,0.66]],
      [[0.66,0.34],[0.98,0.34],[0.98,0.68],[0.68,0.66]],
      [[0.02,0.70],[0.98,0.70],[0.98,0.98],[0.02,0.98]],
    ],
  },
};

export const GRADES = {
  sunset: { label: 'Vice Sunset', colors: ['rgba(255,45,120,0.28)','rgba(255,140,0,0.22)','rgba(60,0,90,0.18)'], blend: 'overlay' },
  neon: { label: 'Neon Nights', colors: ['rgba(0,240,255,0.24)','rgba(255,0,180,0.26)','rgba(10,0,60,0.22)'], blend: 'overlay' },
  gold: { label: 'Golden Hour', colors: ['rgba(255,190,60,0.26)','rgba(255,110,40,0.16)','rgba(80,40,0,0.14)'], blend: 'overlay' },
  none: { label: 'Clean', colors: [], blend: 'source-over' },
};

const FALLBACK_GRADIENTS = [
  ['#ff5e3a','#ff2d78','#3b0066'],
  ['#0af','#f0f','#12003a'],
  ['#ffb347','#ff6b35','#5c1a00'],
  ['#22d3ee','#a855f7','#1e003a'],
  ['#facc15','#f97316','#7c2d12'],
  ['#34d399','#0ea5e9','#1e1b4b'],
  ['#f472b6','#fb923c','#581c87'],
];

function panelPath(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([fx, fy], i) => {
    const x = fx * W, y = fy * H;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h, panX, panY, zoom) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih) * (zoom || 1);
  const dw = iw * scale, dh = ih * scale;
  const dx = x + (w - dw) / 2 + (panX || 0) * w * 0.3;
  const dy = y + (h - dh) / 2 + (panY || 0) * h * 0.3;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawFallback(ctx, x, y, w, h, idx, gradeId) {
  const cols = FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, cols[0]); g.addColorStop(0.55, cols[1]); g.addColorStop(1, cols[2]);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // sun disc
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(x + w * 0.68, y + h * 0.32, Math.min(w, h) * 0.14, 0, Math.PI * 2); ctx.fill();
  // skyline silhouette
  ctx.fillStyle = 'rgba(10,5,25,0.88)';
  const rng = mulberry32(1234 + idx * 77);
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.08 + rng() * 0.12);
    const bh = h * (0.22 + rng() * 0.3);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    bx += bw + 2;
  }
  // palm silhouette hint
  ctx.strokeStyle = 'rgba(10,5,25,0.9)'; ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.beginPath(); ctx.moveTo(x + w * 0.18, y + h); ctx.quadraticCurveTo(x + w * 0.22, y + h * 0.6, x + w * 0.3, y + h * 0.42); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = -0.4 + i * 0.45;
    ctx.beginPath(); ctx.moveTo(x + w * 0.3, y + h * 0.42);
    ctx.quadraticCurveTo(x + w * 0.3 + Math.cos(a) * w * 0.12, y + h * 0.42 + Math.sin(a) * h * 0.1 - h * 0.06, x + w * 0.3 + Math.cos(a) * w * 0.2, y + h * 0.42 + Math.sin(a) * h * 0.14);
    ctx.stroke();
  }
}

export function drawCover(ctx, W, H, state) {
  ctx.save();
  ctx.fillStyle = '#0b0614';
  ctx.fillRect(0, 0, W, H);
  const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
  const panels = layout.panels;
  const gap = Math.max(4, W * 0.006);

  panels.forEach((poly, idx) => {
    // white keyline (slightly expanded)
    ctx.save();
    panelPath(ctx, poly, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    // inner clip inset by keyline: draw with stroke trick — clip then draw, then stroke white
    ctx.save();
    panelPath(ctx, poly, W, H);
    ctx.clip();
    // bounding box
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    poly.forEach(([fx, fy]) => { minX = Math.min(minX, fx); minY = Math.min(minY, fy); maxX = Math.max(maxX, fx); maxY = Math.max(maxY, fy); });
    const bx = minX * W, by = minY * H, bw = (maxX - minX) * W, bh = (maxY - minY) * H;
    const transform = (state.transforms && state.transforms[idx]) || { panX: 0, panY: 0, zoom: 1 };
    let img = null;
    if (state.onePhoto && state.images && state.images[state.selected ?? 0]) img = state.images[state.selected ?? 0];
    else if (state.images && state.images[idx]) img = state.images[idx];
    else if (state.images) { for (const im of state.images) { if (im) { img = im; break; } } }
    if (img && (img.complete === undefined || img.complete)) {
      // expand draw area to cover polygon
      drawImageCover(ctx, img, bx - bw * 0.15, by - bh * 0.15, bw * 1.3, bh * 1.3, transform.panX, transform.panY, transform.zoom);
    } else {
      drawFallback(ctx, bx - 10, by - 10, bw + 20, bh + 20, idx, state.grade);
    }
    ctx.restore();
    // keyline stroke + selection highlight
    ctx.save();
    panelPath(ctx, poly, W, H);
    ctx.lineWidth = Math.max(4, W * 0.007);
    ctx.strokeStyle = idx === state.selected ? '#00f0ff' : '#ffffff';
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, W * 0.002);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();
    ctx.restore();
  });

  // grade overlay
  const grade = GRADES[state.grade] || GRADES.sunset;
  if (grade.colors.length) {
    ctx.save();
    ctx.globalCompositeOperation = grade.blend === 'overlay' ? 'overlay' : 'source-over';
    const gg = ctx.createLinearGradient(0, 0, W * 0.3, H);
    gg.addColorStop(0, grade.colors[0]);
    gg.addColorStop(0.55, grade.colors[1]);
    gg.addColorStop(1, grade.colors[2] || grade.colors[0]);
    ctx.fillStyle = gg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // soft top glow
    ctx.save();
    const rg = ctx.createRadialGradient(W * 0.75, H * 0.08, 10, W * 0.75, H * 0.08, W * 0.7);
    rg.addColorStop(0, grade.colors[0].replace(/[\d.]+\)$/, '0.35)'));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // vignette
  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // seeded grain
  ctx.save();
  ctx.globalAlpha = 0.05;
  const rng = mulberry32(98765);
  const n = Math.floor((W * H) / 900);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    ctx.fillRect(rng() * W, rng() * H, 1.4, 1.4);
  }
  ctx.restore();

  // caption
  const caption = (state.caption || '').trim();
  if (caption) {
    ctx.save();
    const baseSize = (state.captionSize || 1) * W * 0.105;
    let fontSize = baseSize;
    const fontStack = '"Cover Display","Arial Narrow Bold","Arial Black",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // auto-fit: shrink until fits 92% width (accounting for stroke)
    const setFont = (s) => { ctx.font = `${s}px ${fontStack}`; };
    setFont(fontSize);
    const maxW = W * 0.92;
    while (ctx.measureText(caption.toUpperCase()).width > maxW && fontSize > 18) {
      fontSize *= 0.92; setFont(fontSize);
    }
    const cx = W / 2;
    const cy = state.captionPos === 'top' ? fontSize * 0.72 : H - fontSize * 0.72;
    // backing shadow plate for readability in top/bottom band? subtle
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = fontSize * 0.12;
    ctx.shadowOffsetY = fontSize * 0.06;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b0614';
    ctx.lineWidth = fontSize * 0.22;
    const text = caption.toUpperCase();
    ctx.strokeText(text, cx, cy);
    ctx.shadowColor = 'transparent';
    const tg = ctx.createLinearGradient(0, cy - fontSize / 2, 0, cy + fontSize / 2);
    tg.addColorStop(0, '#ffffff');
    tg.addColorStop(0.55, '#ffe9f6');
    tg.addColorStop(1, '#ffb3d9');
    ctx.fillStyle = state.grade === 'neon' ? '#e0fbff' : tg;
    if (state.grade === 'gold') ctx.fillStyle = '#fff7d6';
    ctx.fillText(text, cx, cy);
    // underline accent
    ctx.fillStyle = state.grade === 'neon' ? '#00f0ff' : '#ff2d78';
    const tw = ctx.measureText(text).width;
    ctx.fillRect(cx - tw / 2, cy + fontSize * 0.58, tw, Math.max(3, fontSize * 0.07));
    ctx.restore();
  }

  // studio tag
  ctx.save();
  ctx.font = `${Math.max(11, W * 0.016)}px "Arial Narrow Bold","Arial Black",sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'right';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6;
  const tagY = state.captionPos === 'top' ? H - 14 : 20;
  ctx.fillText('VICE COVER STUDIO', W - 14, tagY);
  ctx.restore();

  ctx.restore();
}

export function hitTestPanel(W, H, layoutId, px, py) {
  const layout = LAYOUTS[layoutId] || LAYOUTS.classic;
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const poly = layout.panels[i];
    let inside = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [xi, yi] = [poly[a][0] * W, poly[a][1] * H];
      const [xj, yj] = [poly[b][0] * W, poly[b][1] * H];
      if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    if (inside) return i;
  }
  return -1;
}
