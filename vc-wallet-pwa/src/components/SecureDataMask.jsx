import { memo, useCallback, useEffect, useId, useRef, useState } from "react";

const AUTO_REMASK_MS = 10_000;

/**
 * Masks a sensitive string, showing only the trailing `visibleChars`.
 * e.g. "234567891234" -> "XXXX-XXXX-1234"
 */
function maskValue(value, visibleChars = 4) {
  const clean = String(value).replace(/\s|-/g, "");
  const visible = clean.slice(-visibleChars);
  const hiddenLength = Math.max(clean.length - visibleChars, 0);
  const hiddenGroups = "XXXX-".repeat(Math.ceil(hiddenLength / 4)).slice(0, hiddenLength + Math.floor(hiddenLength / 4));
  // Simple, readable masking: groups of 4 X's separated by dashes, then the real trailing digits.
  const numHiddenGroups = Math.ceil(hiddenLength / 4);
  const maskedPrefix = Array.from({ length: numHiddenGroups }, () => "XXXX").join("-");
  return maskedPrefix ? `${maskedPrefix}-${visible}` : visible;
}

/**
 * SecureDataMask
 * Reusable, accessible "tap to reveal" component for sensitive identity data.
 *
 * Props:
 *  - value (string, required): the raw sensitive value (e.g. mock Aadhaar number)
 *  - label (string): accessible label describing what the data is (e.g. "Aadhaar number")
 *  - visibleChars (number): how many trailing characters stay visible while masked
 *  - autoRemaskMs (number): override the default 10s auto re-mask window
 */
function SecureDataMask({ value, label = "sensitive identity data", visibleChars = 4, autoRemaskMs = AUTO_REMASK_MS }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const timeoutRef = useRef(null);
  const liveRegionId = useId();

  const masked = maskValue(value, visibleChars);

  const clearExistingTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const reveal = useCallback(() => {
    setIsRevealed(true);
    clearExistingTimer();
    // Auto re-mask after `autoRemaskMs` and clear the unmasked value from state.
    timeoutRef.current = setTimeout(() => {
      setIsRevealed(false);
      timeoutRef.current = null;
    }, autoRemaskMs);
  }, [autoRemaskMs, clearExistingTimer]);

  const hide = useCallback(() => {
    clearExistingTimer();
    setIsRevealed(false);
  }, [clearExistingTimer]);

  const toggle = useCallback(() => {
    if (isRevealed) {
      hide();
    } else {
      reveal();
    }
  }, [isRevealed, hide, reveal]);

  // Cleanup: ensure no timer fires after unmount, and the sensitive
  // value is never left "revealed" in memory beyond the component's life.
  useEffect(() => clearExistingTimer, [clearExistingTimer]);

  const displayValue = isRevealed ? value : masked;

  return (
    <div className="secure-data-mask">
      <span className="secure-data-mask__value" data-testid="secure-value">
        {displayValue}
      </span>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={isRevealed}
        aria-label={isRevealed ? `Hide ${label}` : `Tap to reveal ${label}`}
        className="secure-data-mask__button"
      >
        {isRevealed ? "Hide" : "Tap to Reveal"}
      </button>

      {/* Visually hidden live region: announces state changes to screen readers
          without requiring focus to move, per WCAG 4.1.3 (Status Messages). */}
      <span id={liveRegionId} role="status" aria-live="polite" className="sr-only">
        {isRevealed ? `${label} revealed. Will automatically hide in 10 seconds.` : `${label} hidden.`}
      </span>
    </div>
  );
}

// Advanced React feature: memoize the component so it only re-renders when
// its own props change — important here since it lives inside a mapped list
// of credential cards and shouldn't re-render on unrelated dashboard updates.
export default memo(SecureDataMask);
