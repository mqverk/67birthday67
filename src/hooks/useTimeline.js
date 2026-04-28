import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const JOURNEY_MESSAGES = Object.freeze([
  "You make ordinary rooms feel like home the moment you step in.",
  "Your laughter has a way of turning silence into warmth.",
  "You carry kindness like light, and everyone around you feels it.",
  "You make courage look gentle and joy look effortless.",
  "The people who know you keep your moments close like constellations.",
  "Every chapter with you feels brighter than the one before.",
  "Tonight is not just a date. It is a celebration of your story.",
  "And this whole sky is ready to answer with light.",
]);

const BASELINE_DURATION = 180;
const TIMELINE_SPEED = 1.08;

const INITIAL_JOURNEY = Object.freeze({
  phase: "intro",
  phaseLabel: "Intro",
  phaseIndex: 0,
  waitingForInteraction: false,
  messageIndex: 0,
  showConnection: false,
  showReveal: false,
  showAfterglow: false,
  ended: false,
  progress: 0,
});

const DEFAULT_RIG = Object.freeze({
  drift: 0.08,
  push: 0,
  orbit: 0.08,
  spin: 0.08,
  bloom: 0.2,
  particleSpeed: 0.35,
  explosion: 0,
  shake: 0,
  colorBurst: 0,
  coreGlow: 0.8,
  zoom: 0,
  ambientPulse: 0.2,
  phaseColor: 0,
});

function applyRig(rig, values) {
  Object.entries(values).forEach(([key, value]) => {
    rig[key] = value;
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function useTimeline({
  sceneRig,
  introLeadRef,
  introSubRef,
  discoveryCaptionRef,
  nameRef,
  connectionRef,
  connectionMessageRef,
  revealRef,
  afterglowRef,
  speedLinesRef,
  panelLeftRef,
  panelRightRef,
  hardCutRef,
  glitchOverlayRef,
  silhouetteRef,
  frameRef,
  openingBlackRef,
  blackoutRef,
  burstRef,
  setIntensity,
  setJourneyMood,
  dropSilence,
  resumeAfterDrop,
  performanceProfile,
}) {
  const timelineRef = useRef(null);
  const waitingForInteractionRef = useRef(false);
  const lastProgressRef = useRef(0);
  const lastIntensityTimeRef = useRef(-1);
  const autoPausedByVisibilityRef = useRef(false);

  const [journey, setJourney] = useState(INITIAL_JOURNEY);
  const [messageText, setMessageText] = useState(JOURNEY_MESSAGES[0]);

  const setJourneyPhase = useCallback((phase, phaseLabel, phaseIndex) => {
    setJourney((prev) => ({
      ...prev,
      phase,
      phaseLabel,
      phaseIndex,
    }));
  }, []);

  const setWaitingForInteraction = useCallback((value) => {
    waitingForInteractionRef.current = value;

    setJourney((prev) => ({
      ...prev,
      waitingForInteraction: value,
    }));
  }, []);

  const setConnectionMessage = useCallback((index) => {
    const safeIndex = clamp(index, 0, JOURNEY_MESSAGES.length - 1);

    setMessageText(JOURNEY_MESSAGES[safeIndex]);

    setJourney((prev) => ({
      ...prev,
      messageIndex: safeIndex,
      showConnection: true,
    }));
  }, []);

  const progressStep = performanceProfile?.progressStep ?? 0.008;
  const intensityUpdateStep = performanceProfile?.intensityUpdateStep ?? 0.065;
  const cutStride = Math.max(performanceProfile?.cutStride ?? 1, 1);
  const speedlineOpacityScale = performanceProfile?.speedlineOpacityScale ?? 1;
  const lowTier = performanceProfile?.tier === "low";

  const buildTimeline = useCallback(() => {
    const rig = sceneRig.current;
    const introLeadEl = introLeadRef.current;
    const introSubEl = introSubRef.current;
    const discoveryCaptionEl = discoveryCaptionRef.current;
    const nameEl = nameRef.current;
    const connectionEl = connectionRef.current;
    const connectionMessageEl = connectionMessageRef.current;
    const revealEl = revealRef.current;
    const afterglowEl = afterglowRef.current;

    const speedLinesEl = speedLinesRef.current;
    const panelLeftEl = panelLeftRef.current;
    const panelRightEl = panelRightRef.current;
    const hardCutEl = hardCutRef.current;
    const glitchOverlayEl = glitchOverlayRef.current;
    const silhouetteEl = silhouetteRef.current;
    const frameEl = frameRef.current;

    const openingEl = openingBlackRef.current;
    const blackoutEl = blackoutRef.current;
    const burstEl = burstRef.current;

    if (
      !rig ||
      !introLeadEl ||
      !introSubEl ||
      !discoveryCaptionEl ||
      !nameEl ||
      !connectionEl ||
      !connectionMessageEl ||
      !revealEl ||
      !afterglowEl ||
      !speedLinesEl ||
      !panelLeftEl ||
      !panelRightEl ||
      !hardCutEl ||
      !glitchOverlayEl ||
      !silhouetteEl ||
      !frameEl ||
      !openingEl ||
      !blackoutEl ||
      !burstEl
    ) {
      return null;
    }

    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    applyRig(rig, DEFAULT_RIG);
    waitingForInteractionRef.current = false;
    lastProgressRef.current = 0;
    lastIntensityTimeRef.current = -1;
    autoPausedByVisibilityRef.current = false;

    setMessageText(JOURNEY_MESSAGES[0]);
    setJourney({
      ...INITIAL_JOURNEY,
      messageIndex: 0,
      progress: 0,
    });

    gsap.set(openingEl, { autoAlpha: 1 });
    gsap.set(blackoutEl, { autoAlpha: 0 });
    gsap.set(burstEl, { autoAlpha: 0, scale: 1 });

    gsap.set(hardCutEl, { autoAlpha: 0 });
    gsap.set(glitchOverlayEl, { autoAlpha: 0.08 });
    gsap.set(speedLinesEl, { autoAlpha: 0.44 * speedlineOpacityScale, scale: 1.02 });
    gsap.set(panelLeftEl, { xPercent: -108, autoAlpha: 0.84 });
    gsap.set(panelRightEl, { xPercent: 108, autoAlpha: 0.84 });
    gsap.set(silhouetteEl, { autoAlpha: 0.44, scale: 1.04 });
    gsap.set(frameEl, { autoAlpha: 0.58 });

    gsap.set(introLeadEl, {
      autoAlpha: 0,
      y: 22,
      filter: "blur(8px)",
    });
    gsap.set(introSubEl, {
      autoAlpha: 0,
      y: 26,
      filter: "blur(10px)",
    });
    gsap.set(discoveryCaptionEl, {
      autoAlpha: 0,
      y: 16,
      filter: "blur(8px)",
    });
    gsap.set(nameEl, {
      autoAlpha: 0,
      scale: 0.66,
      letterSpacing: "0.42em",
      filter: "blur(18px)",
    });

    gsap.set(connectionEl, {
      autoAlpha: 0,
      y: 20,
    });
    gsap.set(connectionMessageEl, {
      autoAlpha: 0,
      y: 18,
      filter: "blur(8px)",
    });

    gsap.set(revealEl, {
      autoAlpha: 0,
      scale: 0.5,
      filter: "blur(20px)",
    });
    gsap.set(afterglowEl, {
      autoAlpha: 0,
      y: 24,
      filter: "blur(10px)",
    });

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.out" },
      onUpdate: () => {
        const time = timeline.time();
        const progress = clamp(time / BASELINE_DURATION, 0, 1);

        if (Math.abs(progress - lastProgressRef.current) > progressStep) {
          lastProgressRef.current = progress;

          setJourney((prev) => ({
            ...prev,
            progress,
          }));
        }

        if (!setIntensity) {
          return;
        }

        if (
          lastIntensityTimeRef.current >= 0 &&
          time - lastIntensityTimeRef.current < intensityUpdateStep
        ) {
          return;
        }

        lastIntensityTimeRef.current = time;

        if (time < 20) {
          setIntensity(0.5 + (time / 20) * 0.12);
        } else if (time < 58) {
          setIntensity(0.62 + ((time - 20) / 38) * 0.16);
        } else if (time < 124) {
          setIntensity(0.78 + ((time - 58) / 66) * 0.12);
        } else if (time < 150) {
          setIntensity(0.9 + ((time - 124) / 26) * 0.1);
        } else if (time < 162) {
          setIntensity(1);
        } else if (time < 172) {
          setIntensity(0.52);
        } else {
          setIntensity(0.26);
        }
      },
    });

    const addAnimeCut = (time, index = 0) => {
      const burst = (lowTier ? 0.1 : 0.14) + (index % 4) * 0.05;
      const panelShift = 7 + (index % 3) * (lowTier ? 2 : 4);

      timeline.to(hardCutEl, { autoAlpha: 0.85, duration: 0.035, ease: "none" }, time);
      timeline.to(hardCutEl, { autoAlpha: 0, duration: 0.16, ease: "sine.out" }, time + 0.035);

      if (!lowTier) {
        timeline.to(glitchOverlayEl, { autoAlpha: 0.62, duration: 0.06, ease: "none" }, time);
        timeline.to(
          glitchOverlayEl,
          { autoAlpha: 0.08, duration: 0.24, ease: "sine.out" },
          time + 0.06,
        );

        timeline.to(
          panelLeftEl,
          {
            xPercent: -panelShift,
            duration: 0.09,
            ease: "steps(2)",
          },
          time,
        );

        timeline.to(
          panelRightEl,
          {
            xPercent: panelShift,
            duration: 0.09,
            ease: "steps(2)",
          },
          time,
        );

        timeline.to(panelLeftEl, { xPercent: -108, duration: 0.24, ease: "sine.out" }, time + 0.09);
        timeline.to(panelRightEl, { xPercent: 108, duration: 0.24, ease: "sine.out" }, time + 0.09);
      }

      timeline.to(rig, { shake: burst, duration: 0.08, ease: "power4.out" }, time);
      timeline.to(rig, { shake: 0.045, duration: 0.17, ease: "sine.in" }, time + 0.08);

      timeline.to(speedLinesEl, { autoAlpha: 0.86 * speedlineOpacityScale, duration: 0.07, ease: "none" }, time);
      timeline.to(speedLinesEl, { autoAlpha: 0.5 * speedlineOpacityScale, duration: 0.24, ease: "sine.out" }, time + 0.07);
    };

    const dopamineTimes = [
      4, 7, 10, 13, 16, 19,
      23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56,
      60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105,
      108, 111, 114, 117, 120, 123,
      127, 130, 133, 136, 139, 142, 145, 148,
    ];

    dopamineTimes
      .filter((_, index) => index % cutStride === 0)
      .forEach((time, index) => {
      addAnimeCut(time, index);
      });

    timeline.call(() => {
      setJourneyPhase("intro", "Intro", 0);
      setJourneyMood?.("intro");
    }, null, 0);

    timeline.to(openingEl, { autoAlpha: 0.28, duration: 6, ease: "sine.out" }, 0);

    timeline.to(
      rig,
      {
        phaseColor: 0.65,
        drift: 0.45,
        orbit: 0.48,
        push: 0.42,
        bloom: 1.1,
        particleSpeed: 1.32,
        coreGlow: 2.3,
        ambientPulse: 0.9,
        duration: 20,
        ease: "sine.inOut",
      },
      0,
    );

    timeline.to(frameEl, { autoAlpha: 0.9, duration: 3.2 }, 0);
    timeline.to(silhouetteEl, { autoAlpha: 0.72, duration: 4 }, 0.6);

    timeline.to(
      introLeadEl,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 2.6,
      },
      2,
    );

    timeline.to(
      introLeadEl,
      {
        autoAlpha: 0.36,
        y: -16,
        duration: 4,
        ease: "sine.inOut",
      },
      9,
    );

    timeline.to(
      introSubEl,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 2.8,
      },
      10.5,
    );

    timeline.to(
      introSubEl,
      {
        autoAlpha: 0.12,
        y: -12,
        duration: 4,
      },
      16,
    );

    timeline.call(() => {
      setJourneyPhase("discovery", "Discovery", 1);
      setJourneyMood?.("discovery");
    }, null, 20);

    timeline.to(
      rig,
      {
        phaseColor: 1.8,
        drift: 0.68,
        orbit: 0.92,
        push: 1.2,
        zoom: 0.55,
        bloom: 1.85,
        particleSpeed: 2.3,
        coreGlow: 3.4,
        ambientPulse: 1.1,
        duration: 38,
        ease: "sine.inOut",
      },
      20,
    );

    timeline.to(
      nameEl,
      {
        autoAlpha: 1,
        scale: 1.03,
        letterSpacing: "0.16em",
        filter: "blur(0px)",
        duration: 8,
        ease: "expo.out",
      },
      22,
    );

    timeline.to(
      discoveryCaptionEl,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 2.2,
      },
      30,
    );

    timeline.to(
      discoveryCaptionEl,
      {
        autoAlpha: 0,
        y: -10,
        duration: 3,
      },
      54,
    );

    timeline.call(() => {
      setJourneyPhase("connection", "Connection", 2);
      setJourneyMood?.("connection");
      setJourney((prev) => ({
        ...prev,
        showConnection: true,
      }));
      setConnectionMessage(0);
    }, null, 58);

    timeline.to(
      rig,
      {
        phaseColor: 2.5,
        drift: 0.52,
        orbit: 1.08,
        push: 1.45,
        zoom: 0.7,
        bloom: 2.02,
        particleSpeed: 2.55,
        coreGlow: 3.6,
        ambientPulse: 1.15,
        duration: 66,
        ease: "sine.inOut",
      },
      58,
    );

    timeline.to(
      connectionEl,
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
      },
      58,
    );

    const messageTimes = [60, 68, 76, 84, 92, 100, 108, 116];

    messageTimes.forEach((time, index) => {
      timeline.call(() => {
        setConnectionMessage(index);
      }, null, time);

      timeline.set(
        connectionMessageEl,
        {
          autoAlpha: 0,
          y: 16,
          filter: "blur(8px)",
        },
        time,
      );

      timeline.to(
        connectionMessageEl,
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
        },
        time,
      );

      timeline.to(
        connectionMessageEl,
        {
          autoAlpha: 0.96,
          y: -4,
          duration: 2,
          ease: "sine.inOut",
        },
        time + 1.1,
      );

      timeline.addPause(time + 4.9, () => {
        setWaitingForInteraction(true);
      });

      timeline.call(() => {
        setWaitingForInteraction(false);
      }, null, time + 4.91);
    });

    timeline.to(
      connectionEl,
      {
        autoAlpha: 0,
        y: 14,
        duration: 1,
      },
      122,
    );

    timeline.call(() => {
      setJourney((prev) => ({
        ...prev,
        showConnection: false,
      }));
    }, null, 123.2);

    timeline.call(() => {
      setJourneyPhase("buildup", "Buildup", 3);
      setJourneyMood?.("buildup");
    }, null, 124);

    timeline.to(
      rig,
      {
        phaseColor: 3.4,
        push: 2.4,
        zoom: 2.35,
        orbit: 1.48,
        spin: 2.3,
        bloom: 2.7,
        particleSpeed: 3.75,
        coreGlow: 3.9,
        ambientPulse: 1.35,
        duration: 26,
        ease: "power2.inOut",
      },
      124,
    );

    timeline.to(
      nameEl,
      {
        autoAlpha: 1,
        scale: 1.2,
        letterSpacing: "0.3em",
        duration: 2.6,
        ease: "power2.out",
      },
      130,
    );

    timeline.to(
      nameEl,
      {
        autoAlpha: 0,
        scale: 1.44,
        duration: 3,
        ease: "power2.in",
      },
      145,
    );

    timeline.call(() => {
      dropSilence?.();
      addAnimeCut(149.4, 1);
    }, null, 149.4);

    timeline.to(
      blackoutEl,
      {
        autoAlpha: 1,
        duration: 0.45,
        ease: "power2.in",
      },
      149.55,
    );

    timeline.call(() => {
      setJourneyPhase("drop", "Final Drop", 4);
      setJourneyMood?.("drop");
      setJourney((prev) => ({
        ...prev,
        showReveal: true,
      }));

      gsap.set(blackoutEl, { autoAlpha: 0 });
      gsap.set(openingEl, { autoAlpha: 0 });
      resumeAfterDrop?.();
    }, null, 150);

    timeline.set(blackoutEl, { autoAlpha: 0 }, 150.16);

    timeline.to(hardCutEl, { autoAlpha: 1, duration: 0.05, ease: "none" }, 150);
    timeline.to(hardCutEl, { autoAlpha: 0, duration: 0.14, ease: "power4.out" }, 150.05);

    timeline.to(
      burstEl,
      {
        autoAlpha: 1,
        scale: 1.35,
        duration: 0.2,
        ease: "power4.out",
      },
      150,
    );

    timeline.to(
      burstEl,
      {
        autoAlpha: 0,
        scale: 1.95,
        duration: 0.8,
        ease: "expo.out",
      },
      150.2,
    );

    timeline.to(
      revealEl,
      {
        autoAlpha: 1,
        scale: 1.72,
        filter: "blur(0px)",
        duration: 1.4,
        ease: "expo.out",
      },
      150,
    );

    timeline.to(
      rig,
      {
        phaseColor: 4.8,
        zoom: 4.5,
        push: 3.55,
        bloom: 4.25,
        particleSpeed: 7.2,
        explosion: 3.55,
        shake: 0.82,
        colorBurst: 1.35,
        coreGlow: 4.8,
        orbit: 1.75,
        spin: 3.15,
        duration: 1.2,
        ease: "expo.out",
      },
      150,
    );

    timeline.to(rig, { shake: 0.14, duration: 0.6, ease: "power2.out" }, 151.2);

    timeline.call(() => {
      setJourneyPhase("afterglow", "Afterglow", 5);
      setJourneyMood?.("afterglow");
      setJourney((prev) => ({
        ...prev,
        showAfterglow: true,
      }));
    }, null, 162);

    timeline.to(
      rig,
      {
        phaseColor: 5,
        zoom: 1.1,
        push: 0.85,
        orbit: 0.32,
        spin: 0.26,
        bloom: 1.2,
        particleSpeed: 0.82,
        explosion: 0.26,
        colorBurst: 0.25,
        coreGlow: 1.65,
        ambientPulse: 0.2,
        duration: 10,
        ease: "sine.out",
      },
      162,
    );

    timeline.to(
      revealEl,
      {
        scale: 1.25,
        duration: 7,
        ease: "sine.inOut",
      },
      162,
    );

    timeline.to(
      afterglowEl,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 3.6,
        ease: "sine.out",
      },
      165.2,
    );

    timeline.to(
      afterglowEl,
      {
        autoAlpha: 0,
        y: 16,
        duration: 1.6,
        ease: "sine.inOut",
      },
      171.4,
    );

    timeline.to(
      revealEl,
      {
        autoAlpha: 0.28,
        scale: 1.12,
        duration: 2.2,
        ease: "sine.out",
      },
      171.2,
    );

    timeline.to(speedLinesEl, { autoAlpha: 0.16, duration: 8.6, ease: "sine.out" }, 172);
    timeline.to(glitchOverlayEl, { autoAlpha: 0.03, duration: 8.6, ease: "sine.out" }, 172);
    timeline.to(frameEl, { autoAlpha: 0.42, duration: 8.6, ease: "sine.out" }, 172);
    timeline.to(silhouetteEl, { autoAlpha: 0.16, duration: 8.6, ease: "sine.out" }, 172);

    timeline.call(() => {
      setWaitingForInteraction(false);
      setJourney((prev) => ({
        ...prev,
        ended: true,
        progress: 1,
      }));
    }, null, BASELINE_DURATION);

    timeline.timeScale(TIMELINE_SPEED);

    timelineRef.current = timeline;
    return timeline;
  }, [
    afterglowRef,
    blackoutRef,
    burstRef,
    connectionMessageRef,
    connectionRef,
    discoveryCaptionRef,
    dropSilence,
    frameRef,
    glitchOverlayRef,
    hardCutRef,
    introLeadRef,
    introSubRef,
    nameRef,
    openingBlackRef,
    panelLeftRef,
    panelRightRef,
    resumeAfterDrop,
    revealRef,
    sceneRig,
    cutStride,
    intensityUpdateStep,
    lowTier,
    progressStep,
    speedlineOpacityScale,
    setConnectionMessage,
    setIntensity,
    setJourneyMood,
    setJourneyPhase,
    setWaitingForInteraction,
    silhouetteRef,
    speedLinesRef,
  ]);

  const start = useCallback(() => {
    const timeline = buildTimeline();

    if (timeline) {
      timeline.play(0);
    }
  }, [buildTimeline]);

  const replay = useCallback(() => {
    const timeline = buildTimeline();

    if (timeline) {
      timeline.play(0);
    }
  }, [buildTimeline]);

  const advanceJourney = useCallback(() => {
    const timeline = timelineRef.current;

    if (!timeline || !timeline.paused() || !waitingForInteractionRef.current) {
      return false;
    }

    setWaitingForInteraction(false);
    timeline.play();
    return true;
  }, [setWaitingForInteraction]);

  useEffect(
    () => () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    },
    [],
  );

  useEffect(() => {
    const handleVisibility = () => {
      const timeline = timelineRef.current;
      if (!timeline) {
        return;
      }

      if (document.hidden) {
        if (!timeline.paused()) {
          autoPausedByVisibilityRef.current = true;
          timeline.pause();
        }

        return;
      }

      if (autoPausedByVisibilityRef.current && !waitingForInteractionRef.current) {
        autoPausedByVisibilityRef.current = false;
        timeline.play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return {
    journey,
    messages: JOURNEY_MESSAGES,
    messageText,
    start,
    replay,
    advanceJourney,
    timelineRef,
  };
}
