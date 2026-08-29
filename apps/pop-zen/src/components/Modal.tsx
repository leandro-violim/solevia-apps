/**
 * P1-T8 — shared dialog. Promotes the Daily Bonus modal's look (glass card on a
 * dimmed, blurred overlay) into one reusable component so score / revive / bonus
 * all read as the same surface. Chrome only — callers own their content and when
 * to mount. Closes on Escape and on backdrop click (when `onClose` is given).
 */
import { useEffect, type ReactNode, type RefObject } from "react";
import { CloseIcon } from "./icons";

export function Modal({
  children,
  onClose,
  closeLabel,
  overlayRef,
  afterCard,
}: {
  children: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  /** Optional ref to the overlay element (e.g. for particle coordinates). */
  overlayRef?: RefObject<HTMLDivElement | null>;
  /** Extra nodes rendered inside the overlay, above the card (e.g. particles). */
  afterCard?: ReactNode;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="zb-dialog-overlay"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      onClick={(e) => {
        if (onClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="zb-dialog">
        {onClose && (
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <CloseIcon size={18} />
          </button>
        )}
        {children}
      </div>
      {afterCard}
    </div>
  );
}
