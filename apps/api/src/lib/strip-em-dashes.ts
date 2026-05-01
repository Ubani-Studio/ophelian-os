/**
 * Strip em dashes (and en dashes used as em dashes) from any
 * generated text. Standing rule: never ship em dashes regardless
 * of how strongly the LLM wants them.
 *
 * Replacement strategy:
 *   - " — " (with surrounding spaces, used as a clause break)
 *     becomes ". " (sentence break, capitalising next char)
 *   - "—" (no spaces, used as a clause join inside a phrase)
 *     becomes ", "
 *   - " – " and "–" treated identically (some models sub en for em)
 *
 * Also collapses ".  ." artefacts that can result from the swap.
 */

export function stripEmDashes(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return input;
  let out = input;

  // Spaced variants first (most common, model-output shape).
  out = out.replace(/\s+[—–]\s+/g, '. ');
  // Unspaced.
  out = out.replace(/[—–]/g, ', ');
  // Capitalise after sentence break (only if the next char is a-z).
  out = out.replace(/\.\s+([a-z])/g, (_m, c) => `. ${c.toUpperCase()}`);
  // Collapse stray double periods.
  out = out.replace(/\.\s*\./g, '.');
  // Collapse ", ," doubles from clause-join replacement.
  out = out.replace(/,\s*,/g, ',');

  return out;
}

export function stripEmDashesInArray(input: string[]): string[] {
  return input.map((s) => stripEmDashes(s));
}
