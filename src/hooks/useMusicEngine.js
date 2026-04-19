import { useCallback, useEffect, useRef, useState } from "react";

const BPM = 136;
const STEPS_PER_BEAT = 4;

const KICK_PATTERN = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0];
const SNARE_PATTERN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const HAT_PATTERN = [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1];
const BASS_PATTERN = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0];
const LEAD_PATTERN = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];

const BASS_NOTES = [55, 65.41, 73.42, 82.41];
const LEAD_NOTES = [392, 440, 493.88, 587.33, 659.25, 587.33, 493.88, 440];

const JOURNEY_MOODS = Object.freeze({
  intro: {
    masterGain: 0.22,
    filter: 2200,
    beatEnergy: 0.28,
    hatEnergy: 0.46,
    padEnergy: 0.95,
    leadEnergy: 0.2,
  },
  discovery: {
    masterGain: 0.28,
    filter: 2800,
    beatEnergy: 0.5,
    hatEnergy: 0.68,
    padEnergy: 0.9,
    leadEnergy: 0.42,
  },
  connection: {
    masterGain: 0.33,
    filter: 3400,
    beatEnergy: 0.66,
    hatEnergy: 0.78,
    padEnergy: 0.84,
    leadEnergy: 0.58,
  },
  buildup: {
    masterGain: 0.38,
    filter: 4200,
    beatEnergy: 0.82,
    hatEnergy: 0.9,
    padEnergy: 0.72,
    leadEnergy: 0.8,
  },
  drop: {
    masterGain: 0.52,
    filter: 6200,
    beatEnergy: 1,
    hatEnergy: 1,
    padEnergy: 0.64,
    leadEnergy: 1,
  },
  afterglow: {
    masterGain: 0.2,
    filter: 2000,
    beatEnergy: 0.15,
    hatEnergy: 0.25,
    padEnergy: 0.98,
    leadEnergy: 0.16,
  },
  confession: {
    masterGain: 0.12,
    filter: 1600,
    beatEnergy: 0.03,
    hatEnergy: 0.07,
    padEnergy: 1,
    leadEnergy: 0.08,
  },
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function scheduleKick(context, destination, time, intensity) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(176, time);
  oscillator.frequency.exponentialRampToValueAtTime(50, time + 0.14);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.76 * intensity, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  oscillator.connect(gain);
  gain.connect(destination);

  oscillator.start(time);
  oscillator.stop(time + 0.24);
}

function scheduleSnare(context, destination, noiseBuffer, time, intensity) {
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 2550;
  noiseFilter.Q.value = 0.62;

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.22 * intensity, time + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.16);

  const toneOscillator = context.createOscillator();
  toneOscillator.type = "square";
  toneOscillator.frequency.setValueAtTime(310, time);
  toneOscillator.frequency.exponentialRampToValueAtTime(155, time + 0.08);

  const toneGain = context.createGain();
  toneGain.gain.setValueAtTime(0.0001, time);
  toneGain.gain.exponentialRampToValueAtTime(0.17 * intensity, time + 0.003);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

  toneOscillator.connect(toneGain);
  toneGain.connect(destination);

  toneOscillator.start(time);
  toneOscillator.stop(time + 0.12);
}

function scheduleHat(context, destination, noiseBuffer, time, intensity) {
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;

  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 8600;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.065 * intensity, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.06);
}

function scheduleBass(context, destination, time, step, intensity) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(BASS_NOTES[Math.floor(step / 4) % BASS_NOTES.length], time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(360, time);
  filter.frequency.linearRampToValueAtTime(980, time + 0.19);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.22 * intensity, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  oscillator.start(time);
  oscillator.stop(time + 0.28);
}

function scheduleLead(context, destination, time, step, intensity) {
  const main = context.createOscillator();
  const shimmer = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  const note = LEAD_NOTES[step % LEAD_NOTES.length];

  main.type = "triangle";
  shimmer.type = "sine";

  main.frequency.setValueAtTime(note, time);
  shimmer.frequency.setValueAtTime(note * 2, time);
  shimmer.detune.setValueAtTime(8, time);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2600, time);
  filter.Q.value = 0.95;

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.1 * intensity, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

  main.connect(filter);
  shimmer.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  main.start(time);
  shimmer.start(time);

  main.stop(time + 0.18);
  shimmer.stop(time + 0.18);
}

export function useMusicEngine() {
  const contextRef = useRef(null);
  const musicBusRef = useRef(null);
  const masterGainRef = useRef(null);
  const toneFilterRef = useRef(null);
  const sparkleShelfRef = useRef(null);
  const noiseBufferRef = useRef(null);

  const rafRef = useRef(null);
  const rafLastTickRef = useRef(0);
  const stepRef = useRef(0);
  const nextStepTimeRef = useRef(0);
  const wasPlayingBeforeHiddenRef = useRef(false);

  const padRef = useRef(null);
  const intensityRef = useRef(0.3);
  const pausedForDropRef = useRef(false);
  const isPlayingRef = useRef(false);

  const moodRef = useRef("intro");
  const masterTargetRef = useRef(JOURNEY_MOODS.intro.masterGain);
  const beatEnergyRef = useRef(JOURNEY_MOODS.intro.beatEnergy);
  const hatEnergyRef = useRef(JOURNEY_MOODS.intro.hatEnergy);
  const padEnergyRef = useRef(JOURNEY_MOODS.intro.padEnergy);
  const leadEnergyRef = useRef(JOURNEY_MOODS.intro.leadEnergy);

  const [isEnabled, setIsEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  const computeTargetGain = useCallback(() => {
    return clamp(masterTargetRef.current * (0.82 + intensityRef.current * 0.36), 0.04, 0.68);
  }, []);

  const ensureContext = useCallback(async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!contextRef.current) {
      const context = new AudioContextClass();

      const musicBus = context.createGain();
      musicBus.gain.value = 0.82;

      const toneFilter = context.createBiquadFilter();
      toneFilter.type = "lowpass";
      toneFilter.frequency.value = 2400;
      toneFilter.Q.value = 0.68;

      const sparkleShelf = context.createBiquadFilter();
      sparkleShelf.type = "highshelf";
      sparkleShelf.frequency.value = 2800;
      sparkleShelf.gain.value = 3.2;

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -30;
      compressor.knee.value = 28;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.24;

      const masterGain = context.createGain();
      masterGain.gain.value = 0.0001;

      musicBus.connect(toneFilter);
      toneFilter.connect(sparkleShelf);
      sparkleShelf.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(context.destination);

      contextRef.current = context;
      musicBusRef.current = musicBus;
      masterGainRef.current = masterGain;
      toneFilterRef.current = toneFilter;
      sparkleShelfRef.current = sparkleShelf;
      noiseBufferRef.current = createNoiseBuffer(context);
    }

    if (
      contextRef.current.state === "suspended" ||
      contextRef.current.state === "interrupted"
    ) {
      try {
        await contextRef.current.resume();
      } catch {
        return null;
      }

      if (contextRef.current.state !== "running") {
        return null;
      }
    }

    return contextRef.current;
  }, []);

  const startPad = useCallback((context) => {
    if (!musicBusRef.current || padRef.current) {
      return;
    }

    const oscillator = context.createOscillator();
    const lowpass = context.createBiquadFilter();
    const gain = context.createGain();

    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.value = 98;

    shimmer.type = "sine";
    shimmer.frequency.value = 196;

    lowpass.type = "lowpass";
    lowpass.frequency.value = 920;

    gain.gain.value = 0.0001;

    shimmerGain.gain.value = 0.0001;

    lfo.type = "sine";
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 12;

    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.detune);
    lfoGain.connect(shimmer.detune);

    oscillator.connect(lowpass);
    shimmer.connect(lowpass);

    lowpass.connect(gain);
    lowpass.connect(shimmerGain);

    gain.connect(musicBusRef.current);
    shimmerGain.connect(musicBusRef.current);

    oscillator.start();
    shimmer.start();
    lfo.start();

    const targetPadGain = 0.035 + padEnergyRef.current * 0.12;

    gain.gain.linearRampToValueAtTime(targetPadGain, context.currentTime + 0.9);
    shimmerGain.gain.linearRampToValueAtTime(targetPadGain * 0.35, context.currentTime + 1.2);

    padRef.current = {
      oscillator,
      shimmer,
      lowpass,
      gain,
      shimmerGain,
      lfo,
      lfoGain,
    };
  }, []);

  const stopPad = useCallback(() => {
    const context = contextRef.current;
    if (!context || !padRef.current) {
      return;
    }

    const {
      oscillator,
      shimmer,
      gain,
      shimmerGain,
      lfo,
    } = padRef.current;

    const now = context.currentTime;

    gain.gain.cancelScheduledValues(now);
    shimmerGain.gain.cancelScheduledValues(now);

    gain.gain.setValueAtTime(gain.gain.value, now);
    shimmerGain.gain.setValueAtTime(shimmerGain.gain.value, now);

    gain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
    shimmerGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);

    oscillator.stop(now + 0.25);
    shimmer.stop(now + 0.25);
    lfo.stop(now + 0.25);

    padRef.current = null;
  }, []);

  const scheduleStep = useCallback((step, time) => {
    const context = contextRef.current;
    const destination = musicBusRef.current;
    const noiseBuffer = noiseBufferRef.current;

    if (!context || !destination || !noiseBuffer) {
      return;
    }

    const beatEnergy = beatEnergyRef.current;
    const hatEnergy = hatEnergyRef.current;
    const leadEnergy = leadEnergyRef.current;
    const dynamicIntensity = intensityRef.current;

    if (KICK_PATTERN[step % KICK_PATTERN.length] && beatEnergy > 0.14) {
      scheduleKick(context, destination, time, 0.25 + beatEnergy * (0.48 + dynamicIntensity * 0.46));
    }

    if (SNARE_PATTERN[step % SNARE_PATTERN.length] && beatEnergy > 0.32) {
      scheduleSnare(context, destination, noiseBuffer, time, 0.22 + beatEnergy * 0.72);
    }

    if (
      HAT_PATTERN[step % HAT_PATTERN.length] &&
      (hatEnergy > 0.6 || step % 2 === 0)
    ) {
      scheduleHat(context, destination, noiseBuffer, time, 0.3 + hatEnergy * 0.58);
    }

    if (BASS_PATTERN[step % BASS_PATTERN.length] && beatEnergy > 0.22) {
      scheduleBass(context, destination, time, step, 0.28 + beatEnergy * (0.7 + dynamicIntensity * 0.2));
    }

    if (LEAD_PATTERN[step % LEAD_PATTERN.length] && leadEnergy > 0.12) {
      scheduleLead(
        context,
        destination,
        time,
        step,
        0.24 + leadEnergy * (0.62 + dynamicIntensity * 0.24),
      );
    }
  }, []);

  const runScheduler = useCallback(() => {
    const context = contextRef.current;
    if (!context) {
      return;
    }

    const stepDuration = (60 / BPM) / STEPS_PER_BEAT;
    const lookAhead = 0.18;

    while (nextStepTimeRef.current < context.currentTime + lookAhead) {
      scheduleStep(stepRef.current, nextStepTimeRef.current);
      stepRef.current = (stepRef.current + 1) % 16;
      nextStepTimeRef.current += stepDuration;
    }
  }, [scheduleStep]);

  const schedulerLoop = useCallback(
    (timestamp) => {
      if (!isPlayingRef.current) {
        return;
      }

      if (timestamp - rafLastTickRef.current >= 20) {
        runScheduler();
        rafLastTickRef.current = timestamp;
      }

      rafRef.current = window.requestAnimationFrame(schedulerLoop);
    },
    [runScheduler],
  );

  const start = useCallback(async () => {
    const context = await ensureContext();
    const masterGain = masterGainRef.current;

    if (!context || !masterGain) {
      setNeedsUserGesture(true);
      return false;
    }

    if (isPlayingRef.current) {
      setNeedsUserGesture(false);
      return true;
    }

    startPad(context);

    stepRef.current = 0;
    nextStepTimeRef.current = context.currentTime + 0.05;

    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    rafLastTickRef.current = typeof performance !== "undefined" ? performance.now() : 0;
    rafRef.current = window.requestAnimationFrame(schedulerLoop);

    isPlayingRef.current = true;
    setIsPlaying(true);
    setNeedsUserGesture(false);

    const targetGain = pausedForDropRef.current ? 0.0001 : computeTargetGain();

    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value || 0.0001, context.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetGain, context.currentTime + 0.35);

    return true;
  }, [computeTargetGain, ensureContext, schedulerLoop, startPad]);

  const stop = useCallback(() => {
    const context = contextRef.current;
    const masterGain = masterGainRef.current;

    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    isPlayingRef.current = false;
    setIsPlaying(false);

    if (!context || !masterGain) {
      stopPad();
      return;
    }

    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value || 0.0001, context.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.2);

    stopPad();
  }, [stopPad]);

  const togglePlayback = useCallback(() => {
    if (isEnabled) {
      setIsEnabled(false);
      stop();
      setNeedsUserGesture(false);
      return;
    }

    setIsEnabled(true);
    start();
  }, [isEnabled, start, stop]);

  const setIntensity = useCallback((value) => {
    const clamped = clamp(value, 0, 1);
    intensityRef.current = clamped;

    const context = contextRef.current;
    const toneFilter = toneFilterRef.current;
    const sparkleShelf = sparkleShelfRef.current;
    const masterGain = masterGainRef.current;

    if (!context || !toneFilter || !masterGain || !sparkleShelf) {
      return;
    }

    toneFilter.frequency.setTargetAtTime(
      JOURNEY_MOODS[moodRef.current].filter + clamped * 1200,
      context.currentTime,
      0.18,
    );

    sparkleShelf.gain.setTargetAtTime(
      2.6 + JOURNEY_MOODS[moodRef.current].hatEnergy * 4.2 + clamped * 2.2,
      context.currentTime,
      0.24,
    );

    if (padRef.current) {
      const padTarget = 0.02 + padEnergyRef.current * (0.09 + clamped * 0.03);

      padRef.current.gain.gain.setTargetAtTime(padTarget, context.currentTime, 0.25);
      padRef.current.shimmerGain.gain.setTargetAtTime(
        padTarget * 0.35,
        context.currentTime,
        0.3,
      );

      padRef.current.lowpass.frequency.setTargetAtTime(
        520 + padEnergyRef.current * 1500 + clamped * 900,
        context.currentTime,
        0.3,
      );
    }

    if (!pausedForDropRef.current && isPlayingRef.current) {
      masterGain.gain.setTargetAtTime(computeTargetGain(), context.currentTime, 0.14);
    }
  }, [computeTargetGain]);

  const setJourneyMood = useCallback((mood) => {
    const config = JOURNEY_MOODS[mood] || JOURNEY_MOODS.connection;

    moodRef.current = mood;
    masterTargetRef.current = config.masterGain;
    beatEnergyRef.current = config.beatEnergy;
    hatEnergyRef.current = config.hatEnergy;
    padEnergyRef.current = config.padEnergy;
    leadEnergyRef.current = config.leadEnergy;

    const context = contextRef.current;
    const masterGain = masterGainRef.current;
    const toneFilter = toneFilterRef.current;
    const sparkleShelf = sparkleShelfRef.current;

    if (!context || !masterGain || !toneFilter || !sparkleShelf) {
      return;
    }

    toneFilter.frequency.setTargetAtTime(config.filter, context.currentTime, 0.35);
    sparkleShelf.gain.setTargetAtTime(2.4 + config.hatEnergy * 4.2, context.currentTime, 0.32);

    if (padRef.current) {
      const targetPad = 0.025 + config.padEnergy * 0.105;

      padRef.current.gain.gain.setTargetAtTime(targetPad, context.currentTime, 0.4);
      padRef.current.shimmerGain.gain.setTargetAtTime(targetPad * 0.35, context.currentTime, 0.45);
      padRef.current.lowpass.frequency.setTargetAtTime(
        500 + config.padEnergy * 1550,
        context.currentTime,
        0.45,
      );
    }

    if (!pausedForDropRef.current && isPlayingRef.current) {
      masterGain.gain.setTargetAtTime(computeTargetGain(), context.currentTime, 0.18);
    }
  }, [computeTargetGain]);

  const dropSilence = useCallback(() => {
    const context = contextRef.current;
    const masterGain = masterGainRef.current;

    pausedForDropRef.current = true;

    if (!context || !masterGain) {
      return;
    }

    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value || 0.0001, context.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.08);
  }, []);

  const resumeAfterDrop = useCallback(() => {
    const context = contextRef.current;
    const masterGain = masterGainRef.current;

    pausedForDropRef.current = false;

    if (!context || !masterGain || !isPlayingRef.current) {
      return;
    }

    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value || 0.0001, context.currentTime);
    masterGain.gain.linearRampToValueAtTime(computeTargetGain(), context.currentTime + 0.2);
  }, [computeTargetGain]);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    let cancelled = false;

    const attemptAutoPlay = async () => {
      const started = await start();

      if (!started && !cancelled) {
        setNeedsUserGesture(true);
      }
    };

    attemptAutoPlay();

    return () => {
      cancelled = true;
    };
  }, [isEnabled, start]);

  useEffect(() => {
    const handleVisibility = async () => {
      const context = contextRef.current;

      if (document.hidden) {
        wasPlayingBeforeHiddenRef.current = isPlayingRef.current;

        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        if (context && context.state === "running") {
          try {
            await context.suspend();
          } catch {
            // Ignore and keep current playback state.
          }
        }

        return;
      }

      if (!wasPlayingBeforeHiddenRef.current || !isEnabled) {
        return;
      }

      const resumedContext = await ensureContext();

      if (!resumedContext || !isPlayingRef.current) {
        return;
      }

      nextStepTimeRef.current = Math.max(nextStepTimeRef.current, resumedContext.currentTime + 0.04);

      if (!rafRef.current) {
        rafLastTickRef.current = typeof performance !== "undefined" ? performance.now() : 0;
        rafRef.current = window.requestAnimationFrame(schedulerLoop);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [ensureContext, isEnabled, schedulerLoop]);

  useEffect(
    () => () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }

      stopPad();

      if (contextRef.current && contextRef.current.state !== "closed") {
        contextRef.current.close();
      }
    },
    [stopPad],
  );

  return {
    isEnabled,
    isPlaying,
    needsUserGesture,
    start,
    stop,
    togglePlayback,
    setIntensity,
    setJourneyMood,
    dropSilence,
    resumeAfterDrop,
  };
}
