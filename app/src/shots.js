export const SHOT_SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

function positiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parseShotParams(search) {
  const params = new URLSearchParams(search || '');
  return {
    shot: params.get('shot') || null,
    layout: params.get('layout') || 'classic',
    photo: params.get('photo') || 'boulevard',
    caption: params.get('caption') || 'Vice Heat',
    grade: params.get('grade') || 'sunset',
    w: positiveInt(params.get('w'), 1280),
    h: positiveInt(params.get('h'), 720),
  };
}

export function sizeForKey(key) {
  return SHOT_SIZES[key] || SHOT_SIZES['1080x1080'];
}
