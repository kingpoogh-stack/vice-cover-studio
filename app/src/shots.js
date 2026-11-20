// Shot-mode helpers for Vice Cover Studio.

export const SHOT_SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

export function parseShotParams(search) {
  const params = new URLSearchParams(search || '');
  const w = parseInt(params.get('w') || '', 10);
  const h = parseInt(params.get('h') || '', 10);
  return {
    shot: params.get('shot') || null,
    layout: params.get('layout') || 'classic',
    photo: params.get('photo') || 'boulevard',
    caption: params.get('caption') || 'Vice Heat',
    grade: params.get('grade') || 'sunset',
    w: Number.isFinite(w) && w > 0 ? w : 1280,
    h: Number.isFinite(h) && h > 0 ? h : 720,
  };
}

export function sizeForKey(key) {
  return SHOT_SIZES[key] || SHOT_SIZES['1080x1080'];
}
