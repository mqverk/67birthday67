import React, { useEffect, useState } from 'react'
import { Play, Pause, Repeat, Music, Volume2 } from 'lucide-react'

export default function Controls({ onReplay, audioManager }) {
  const [playing, setPlaying] = useState(false)
  const [track, setTrack] = useState('piano')

  useEffect(() => {
    // reflect audioManager state
  }, [audioManager])

  function togglePlay() {
    if (!audioManager) return
    if (!playing) {
      audioManager.play(track)
      setPlaying(true)
    } else {
      audioManager.stop()
      setPlaying(false)
    }
  }

  function cycleTrack() {
    const order = ['piano', 'lofi', 'ost']
    const idx = order.indexOf(track)
    const next = order[(idx + 1) % order.length]
    setTrack(next)
    if (playing) audioManager.play(next)
  }

  return (
    <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
      <button onClick={cycleTrack} className="glass p-2 rounded-md flex items-center gap-2">
        <Music size={18} />
        <span className="text-sm">{track}</span>
      </button>

      <button onClick={togglePlay} className="glass p-2 rounded-md">
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <button onClick={onReplay} className="glass p-2 rounded-md">
        <Repeat size={18} />
      </button>
    </div>
  )
}
