'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Icons, Laurel } from '@/components/Icons'

/** Écran de connexion SAMS — fidèle au proto, branché sur Discord OAuth (Supabase). */
export default function LoginScreen() {
  // Client Supabase initialisé une seule fois (avant tout clic) — évite la
  // course à l'init qui obligeait à cliquer deux fois.
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      // On pilote la redirection nous-mêmes (skipBrowserRedirect) pour qu'un
      // seul clic suffise, sans dépendre du timing interne du SDK.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('URL de connexion Discord indisponible.')
        setLoading(false)
      }
    } catch (e) {
      setError((e as Error).message || 'Erreur de connexion')
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-art">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold-500)', position: 'relative', zIndex: 1 }}>
          <Icons.pulse size={20} />{' '}
          <span style={{ letterSpacing: 3, fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>
            Portail médical sécurisé
          </span>
        </div>
        <div className="login-emblem">
          <Laurel size={64} side="left" className="login-laurel l" />
          <Laurel size={64} side="right" className="login-laurel r" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/sams-logo.png" alt="SAMS" />
          <div className="etxt">
            <h1>S.A.M.S</h1>
            <p>San Andreas Medical Services</p>
          </div>
        </div>
        <div className="motto">
          <span>LIFE</span>
          <span className="sep">·</span>
          <span>CARE</span>
          <span className="sep">·</span>
          <span>COMMITMENT</span>
        </div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <div className="lf-head">
            <h2>Connexion</h2>
            <p>Accès réservé au personnel du service médical. Authentifiez-vous avec votre compte Discord.</p>
          </div>
          <button className="btn-discord" onClick={signIn} disabled={loading}>
            <Icons.discord size={20} /> {loading ? 'Redirection…' : 'Se connecter avec Discord'}
          </button>
          <div className="divider">
            <span className="l"></span>nouveau membre<span className="l"></span>
          </div>
          <button className="btn-recruit" onClick={signIn} disabled={loading}>
            Demander un accès (recrue)
          </button>
          {error && (
            <div style={{ color: 'var(--crit)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</div>
          )}
          <div className="login-foot">
            En vous connectant, vous acceptez le règlement intérieur du SAMS.
            <br />
            Vos accès sont validés par la Direction.
          </div>
        </div>
      </div>
    </div>
  )
}
