import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Section({ children, bg, offset = 0 }) {
  return (
    <section className="min-h-screen flex items-center justify-center relative px-6">
      <motion.div
        className="max-w-3xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        {children}
      </motion.div>
    </section>
  )
}

export default function Journey({ visible }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!visible) return
    // subtle parallax
    const el = containerRef.current
    function onScroll() {
      const y = window.scrollY
      if (el) el.style.backgroundPosition = `50% ${-y * 0.08}px`
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [visible])

  return (
    <div ref={containerRef} className={`w-full ${visible ? 'relative z-20' : 'hidden'}`}>
      <div className="absolute inset-0 -z-10 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.06), transparent 10%), radial-gradient(circle at 90% 80%, rgba(244,63,94,0.04), transparent 12%)' }} />

      <Section>
        <h2 className="text-2xl md:text-4xl font-semibold neon-glow">The way you smile…</h2>
        <p className="mt-4 text-gray-300">It folds light into ordinary moments and makes them glow.</p>
      </Section>

      <Section>
        <h2 className="text-2xl md:text-4xl font-semibold neon-glow">The way you exist…</h2>
        <p className="mt-4 text-gray-300">A warmth that shifts the atmosphere, gently and inevitably.</p>
      </Section>

      <Section>
        <h2 className="text-2xl md:text-4xl font-semibold neon-glow">It makes the world brighter.</h2>
        <p className="mt-4 text-gray-300">Quiet, poetic, and true — like a soft lens flare across a memory.</p>
      </Section>
    </div>
  )
}
