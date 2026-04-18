import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Starfield({ visible }) {
  const ref = useRef()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    const stars = []
    for (let i = 0; i < 120; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2, vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02 })
    }
    let raf = null
    function render() {
      ctx.clearRect(0,0,w,h)
      for (const s of stars) {
        s.x += s.vx
        s.y += s.vy
        if (s.x < 0) s.x = w
        if (s.x > w) s.x = 0
        if (s.y < 0) s.y = h
        if (s.y > h) s.y = 0
        ctx.beginPath()
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2)
        ctx.fill()
      }
      raf = requestAnimationFrame(render)
    }
    if (visible) render()
    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    })
    return () => { cancelAnimationFrame(raf) }
  }, [visible])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full z-0" />
}

export default function Intro({ visible, audioManager }) {
  const firstRef = useRef()

  useEffect(() => {
    if (!visible) return
    // trigger small bass pulse if available
    setTimeout(() => audioManager && audioManager.pulse && audioManager.pulse(), 900)
    setTimeout(() => audioManager && audioManager.bassDrop && audioManager.bassDrop(), 2600)
  }, [visible, audioManager])

  return (
    <section className={`absolute inset-0 flex items-center justify-center ${visible ? 'z-40' : 'z-0 pointer-events-none'}`}>
      <Starfield visible={visible} />

      <div className="relative z-10 max-w-3xl text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 8, scale: 1.02 }}
          animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="text-lg tracking-widest text-gray-300 mb-4"
        >In a world full of ordinary days…</motion.h2>

        <motion.h1
          initial={{ opacity: 0, scale: 1.06 }}
          animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0 }}
          transition={{ delay: 0.9, duration: 1.1 }}
          ref={firstRef}
          data-text="There exists someone… extraordinary."
          className="glitch text-3xl md:text-5xl font-extrabold neon-glow"
        >There exists someone… extraordinary.</motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 2.2, duration: 0.9 }}
          className="mt-8"
        >
          <div className="mx-auto w-36 h-1 bg-gradient-to-r from-neonPurple to-neonPink opacity-80 rounded" />
        </motion.div>
      </div>
    </section>
  )
}
