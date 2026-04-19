import { memo } from "react";

function Reveal({ revealRef, afterglowRef, phase }) {
  return (
    <div className="reveal-layer pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <div ref={revealRef} className={`reveal-block ${phase === "drop" || phase === "afterglow" ? "reveal-active" : ""}`}>
        <p className="reveal-top">HAPPY BIRTHDAY</p>
        <h2 className="reveal-main">SHRIJITA</h2>
        <p className="reveal-sub">Tonight the sky blooms in your name.</p>
      </div>

      <div ref={afterglowRef} className="afterglow-note">
        <p>
          May this year hold brave dreams, gentle mornings, and laughter that keeps
          finding its way back to you.
        </p>
        <p className="afterglow-sign">A celebration made just for Shrijita.</p>
      </div>
    </div>
  );
}

export default memo(Reveal);
