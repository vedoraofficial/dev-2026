/**
 * The backend matches VEDORA IDs exactly, so tidy what was typed first:
 * "ved000001" → "VED000001", and the Root Admin's short forms VED0108 / VED00108 → VED108.
 * Six-digit IDs are partners and stay as they are — VED000108 is a real partner, not Admin.
 */
export function normalizeVedId(input: string): string {
  const id = input.trim().toUpperCase()
  const digits = id.replace(/\D/g, "")
  return digits.length < 6 && Number(digits) === 108 ? "VED108" : id
}
