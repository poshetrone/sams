import { Icons } from './Icons'

/** Vue placeholder en attendant l'implémentation du module (étape 2). */
export default function PlaceholderView({
  icon = 'pulse',
  title,
  children,
}: {
  icon?: string
  title: string
  children?: React.ReactNode
}) {
  const I = Icons[icon] || Icons.pulse
  return (
    <div className="placeholder-view view-anim">
      <div className="pv-ico">
        <I size={32} />
      </div>
      <h3>{title}</h3>
      <p>{children || 'Module à venir — sera implémenté dans une prochaine étape.'}</p>
    </div>
  )
}
