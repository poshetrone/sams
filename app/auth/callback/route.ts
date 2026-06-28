import { NextResponse, type NextRequest } from 'next/server'
import { TOKEN_COOKIE } from '@/lib/api/client'

/**
 * Callback OAuth Discord — l'API (api-sams) a déjà échangé le code et émis un
 * access token, transmis ici en query (`?token=…`). On le pose en cookie
 * httpOnly puis on laisse la racine décider (app ou /pending).
 *
 * NB : on redirige en **relatif** (`Location: "/…"`) et non via
 * `request.nextUrl.origin`. En sortie `standalone` derrière le reverse-proxy
 * (HOSTNAME=0.0.0.0 PORT=3000), Next reconstruit l'origine à partir de son
 * adresse d'écoute → `http://0.0.0.0:3000`, ce qui renvoyait le navigateur sur
 * 0.0.0.0:3000. Un `Location` relatif est résolu par le navigateur contre
 * l'URL courante (le vrai domaine), donc on reste sur le bon hôte.
 */
function relativeRedirect(path: string): NextResponse {
  return new NextResponse(null, { status: 302, headers: { location: path } })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const error = searchParams.get('error')

  if (error) {
    return relativeRedirect(`/login?error=${encodeURIComponent(error)}`)
  }
  if (!token) {
    return relativeRedirect('/login?error=token_manquant')
  }

  // Protocole public réel : derrière le proxy, `request.nextUrl.protocol` peut
  // être `http` (lien interne) alors que le site est servi en https. On se fie
  // d'abord à `x-forwarded-proto` posé par le proxy.
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ||
    request.nextUrl.protocol.replace(':', '')

  const res = relativeRedirect('/')
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    // `secure` uniquement en HTTPS — sinon le cookie n'est pas renvoyé sur
    // http://localhost (build de prod) et la session est perdue.
    secure: proto === 'https',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  })
  return res
}
