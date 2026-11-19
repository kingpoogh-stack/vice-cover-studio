// Shot mode: ?shot=cover / ?shot=editor
export function parseShot() {
  const p = new URLSearchParams(location.search);
  return {
    mode: p.get('shot'),
    layout: p.get('layout'),
    photo: p.get('photo'),
    caption: p.get('caption'),
    grade: p.get('grade'),
  };
}
export function isShotMode() {
  return new URLSearchParams(location.search).has('shot');
}
