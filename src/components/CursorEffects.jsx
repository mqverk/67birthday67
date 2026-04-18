import React, { useEffect, useRef } from 'react'

export default function CursorEffects() {
  const ref = useRef()

  useEffect(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.style.position = 'fixed'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '60'
    document.body.appendChild(canvas)
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    const particles = []

    function spawn(x, y) {
      particles.push({ x, y, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 1.2 - 0.4, life: 80 + Math.random() * 40, r: 6 + Math.random() * 8 })
    }

    function onMove(e) {
      const x = e.clientX
      const y = e.clientY
      spawn(x, y)
      if (Math.random() > 0.85) spawn(x + (Math.random()-0.5)*40, y + (Math.random()-0.5)*40)
    }

    function loop() {
      ctx.clearRect(0,0,w,h)
      for (let i = particles.length - 1; i >=0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= 1
        const alpha = Math.max(0, p.life / 120)
        ctx.beginPath()
        ctx.fillStyle = `rgba(244,63,94,${alpha})`
        ctx.arc(p.x, p.y, p.r * (alpha*0.9), 0, Math.PI*2)
        ctx.fill()
        if (p.life <= 0) particles.splice(i,1)
      }
      requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight })
    loop()

    return () => {
      window.removeEventListener('mousemove', onMove)
      try { document.body.removeChild(canvas) } catch {}
    }
  }, [])

  return <div ref={ref} />
}
