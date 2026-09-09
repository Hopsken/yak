import { settings, publicClient } from '@/lib/atproto'
import { findPublication } from '@/lib/publication'
export const dynamic = 'force-dynamic'
export async function GET() {
  const publication = await findPublication(await publicClient(), settings())
  if (!publication)
    return new Response('Publication not found', { status: 404 })
  return new Response(publication, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
