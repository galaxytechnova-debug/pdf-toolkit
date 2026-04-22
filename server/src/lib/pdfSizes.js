/** Page sizes in PDF points (1/72 inch) */
const SIZES = {
  a4: { width: 595.28, height: 841.89 },
  a3: { width: 841.89, height: 1190.55 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
};

function swap(o) {
  return { width: o.height, height: o.width };
}

function getPageBox(key, landscape) {
  const base = SIZES[key] || SIZES.a4;
  return landscape ? swap(base) : { ...base };
}

module.exports = { SIZES, getPageBox };
