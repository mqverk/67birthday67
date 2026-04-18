import { lazy, Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { gsap } from "gsap";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";
import IntroSequence from "./components/IntroSequence";
import ConnectionJourney from "./components/ConnectionJourney";
import AnimeOverlay from "./components/AnimeOverlay";
import Reveal from "./components/Reveal";
import ConfessionScene from "./components/ConfessionScene";
import { useTimeline } from "./hooks/useTimeline";
import { useMusicEngine } from "./hooks/useMusicEngine";

const Scene = lazy(() => import("./components/Scene"));

function App() {
  const sceneRig = useRef({
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

  const cursorRef = useRef({ x: 0, y: 0 });
  const cursorGlowRef = useRef(null);

  const introLeadRef = useRef(null);
  const introSubRef = useRef(null);
  const discoveryCaptionRef = useRef(null);
  const nameRef = useRef(null);
  const connectionRef = useRef(null);
  const connectionMessageRef = useRef(null);
  const revealRef = useRef(null);
  const afterglowRef = useRef(null);
  const confessionRef = useRef(null);
  const confessionLine1Ref = useRef(null);
  const confessionLine2Ref = useRef(null);
  const confessionLine3Ref = useRef(null);

  const speedLinesRef = useRef(null);
  const panelLeftRef = useRef(null);
  const panelRightRef = useRef(null);
  const hardCutRef = useRef(null);
  const glitchOverlayRef = useRef(null);
  const silhouetteRef = useRef(null);
  const frameRef = useRef(null);

  const openingBlackRef = useRef(null);
  const blackoutRef = useRef(null);
  const burstRef = useRef(null);

  const music = useMusicEngine();

  const { journey, messages, messageText, start, replay, advanceJourney } = useTimeline({
    sceneRig,
    introLeadRef,
    introSubRef,
    discoveryCaptionRef,
    nameRef,
    connectionRef,
    connectionMessageRef,
    revealRef,
    afterglowRef,
    confessionRef,
    confessionLine1Ref,
    confessionLine2Ref,
    confessionLine3Ref,
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
    setIntensity: music.setIntensity,
    setJourneyMood: music.setJourneyMood,
    dropSilence: music.dropSilence,
    resumeAfterDrop: music.resumeAfterDrop,
  });

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    const cursorEl = cursorGlowRef.current;
    if (!cursorEl) {
      return undefined;
    }

    const xTo = gsap.quickTo(cursorEl, "x", {
      duration: 0.35,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(cursorEl, "y", {
      duration: 0.35,
      ease: "power3.out",
    });

    const moveCursor = (event) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;

      cursorRef.current.x = (event.clientX / width - 0.5) * 2;
      cursorRef.current.y = (event.clientY / height - 0.5) * -2;

      xTo(event.clientX - 150);
      yTo(event.clientY - 150);
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });

    return () => {
      window.removeEventListener("pointermove", moveCursor);
    };
  }, []);

  useEffect(() => {
    if (!music.isEnabled || music.isPlaying) {
      return undefined;
    }

    const unlockAudio = () => {
      music.start();
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [music.isEnabled, music.isPlaying, music.start]);

  useEffect(() => {
    if (!journey.waitingForInteraction) {
      return undefined;
    }

    const onWheel = (event) => {
      if (Math.abs(event.deltaY) < 8) {
        return;
      }

      advanceJourney();
    };

    const onPointer = () => {
      advanceJourney();
    };

    const onKeyDown = (event) => {
      if (["Space", "Enter", "ArrowDown"].includes(event.code)) {
        event.preventDefault();
        advanceJourney();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [journey.waitingForInteraction, advanceJourney]);

  const handleReplay = () => {
    replay();

    if (music.isEnabled && !music.isPlaying) {
      music.start();
    }
  };

  return (
    <main className={`cinematic-root phase-${journey.phase}`}>
      <div className="experience-stage">
        <Canvas
          className="cinematic-canvas"
          camera={{ position: [0, 0, 18], fov: 48, near: 0.1, far: 250 }}
          dpr={[1, 1.65]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <Scene sceneRig={sceneRig} cursorRef={cursorRef} />
          </Suspense>
        </Canvas>

        <AnimeOverlay
          speedLinesRef={speedLinesRef}
          panelLeftRef={panelLeftRef}
          panelRightRef={panelRightRef}
          hardCutRef={hardCutRef}
          glitchOverlayRef={glitchOverlayRef}
          silhouetteRef={silhouetteRef}
          frameRef={frameRef}
          phase={journey.phase}
        />

        <div ref={openingBlackRef} className="opening-black pointer-events-none" />
        <div ref={blackoutRef} className="drop-blackout pointer-events-none" />
        <div ref={burstRef} className="burst-flash pointer-events-none" />
        <div className="vignette-overlay pointer-events-none" />

        <IntroSequence
          introLeadRef={introLeadRef}
          introSubRef={introSubRef}
          discoveryCaptionRef={discoveryCaptionRef}
          nameRef={nameRef}
          phase={journey.phase}
        />

        <ConnectionJourney
          connectionRef={connectionRef}
          messageRef={connectionMessageRef}
          messageText={messageText}
          messageIndex={journey.messageIndex}
          totalMessages={messages.length}
          waitingForInteraction={journey.waitingForInteraction}
          visible={journey.showConnection}
          onAdvance={advanceJourney}
        />

        <Reveal revealRef={revealRef} afterglowRef={afterglowRef} phase={journey.phase} />

        <ConfessionScene
          confessionRef={confessionRef}
          line1Ref={confessionLine1Ref}
          line2Ref={confessionLine2Ref}
          line3Ref={confessionLine3Ref}
          phase={journey.phase}
        />
      </div>

      <div className="journey-headup pointer-events-none">
        <span className="journey-phase-label">{journey.phaseLabel}</span>

        <div className="journey-progress-track">
          <span
            className="journey-progress-fill"
            style={{ transform: `scaleX(${journey.progress})` }}
          />
        </div>

        <p className="journey-prompt">
          {journey.waitingForInteraction
            ? "Click, scroll, or press Space to continue"
            : journey.ended
              ? "The journey rests in afterglow."
              : "Stay with the story as it evolves."}
        </p>
      </div>

      <div className="hud">
        <button
          type="button"
          className="hud-button"
          aria-label={music.isEnabled ? "Mute music" : "Play music"}
          onClick={music.togglePlayback}
        >
          {music.isEnabled ? <Volume2 size={20} strokeWidth={2.2} /> : <VolumeX size={20} strokeWidth={2.2} />}
        </button>

        <button
          type="button"
          className="hud-button"
          aria-label="Replay cinematic sequence"
          onClick={handleReplay}
        >
          <RotateCcw size={20} strokeWidth={2.2} />
        </button>
      </div>

      {music.isEnabled && !music.isPlaying ? (
        <button type="button" className="audio-unlock" onClick={music.start}>
          Enable Soundtrack
        </button>
      ) : null}

      <div ref={cursorGlowRef} className="cursor-glow" />
    </main>
  );
}

export default App;
