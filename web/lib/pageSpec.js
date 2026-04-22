/** Parse user page spec like "1,3-5,7" (1-based) into sorted unique 0-based indices capped by totalPages */
export function parsePageSpec(spec, totalPages) {
  if (!spec || !String(spec).trim()) return null;
  const set = new Set();
  const parts = String(spec).split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = parseInt(m[1], 10);
      let b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let n = a; n <= b; n++) {
        const idx = n - 1;
        if (idx >= 0 && idx < totalPages) set.add(idx);
      }
    } else if (/^\d+$/.test(p)) {
      const idx = parseInt(p, 10) - 1;
      if (idx >= 0 && idx < totalPages) set.add(idx);
    }
  }
  return Array.from(set).sort((x, y) => x - y);
}
