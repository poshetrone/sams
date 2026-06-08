'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icons } from '@/components/Icons'
import { initialsOf } from '@/lib/format'

export default function PendingScreen({ name, pseudo }: { name: string; pseudo: string }) {
  const router = useRouter()

  const back = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="pending-wrap">
      <div className="pending-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/sams-logo.png" alt="SAMS" />
        <div className="pulse-ring">
          <Icons.clock size={28} />
        </div>
        <h2>Demande en cours d&apos;examen</h2>
        <p>Votre demande d&apos;accès a bien été transmise à la Direction du SAMS.</p>
        <div className="who-chip">
          <div className="av">{initialsOf(name)}</div>
          <b>{name}</b>
          {pseudo && <span style={{ color: 'var(--ink-400)', fontSize: 12 }}>· {pseudo}</span>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>
          Un Directeur ou Co-Directeur doit valider votre accès. Vous recevrez une notification Discord dès
          l&apos;approbation.
        </p>
        <button className="btn btn-ghost" style={{ marginTop: 26 }} onClick={back}>
          <Icons.arrowL size={15} /> Retour à la connexion
        </button>
      </div>
    </div>
  )
}
