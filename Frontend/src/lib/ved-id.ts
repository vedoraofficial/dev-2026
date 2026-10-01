/**
 * The backend matches VEDORA IDs exactly, so tidy what was typed first:
 * "ved000001" → "VED000001", and the Root Admin's VED0108 / VED000108 → VED108.
 */
export function normalizeVedId(input: string): string {
  const id = input.trim().toUpperCase()
  return Number(id.replace(/\D/g, "")) === 108 ? "VED108" : id
}
