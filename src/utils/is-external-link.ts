export function isExternalLink(link: string) {
  return /^(https?:|mailto:|tel:)/.test(link)
}
