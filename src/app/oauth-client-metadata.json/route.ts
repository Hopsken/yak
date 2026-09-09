import { oauthClient } from '@/lib/auth'
export const dynamic = 'force-dynamic'
export async function GET() {
  return Response.json((await oauthClient()).metadata)
}
