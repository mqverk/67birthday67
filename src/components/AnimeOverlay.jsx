import { memo, useMemo } from "react";

const PETAL_PARTICLES = Object.freeze([
  { left: "7%", delay: "0s", duration: "12.8s", drift: "-6vw", scale: "0.9", rotate: "-18deg" },
  { left: "14%", delay: "1.4s", duration: "14.2s", drift: "4vw", scale: "0.72", rotate: "12deg" },
  { left: "23%", delay: "0.8s", duration: "13.6s", drift: "-5vw", scale: "1.02", rotate: "-10deg" },
  { left: "31%", delay: "2.1s", duration: "12.1s", drift: "6vw", scale: "0.78", rotate: "16deg" },
  { left: "42%", delay: "0.2s", duration: "14.8s", drift: "-4vw", scale: "0.95", rotate: "-22deg" },
  { left: "51%", delay: "1.8s", duration: "13.2s", drift: "5vw", scale: "0.8", rotate: "11deg" },
  { left: "59%", delay: "2.6s", duration: "12.9s", drift: "-6vw", scale: "1.08", rotate: "-8deg" },
  { left: "67%", delay: "0.9s", duration: "14.5s", drift: "5vw", scale: "0.7", rotate: "18deg" },
  { left: "74%", delay: "2.9s", duration: "13.9s", drift: "-4vw", scale: "0.86", rotate: "-15deg" },
  { left: "82%", delay: "1.2s", duration: "12.4s", drift: "6vw", scale: "0.74", rotate: "10deg" },
  { left: "90%", delay: "2.2s", duration: "14.1s", drift: "-5vw", scale: "0.92", rotate: "-12deg" },
]);

const FLOATING_HEARTS = Object.freeze([
  { left: "12%", delay: "0.6s", duration: "10.8s", rise: "9vh", scale: "0.82" },
  { left: "27%", delay: "2.2s", duration: "11.5s", rise: "10vh", scale: "0.66" },
  { left: "39%", delay: "1.3s", duration: "12.2s", rise: "12vh", scale: "0.72" },
  { left: "53%", delay: "3.1s", duration: "10.4s", rise: "11vh", scale: "0.76" },
  { left: "64%", delay: "1.7s", duration: "11.8s", rise: "13vh", scale: "0.7" },
  { left: "79%", delay: "2.9s", duration: "10.9s", rise: "9vh", scale: "0.8" },
  { left: "88%", delay: "0.9s", duration: "11.2s", rise: "10vh", scale: "0.64" },
]);

const SOFT_FLARES = Object.freeze([
  { left: "18%", top: "24%", size: "18rem", delay: "0s", duration: "7.8s" },
  { left: "74%", top: "18%", size: "14rem", delay: "1.2s", duration: "8.4s" },
  { left: "48%", top: "72%", size: "16rem", delay: "0.7s", duration: "9.1s" },
]);

function AnimeOverlay({
  speedLinesRef,
  panelLeftRef,
  panelRightRef,
  hardCutRef,
  glitchOverlayRef,
  silhouetteRef,
  frameRef,
  phase,
  performanceProfile,
}) {
  const petals = useMemo(
    () => PETAL_PARTICLES.slice(0, performanceProfile?.petalCount ?? PETAL_PARTICLES.length),
    [performanceProfile?.petalCount],
  );

  const hearts = useMemo(
    () => FLOATING_HEARTS.slice(0, performanceProfile?.heartCount ?? FLOATING_HEARTS.length),
    [performanceProfile?.heartCount],
  );

  const flares = useMemo(
    () => SOFT_FLARES.slice(0, performanceProfile?.flareCount ?? SOFT_FLARES.length),
    [performanceProfile?.flareCount],
  );

  return (
    <div className="anime-overlay pointer-events-none absolute inset-0 z-36">
      <div className="romance-haze" />

      <div className="petal-layer">
        {petals.map((petal, index) => (
          <span
            key={`petal-${index}`}
            className="petal"
            style={{
              "--petal-left": petal.left,
              "--petal-delay": petal.delay,
              "--petal-duration": petal.duration,
              "--petal-drift": petal.drift,
              "--petal-scale": petal.scale,
              "--petal-rotate": petal.rotate,
            }}
          />
        ))}
      </div>

      <div className="heart-layer">
        {hearts.map((heart, index) => (
          <span
            key={`heart-${index}`}
            className="heart-float"
            style={{
              "--heart-left": heart.left,
              "--heart-delay": heart.delay,
              "--heart-duration": heart.duration,
              "--heart-rise": heart.rise,
              "--heart-scale": heart.scale,
            }}
          />
        ))}
      </div>

      <div className="flare-layer">
        {flares.map((flare, index) => (
          <span
            key={`flare-${index}`}
            className="soft-flare"
            style={{
              "--flare-left": flare.left,
              "--flare-top": flare.top,
              "--flare-size": flare.size,
              "--flare-delay": flare.delay,
              "--flare-duration": flare.duration,
            }}
          />
        ))}
      </div>

      <div className="sparkle-dust" />

      <div
        ref={speedLinesRef}
        className={`anime-speedlines ${phase === "drop" ? "anime-speedlines-drop" : ""}`}
      />

      <div className="anime-panels">
        <div ref={panelLeftRef} className="anime-panel-left" />
        <div ref={panelRightRef} className="anime-panel-right" />
      </div>

      <div ref={silhouetteRef} className="anime-silhouette" />
      <div ref={glitchOverlayRef} className="anime-glitch-overlay" />
      <div ref={frameRef} className="anime-frame" />

      <div ref={hardCutRef} className="anime-hardcut" />
    </div>
  );
}

export default memo(AnimeOverlay);
