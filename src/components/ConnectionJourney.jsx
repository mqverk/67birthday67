import { ArrowDown, MousePointerClick } from "lucide-react";
import { memo } from "react";

function ConnectionJourney({
  connectionRef,
  messageRef,
  messageText,
  messageIndex,
  totalMessages,
  waitingForInteraction,
  visible,
  onAdvance,
}) {
  const displayIndex = Math.max(messageIndex + 1, 1);

  return (
    <div
      ref={connectionRef}
      className={`connection-panel ${visible ? "connection-visible" : ""}`}
      aria-live="polite"
    >
      <div className="connection-header">
        <span className="connection-title">Connection</span>
        <span className="connection-counter">
          {displayIndex}/{totalMessages}
        </span>
      </div>

      <p ref={messageRef} className="connection-message">
        {messageText}
      </p>

      <button
        type="button"
        className={`connection-advance ${waitingForInteraction ? "connection-advance-active" : ""}`}
        onClick={onAdvance}
      >
        <MousePointerClick size={16} strokeWidth={2.1} />
        <ArrowDown size={16} strokeWidth={2.1} />
        <span>{waitingForInteraction ? "Continue Journey" : "Absorb This Moment"}</span>
      </button>
    </div>
  );
}

export default memo(ConnectionJourney);
