import { NextResponse, type NextRequest } from 'next/server'
import { TOKEN_COOKIE } from '@/lib/api/client'

/**
 * Callback OAuth Discord — l'API (api-sams) a déjà échangé le code et émis un
 * access token, transmis ici en query (`?token=…`). On le pose en cookie
 * httpOnly puis on laisse la racine décider (app ou /pending).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const token = searchParams.get('token')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }
  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=token_manquant`)
  }

  const res = NextResponse.redirect(`${origin}/`)
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    // `secure` uniquement en HTTPS — sinon le cookie n'est pas renvoyé sur
    // http://localhost (build de prod) et la session est perdue.
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  })
  return res
}
