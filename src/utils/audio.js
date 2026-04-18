// Minimal WebAudio-based AudioManager to provide 3 simple loop types and a bass drop/pulse.
export class AudioManager {
  constructor() {
    this.ctx = null
    this.master = null
    this.osc = null
    this.gain = null
    this.current = null
    this.interval = null
    this.isPlaying = false
  }

  init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      this.ctx = new AudioCtx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.6
      this.master.connect(this.ctx.destination)
    } catch (e) {
      console.warn('Audio not supported:', e)
    }
  }

  // simple loop generators
  play(type = 'piano') {
    if (!this.ctx) return
    if (this.isPlaying) this.stop()
    this.isPlaying = true
    if (type === 'lofi') this.startLofi()
    else if (type === 'ost') this.startPad()
    else this.startPiano()
  }

  stop() {
    this.isPlaying = false
    if (this.interval) clearInterval(this.interval)
    if (this.osc) try { this.osc.stop() } catch(e){}
  }

  startPiano() {
    // repeating gentle arpeggio using short oscillators
    const playNote = (freq, time=0) => {
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.value = 0
      o.connect(g)
      g.connect(this.master)
      const now = this.ctx.currentTime + time
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.12, now + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
      o.start(now)
      o.stop(now + 1.6)
    }

    const pattern = [440, 550, 660, 880]
    let idx = 0
    this.interval = setInterval(() => {
      playNote(pattern[idx % pattern.length])
      idx++
    }, 600)
  }

  startPad() {
    // simple pad using two oscillators
    const o1 = this.ctx.createOscillator()
    const o2 = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o1.type = 'sine'
    o2.type = 'sine'
    o1.detune.value = -6
    o2.detune.value = 6
    o1.frequency.value = 220
    o2.frequency.value = 330
    g.gain.value = 0.0001
    o1.connect(g)
    o2.connect(g)
    g.connect(this.master)
    const now = this.ctx.currentTime
    g.gain.linearRampToValueAtTime(0.08, now + 1)
    o1.start(now)
    o2.start(now)
    this.osc = { o1, o2, g }
  }

  startLofi() {
    // simple noise + lowpass for lofi texture
    const bufferSize = 2 * this.ctx.sampleRate
    const noiseBuff = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuff.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.3
    const noise = this.ctx.createBufferSource()
    noise.buffer = noiseBuff
    noise.loop = true
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    const g = this.ctx.createGain()
    g.gain.value = 0.14
    noise.connect(lp)
    lp.connect(g)
    g.connect(this.master)
    noise.start()
    this.osc = { noise, g }
  }

  // a short bass drop effect
  bassDrop() {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 120
    g.gain.value = 0.001
    o.connect(g)
    g.connect(this.master)
    const now = this.ctx.currentTime
    g.gain.exponentialRampToValueAtTime(0.6, now + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
    o.frequency.exponentialRampToValueAtTime(40, now + 1.0)
    o.start(now)
    o.stop(now + 1.4)
  }

  pulse() {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 220
    g.gain.value = 0
    o.connect(g)
    g.connect(this.master)
    const now = this.ctx.currentTime
    g.gain.linearRampToValueAtTime(0.24, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
    o.start(now)
    o.stop(now + 0.9)
  }
}
