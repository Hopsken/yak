import { NextResponse } from 'next/server'
import {
  appSession,
  assertOrigin,
  devClient,
  devLoginEnabled,
  loginNonce,
  oauthClient,
  oauthStorage
} from '@/lib/auth'
import { settings } from '@/lib/atproto'
import { OAuthCookieSizeError } from '@/lib/oauth-storage'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params
  if (action === 'dev' && !devLoginEnabled())
    return new Response('Not found', { status: 404 })
  try {
    assertOrigin(request)
    const session = await appSession()
    if (action === 'logout') {
      const storage = await oauthStorage()
      try {
        if (session.mode === 'oauth' && session.did === settings().did)
          await (await oauthClient(storage)).revoke(settings().did)
      } catch {
        // Local logout still succeeds when the PDS cannot revoke the session.
      }
      await storage.sessions.clear()
      await storage.states.clear()
      session.destroy()
      return NextResponse.redirect(
        new URL('/admin', request.headers.get('origin')!),
        303
      )
    }
    if (action === 'dev') {
      await devClient()
      session.did = settings().did
      session.mode = 'dev'
      await session.save()
      return NextResponse.redirect(
        new URL('/admin', request.headers.get('origin')!),
        303
      )
    }
    if (action !== 'login') return new Response('Not found', { status: 404 })
    const nonce = loginNonce()
    session.oauthNonce = nonce
    await session.save()
    const { url } = await (
      await oauthClient()
    ).authorize({
      target: { type: 'account', identifier: settings().did },
      state: { nonce }
    })
    return NextResponse.redirect(url, 303)
  } catch (error) {
    if (error instanceof OAuthCookieSizeError)
      return new Response(error.message, { status: 400 })
    if (process.env.NODE_ENV === 'development')
      console.error(
        'OAuth authorization:',
        error instanceof Error ? error.message : 'Unknown failure'
      )
    return new Response(
      'Authentication failed. Check configuration and try again.',
      { status: 400 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  if ((await params).action !== 'callback')
    return new Response('Not found', { status: 404 })
  try {
    const app = await appSession()
    if (!app.oauthNonce)
      return new Response('Invalid login session', { status: 403 })
    const { session, state } = await (
      await oauthClient()
    ).callback(new URL(request.url).searchParams)
    if (
      !app.oauthNonce ||
      (state as { nonce?: string })?.nonce !== app.oauthNonce ||
      session.did !== settings().did
    ) {
      await session.signOut().catch(() => {})
      return new Response('Invalid login session', { status: 403 })
    }
    delete app.oauthNonce
    app.did = session.did
    app.mode = 'oauth'
    await app.save()
    return NextResponse.redirect(new URL('/admin', settings().origin), 303)
  } catch (error) {
    return new Response(
      error instanceof OAuthCookieSizeError
        ? error.message
        : 'OAuth callback failed. Start a new login.',
      {
        status: 400
      }
    )
  }
}
