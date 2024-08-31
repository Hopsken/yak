export function generateSlug(input: string) {
  return input
    .trim() // Remove leading and trailing spaces
    .toLowerCase() // Convert to lowercase (affects only ASCII letters)
    .normalize('NFKD') // Normalize to NFKD form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9\p{Script=Han}]+/gu, '-') // Replace non-alphanumeric and non-Chinese characters with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
}
