import React, { useEffect } from 'react'
import confetti from 'canvas-confetti'

export default function Reveal({ visible, audioManager }) {
  useEffect(() => {
    if (!visible) return
    // short silence then explosion
    const t1 = setTimeout(() => {
      // pulse audio
      audioManager && audioManager.pulse && audioManager.pulse()
    }, 500)

    const t2 = setTimeout(() => {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.4 } })
      confetti({ particleCount: 80, spread: 160, origin: { y: 0.6 } })
      // hearts: small confetti with heart-shaped particles could be simulated by emojis, but requirement forbids emojis.
      // We'll use colored confetti and a soft pulsing glow element instead.
    }, 900)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [visible, audioManager])

  return (
    <section className={`absolute inset-0 flex items-center justify-center ${visible ? 'z-40' : 'z-0 pointer-events-none'}`}>
      <div className="text-center z-50 px-6">
        <h1 className="text-4xl md:text-8xl font-extrabold neon-glow text-center tracking-wide" style={{ textShadow: '0 0 36px rgba(251,191,36,0.9), 0 0 12px rgba(244,63,94,0.6)' }}>
          HAPPY BIRTHDAY
        </h1>
        <h2 className="mt-4 text-3xl md:text-6xl font-bold neon-glow">SRIJITA</h2>

        <div className="mt-6 flex justify-center">
          <div className="w-48 h-48 rounded-full glass flex items-center justify-center neon-glow" style={{ boxShadow: '0 0 40px rgba(139,92,246,0.3)' }}>
            <div className="text-center">
              <div className="text-sm text-gray-200">This moment</div>
              <div className="text-lg font-semibold">Is for you</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
