'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/Icons'
import { GRADES, type GradeKey } from '@/lib/constants'
import { initialsOf } from '@/lib/format'
import { useApp } from '@/lib/app-context'
import { addPost, deletePost, toggleLike } from '@/lib/actions/trombi'
import { handleImageInput } from '@/lib/image'
import { useRealtime } from '@/lib/useRealtime'
import type { TrombiPost } from '@/lib/types'

export default function TrombiView({ posts }: { posts: TrombiPost[] }) {
  const router = useRouter()
  const { member, isAdmin } = useApp()
  useRealtime('trombi_posts')
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight
  }, [posts.length])

  const onPhoto = (file?: File) => {
    handleImageInput(file, setPhoto)
  }
  const send = async () => {
    if (!text.trim() && !photo) return
    const res = await addPost(text, photo)
    if (res.ok) { setText(''); setPhoto(null); router.refresh() }
  }
  const del = async (id: string) => { await deletePost(id); router.refresh() }
  const like = async (id: string) => { await toggleLike(id); router.refresh() }

  return (
    <div className="view-anim trombi">
      <div className="tb-wall" ref={endRef}>
        {posts.map((p) => {
          const me = p.author === member.name
          const g = GRADES[p.grade as GradeKey] || ({} as { color?: string; label?: string })
          const likers = p.likers || []
          const liked = likers.includes(member.name)
          return (
            <div className={`tb-msg ${me ? 'me' : ''}`} key={p.id}>
              <div className="tb-av">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt="" />
                ) : (
                  <span>{initialsOf(p.author || '?')}</span>
                )}
              </div>
              <div className="tb-bubble-wrap">
                <div className="tb-meta"><b>{p.author}</b><span className="tb-grade" style={{ color: g.color }}>{g.label}</span><span className="tb-time">{p.time}</span></div>
                <div className="tb-bubble">
                  {p.text && <p>{p.text}</p>}
                  {p.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="tb-shot" src={p.photo} alt="" />
                  )}
                  {isAdmin && <div className="tb-del" title="Supprimer (Direction)" onClick={() => del(p.id)}><Icons.trash size={13} /></div>}
                </div>
                <div className={`tb-like ${liked ? 'on' : ''}`} onClick={() => like(p.id)} title={likers.length ? likers.join(', ') : 'Aimer'}>
                  <Icons.heart size={14} />{likers.length > 0 && <span>{likers.length}</span>}
                </div>
              </div>
            </div>
          )
        })}
        {posts.length === 0 && <div style={{ textAlign: 'center', color: 'var(--ink-500)', padding: 40 }}>Aucun message. Soyez le premier à poster !</div>}
      </div>

      <div className="tb-composer">
        {photo && (
          <div className="tb-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" />
            <div className="tb-preview-x" onClick={() => setPhoto(null)}><Icons.x size={13} /></div>
          </div>
        )}
        <div className="tb-inputrow">
          <div className="tb-iconbtn" title="Ajouter une photo" onClick={() => fileRef.current?.click()}><Icons.camera size={18} /></div>
          <input className="tb-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Écrivez un message…" />
          <button className="btn-neon-gold" onClick={send}><Icons.chevR size={16} /> Envoyer</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onPhoto(e.target.files?.[0])} />
        </div>
      </div>
    </div>
  )
}
