import Script from 'next/script'
import config from '../../../../yak.config'

export function Analytics() {
  const { umami } = config.analytics || {}

  if (umami) {
    return (
      <Script
        defer
        src={`https://${umami.host}/script.js`}
        data-website-id={umami.websiteId}
      />
    )
  }

  return null
}
