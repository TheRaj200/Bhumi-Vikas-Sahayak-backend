export function isMissing(v) {
  return v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v));
}

export function getPath(obj, path) {
  if (!obj || !path) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length; i++) {
    if (curr === null || curr === undefined || typeof curr !== 'object') return undefined;
    const p = parts[i];
    if (p in curr) {
      curr = curr[p];
    } else {
      // Check if remaining slice is a single key
      const rest = parts.slice(i).join('.');
      if (rest in curr) {
        return curr[rest];
      }
      return undefined;
    }
  }
  return curr;
}
