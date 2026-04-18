import React, { useEffect, useRef, useState } from 'react'
import Intro from './components/Intro'
import BuildUp from './components/BuildUp'
import Journey from './components/Journey'
import Reveal from './components/Reveal'
import Messages from './components/Messages'
import Controls from './components/Controls'
import CursorEffects from './components/CursorEffects'
import { AudioManager } from './utils/audio'

export default function App() {
  const [stage, setStage] = useState('intro')
  const audioRef = useRef(null)
  const sequenceRef = useRef(null)

  useEffect(() => {
    audioRef.current = new AudioManager()
    audioRef.current.init()
    // start cinematic automatically (audio may require user interaction in browser)
    playSequence()
    return () => {
      if (sequenceRef.current) clearTimeout(sequenceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function playSequence() {
    setStage('intro')
    // chain timeline: intro -> buildup -> journey -> reveal -> messages
    sequenceRef.current = setTimeout(() => setStage('buildup'), 7000)
    setTimeout(() => setStage('journey'), 13000)
    setTimeout(() => setStage('reveal'), 22000)
    setTimeout(() => setStage('messages'), 24000)
  }

  function handleReplay() {
    setStage('intro')
    playSequence()
  }

  return (
    <div className="min-h-screen w-screen bg-black text-white relative overflow-hidden font-sans">
      <CursorEffects />

      <Intro visible={stage === 'intro'} audioManager={audioRef.current} />
      <BuildUp visible={stage === 'buildup'} />
      <Journey visible={stage === 'journey'} />
      <Reveal visible={stage === 'reveal'} audioManager={audioRef.current} />
      <Messages visible={stage === 'messages'} />

      <Controls onReplay={handleReplay} audioManager={audioRef.current} />
    </div>
  )
}
