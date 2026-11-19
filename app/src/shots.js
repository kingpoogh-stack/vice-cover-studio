// Reading the ?shot=... parameters that capture.js uses for screenshots.

export function parseShot(searchText) {
  const params = new URLSearchParams(searchText ?? window.location.search);
  const mode = params.get('shot');
  if (!mode) return null;
  return {
    mode,
    layout: params.get('layout') || 'classic',
    photo: params.get('photo') || 'boulevard',
    caption: params.get('caption') || 'Vice Heat',
    grade: params.get('grade') || 'sunset',
  };
}

export function isShotMode() {
  return new URLSearchParams(window.location.search).has('shot');
}
