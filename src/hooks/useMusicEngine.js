import { useCallback, useEffect, useRef, useState } from "react";

const BPM = 142;
const STEPS_PER_BEAT = 4;
const SWING = 0.08;

const KICK_PATTERN = [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0];
const SNARE_PATTERN = [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0];
const HAT_PATTERN = [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1];
const BASS_PATTERN = [1,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0];
const LEAD_PATTERN = [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0];

const BASS_NOTES = [55, 65.41, 73.42, 82.41];
const LEAD_NOTES = [392, 440, 493.88, 587.33, 659.25, 587.33, 493.88, 440];

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function humanize() {
  return (Math.random() - 0.5) * 0.01;
}

function createNoiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function getStepTime(step, base, dur) {
  return step % 2 ? base + dur * SWING : base;
}

/* ---------------- DRUMS ---------------- */

function scheduleKick(ctx, dest, t, i) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(1.2 * i, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.25);
}

function scheduleSnare(ctx, dest, noiseBuf, t, i) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2500;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.3 * i, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

  noise.connect(filter).connect(gain).connect(dest);
  noise.start(t);
  noise.stop(t + 0.2);

  // body
  const body = ctx.createOscillator();
  const bg = ctx.createGain();

  body.type = "triangle";
  body.frequency.setValueAtTime(180, t);

  bg.gain.setValueAtTime(0.0001, t);
  bg.gain.exponentialRampToValueAtTime(0.25 * i, t + 0.01);
  bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

  body.connect(bg).connect(dest);
  body.start(t);
  body.stop(t + 0.2);
}

function scheduleHat(ctx, dest, noiseBuf, t, i) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 9000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.04 * i, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

  noise.connect(hp).connect(gain).connect(dest);
  noise.start(t);
  noise.stop(t + 0.06);
}

/* ---------------- MUSIC ---------------- */

function scheduleBass(ctx, dest, t, step, i) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(
    BASS_NOTES[Math.floor(step / 4) % BASS_NOTES.length],
    t
  );

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.3 * i, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

  osc.connect(gain).connect(dest);

  const length = step % 4 === 0 ? 0.32 : 0.18;

  osc.start(t);
  osc.stop(t + length);
}

function scheduleLead(ctx, dest, delay, t, step, i) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const note = LEAD_NOTES[step % LEAD_NOTES.length];

  osc.type = "triangle";
  osc.frequency.setValueAtTime(note, t);
  osc.frequency.linearRampToValueAtTime(note, t + 0.02);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.15 * i, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

  osc.connect(gain);
  gain.connect(dest);
  gain.connect(delay);

  osc.start(t);
  osc.stop(t + 0.2);
}

/* ---------------- HOOK ---------------- */

export function useMusicEngine() {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const busRef = useRef(null);
  const noiseRef = useRef(null);
  const delayRef = useRef(null);

  const stepRef = useRef(0);
  const nextRef = useRef(0);
  const rafRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const ensure = async () => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const bus = ctx.createGain();
      const master = ctx.createGain();

      bus.gain.value = 0.8;
      master.gain.value = 0.0001;

      // delay
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.18;

      const fb = ctx.createGain();
      fb.gain.value = 0.35;

      delay.connect(fb);
      fb.connect(delay);

      bus.connect(master);
      bus.connect(delay);
      delay.connect(master);
      master.connect(ctx.destination);

      ctxRef.current = ctx;
      busRef.current = bus;
      masterRef.current = master;
      noiseRef.current = createNoiseBuffer(ctx);
      delayRef.current = delay;
    }

    if (ctxRef.current.state !== "running") {
      await ctxRef.current.resume();
    }

    return ctxRef.current;
  };

  const schedule = () => {
    const ctx = ctxRef.current;
    const stepDur = (60 / BPM) / STEPS_PER_BEAT;

    while (nextRef.current < ctx.currentTime + 0.15) {
      const step = stepRef.current;
      const t = getStepTime(step, nextRef.current, stepDur) + humanize();

      if (KICK_PATTERN[step]) scheduleKick(ctx, busRef.current, t, 1);
      if (SNARE_PATTERN[step]) scheduleSnare(ctx, busRef.current, noiseRef.current, t, 1);
      if (HAT_PATTERN[step]) scheduleHat(ctx, busRef.current, noiseRef.current, t, 1);
      if (BASS_PATTERN[step]) scheduleBass(ctx, busRef.current, t, step, 1);
      if (LEAD_PATTERN[step]) scheduleLead(ctx, busRef.current, delayRef.current, t, step, 1);

      stepRef.current = (step + 1) % 16;
      nextRef.current += stepDur;
    }
  };

  const loop = () => {
    schedule();
    rafRef.current = requestAnimationFrame(loop);
  };

  const start = async () => {
    const ctx = await ensure();

    stepRef.current = 0;
    nextRef.current = ctx.currentTime;

    masterRef.current.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.3);

    loop();
    setIsPlaying(true);
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    masterRef.current.gain.linearRampToValueAtTime(0.0001, ctxRef.current.currentTime + 0.2);
    setIsPlaying(false);
  };

  return { start, stop, isPlaying };
}
