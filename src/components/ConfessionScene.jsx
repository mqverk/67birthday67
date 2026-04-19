import { memo } from "react";

function ConfessionScene({
  confessionRef,
  line1Ref,
  line2Ref,
  line3Ref,
  phase,
}) {
  return (
    <div
      ref={confessionRef}
      className={`confession-scene ${phase === "confession" ? "confession-active" : ""}`}
    >
      <h3 className="confession-title">Final Scene</h3>

      <p ref={line1Ref} className="confession-line">
        I don't know how to say this perfectly...
      </p>

      <p ref={line2Ref} className="confession-line">
        But you really mean a lot to me.
      </p>

      <p ref={line3Ref} className="confession-line confession-line-final">
        Will you be mine?
      </p>
    </div>
  );
}

export default memo(ConfessionScene);
