import { useEffect, useRef, useState } from "react";

const BPM = 72;
const STEPS = 16;

/* 🎼 Romantic chord progression (C → Am → F → G) */
const CHORDS = [
  [261.63, 329.63, 392.0],   // C
  [220.0, 261.63, 329.63],   // Am
  [174.61, 220.0, 261.63],   // F
  [196.0, 246.94, 329.63],   // G
];

/* 🎹 Soft emotional melody */
const MELODY = [
  392, 440, 493.88, 523.25,
  493.88, 440, 392, 329.63,
];

function createReverb(ctx) {
  const length = ctx.sampleRate * 3;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }

  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

export function useMusicEngine() {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const busRef = useRef(null);
  const delayRef = useRef(null);

  const stepRef = useRef(0);
  const nextTimeRef = useRef(0);
  const rafRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const init = async () => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const bus = ctx.createGain();
      const master = ctx.createGain();
      const delay = ctx.createDelay();
      const feedback = ctx.createGain();
      const reverb = createReverb(ctx);
      const reverbGain = ctx.createGain();

      bus.gain.value = 0.7;
      master.gain.value = 0.0001;

      delay.delayTime.value = 0.28;
      feedback.gain.value = 0.4;

      reverbGain.gain.value = 0.25;

      delay.connect(feedback);
      feedback.connect(delay);

      bus.connect(delay);
      bus.connect(reverb);

      delay.connect(master);
      reverb.connect(reverbGain);
      reverbGain.connect(master);

      bus.connect(master);
      master.connect(ctx.destination);

      ctxRef.current = ctx;
      busRef.current = bus;
      masterRef.current = master;
      delayRef.current = delay;
    }

    if (ctxRef.current.state !== "running") {
      await ctxRef.current.resume();
    }

    return ctxRef.current;
  };

  /* 🌊 PAD (ambient background) */
  const playPad = (ctx, t, chord) => {
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();

      osc.type = "sine";
      osc.frequency.value = freq;

      pan.pan.value = i === 0 ? -0.4 : i === 2 ? 0.4 : 0;

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 1.5);
      gain.gain.linearRampToValueAtTime(0.0001, t + 4);

      osc.connect(pan).connect(gain).connect(busRef.current);

      osc.start(t);
      osc.stop(t + 4);
    });
  };

  /* 🎹 MELODY */
  const playMelody = (ctx, t, step) => {
    const note = MELODY[step % MELODY.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(note, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.1);
    gain.gain.linearRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(gain);
    gain.connect(busRef.current);
    gain.connect(delayRef.current);

    osc.start(t);
    osc.stop(t + 1.3);
  };

  /* 🥁 SOFT KICK */
  const playKick = (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(gain).connect(busRef.current);

    osc.start(t);
    osc.stop(t + 0.3);
  };

  const schedule = () => {
    const ctx = ctxRef.current;
    const stepDur = (60 / BPM) / 2;

    while (nextTimeRef.current < ctx.currentTime + 0.2) {
      const step = stepRef.current;
      const t = nextTimeRef.current;

      const chord = CHORDS[Math.floor(step / 4) % CHORDS.length];

      if (step % 4 === 0) playPad(ctx, t, chord);
      if (step % 2 === 0) playMelody(ctx, t, step);
      if (step % 8 === 0) playKick(ctx, t);

      stepRef.current = (step + 1) % STEPS;
      nextTimeRef.current += stepDur;
    }
  };

  const loop = () => {
    schedule();
    rafRef.current = requestAnimationFrame(loop);
  };

  const start = async () => {
    const ctx = await init();

    stepRef.current = 0;
    nextTimeRef.current = ctx.currentTime;

    masterRef.current.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.5);

    loop();
    setIsPlaying(true);
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    masterRef.current.gain.linearRampToValueAtTime(
      0.0001,
      ctxRef.current.currentTime + 1
    );
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  return { start, stop, isPlaying };
}
