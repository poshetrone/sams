import { NextResponse, type NextRequest } from 'next/server'

/** Cookie httpOnly portant l'access token (posé au callback Discord). */
const TOKEN_COOKIE = 'sams_token'

/**
 * Gate d'authentification — remplace le refresh de session Supabase.
 * Sans token et hors page publique → redirection vers /login.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublic =
    path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/pending')

  const token = request.cookies.get(TOKEN_COOKIE)?.value
  if (!token && !isPublic) {
    // Redirection relative : derrière le reverse-proxy (sortie `standalone`,
    // HOSTNAME=0.0.0.0), `request.nextUrl` reconstruit l'origine en
    // `http://0.0.0.0:3000`. Un `Location` relatif reste sur le vrai domaine.
    return new NextResponse(null, { status: 307, headers: { location: '/login' } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|sounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|mp3|wav|ogg)$).*)',
  ],
}
