import { memo } from "react";

function IntroSequence({
  introLeadRef,
  introSubRef,
  discoveryCaptionRef,
  nameRef,
  phase,
}) {
  return (
    <div className="intro-layer pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <p ref={introLeadRef} className="intro-lead">
        Before this night became a memory...
      </p>

      <p ref={introSubRef} className="intro-sub">
        there was a quiet spark waiting to become light.
      </p>

      <h1 ref={nameRef} data-text="SHRIJITA" className={`name-gradual ${phase === "buildup" ? "name-vibrate" : ""}`}>
        SHRIJITA
      </h1>

      <p ref={discoveryCaptionRef} className="discovery-caption">
        Every moment has been leading here.
      </p>
    </div>
  );
}

export default memo(IntroSequence);
