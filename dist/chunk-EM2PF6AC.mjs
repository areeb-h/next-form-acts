// src/shared/normalizeFieldErrors.ts
function normalizeFieldErrors(src) {
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    if (v && v.length) out[String(k)] = v;
  }
  return out;
}

export {
  normalizeFieldErrors
};
