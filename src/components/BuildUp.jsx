import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function BuildUp({ visible }) {
  useEffect(() => {
    // small side-effect placeholder for cinematic timing
  }, [visible])

  return (
    <section className={`absolute inset-0 flex items-center justify-center ${visible ? 'z-30' : 'z-0 pointer-events-none'}`}>
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={visible ? { scale: 1, opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="text-center z-20 px-6"
        >
          <motion.h1
            className="text-6xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonPink to-neonPurple drop-shadow-2xl"
            animate={visible ? { scale: [1, 1.06, 1], rotate: [0, 0.5, 0] } : {}}
            transition={{ times: [0, 0.5, 1], duration: 1.2 }}
          >
            Srijita.
          </motion.h1>

          <motion.p
            className="mt-6 text-xl md:text-2xl text-gray-200"
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >A name… that changed everything.</motion.p>
        </motion.div>

        {/* Manga-style speed lines */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="speed-line" style={{ top: '25%', left: '2%', width: '60%', transform: 'skewX(-20deg)', opacity: 0.12 }} />
          <div className="speed-line" style={{ top: '45%', left: '8%', width: '80%', transform: 'skewX(-18deg)', opacity: 0.09 }} />
          <div className="speed-line" style={{ top: '65%', left: '0%', width: '70%', transform: 'skewX(-22deg)', opacity: 0.07 }} />
        </div>
      </div>
    </section>
  )
}
