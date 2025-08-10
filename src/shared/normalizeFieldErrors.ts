// src/shared/normalizeFieldErrors.ts
export type ZodFieldErrors = Record<PropertyKey, string[] | undefined>;

export function normalizeFieldErrors(src: ZodFieldErrors): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(src)) {
    if (v && v.length) out[String(k)] = v;  // keep only populated arrays
  }
  return out;
}
