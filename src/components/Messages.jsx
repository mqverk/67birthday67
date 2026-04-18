import React, { useEffect, useState } from 'react'

const LINES = [
  'You make ordinary days feel special.',
  'I don\'t say it enough, but you matter more than you know.',
  'I\'m really glad you exist.'
]

function Typewriter({ text, onDone }) {
  const [out, setOut] = useState('')
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setOut(prev => prev + text[i])
      i++
      if (i >= text.length) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [text])

  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), text.length * 28 + 400)
    return () => clearTimeout(t)
  }, [text, onDone])

  return <div className="typewriter text-lg md:text-2xl text-gray-100">{out}</div>
}

export default function Messages({ visible }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!visible) return
    setIndex(0)
  }, [visible])

  return (
    <section className={`absolute bottom-12 left-0 right-0 flex justify-center ${visible ? 'z-40' : 'z-0 pointer-events-none'}`}>
      <div className="max-w-2xl glass p-6 rounded-lg border-neonPurple">
        {visible && (
          <div>
            <Typewriter text={LINES[index]} onDone={() => setTimeout(() => setIndex(i => Math.min(i + 1, LINES.length - 1)), 600)} />
            <div className="mt-4 flex gap-3 justify-center">
              {LINES.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= index ? 'bg-neonPink' : 'bg-gray-600'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
