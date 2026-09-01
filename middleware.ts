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
    path.startsWith('/login') ||
    path.startsWith('/auth') ||
    path.startsWith('/pending') ||
    // Parcours Academy en accès libre : une recrue se forme avant ses accès.
    path === '/parcours' ||
    path.startsWith('/parcours/')

  const token = request.cookies.get(TOKEN_COOKIE)?.value
  if (!token && !isPublic) {
    // Le middleware exige une URL **absolue** (Next la repasse par `new URL()`,
    // un `Location` relatif lève `ERR_INVALID_URL`). Mais `request.nextUrl`
    // reconstruit l'origine depuis l'adresse d'écoute (HOSTNAME=0.0.0.0) →
    // `http://0.0.0.0:3000`. On rebâtit donc l'URL à partir des en-têtes posés
    // par le reverse-proxy (`x-forwarded-host` / `x-forwarded-proto`), qui
    // portent le vrai domaine public.
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      request.nextUrl.host
    const proto =
      request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ||
      request.nextUrl.protocol.replace(':', '')
    return NextResponse.redirect(new URL('/login', `${proto}://${host}`))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|sounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|mp3|wav|ogg)$).*)',
  ],
}
