'use client'
/* SAMS — effet clic : étoile de vie EMS qui s'envole (porté depuis clickfx.js) */
import { useEffect } from 'react'

const NS = 'http://www.w3.org/2000/svg'
const COLORS = ['#e8c87a', '#c9a35a', '#5aa0d6', '#9fcdf0', '#ecd49a']

function starSVG(color: string): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('width', '30')
  svg.setAttribute('height', '30')
  const g = document.createElementNS(NS, 'g')
  g.setAttribute('transform', 'translate(50 50)')
  for (let i = 0; i < 6; i++) {
    const bar = document.createElementNS(NS, 'rect')
    bar.setAttribute('x', '-7')
    bar.setAttribute('y', '-44')
    bar.setAttribute('width', '14')
    bar.setAttribute('height', '44')
    bar.setAttribute('rx', '5')
    bar.setAttribute('fill', color)
    bar.setAttribute('transform', `rotate(${i * 60})`)
    g.appendChild(bar)
  }
  const dot = document.createElementNS(NS, 'circle')
  dot.setAttribute('r', '9')
  dot.setAttribute('fill', color)
  g.appendChild(dot)
  svg.appendChild(g)
  return svg
}

function burst(x: number, y: number) {
  const n = 2 + Math.floor(Math.random() * 2)
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div')
    el.className = 'ems-spark'
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    el.appendChild(starSVG(color))
    const dx = (Math.random() - 0.5) * 150
    const rise = 120 + Math.random() * 90
    const rot = (Math.random() - 0.5) * 220
    const scale = 0.55 + Math.random() * 0.7
    const dur = 1100 + Math.random() * 600
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    el.style.setProperty('--dx', dx + 'px')
    el.style.setProperty('--rise', '-' + rise + 'px')
    el.style.setProperty('--rot', rot + 'deg')
    el.style.setProperty('--sc', String(scale))
    el.style.filter = `drop-shadow(0 0 6px ${color})`
    el.style.animation = `emsRise ${dur}ms cubic-bezier(.22,.7,.3,1) forwards`
    el.style.animationDelay = i * 70 + 'ms'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), dur + i * 70 + 80)
  }
}

/** Monte l'écouteur de clic global pour l'effet d'étincelles EMS. */
export default function ClickFX() {
  useEffect(() => {
    const handler = (e: MouseEvent) => burst(e.clientX, e.clientY)
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])
  return null
}
