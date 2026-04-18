import { memo } from "react";

function AnimeOverlay({
  speedLinesRef,
  panelLeftRef,
  panelRightRef,
  hardCutRef,
  glitchOverlayRef,
  silhouetteRef,
  frameRef,
  phase,
}) {
  return (
    <div className="anime-overlay pointer-events-none absolute inset-0 z-36">
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
