import { useEffect, useId, useRef } from "react";
import Button from "./ui/Button.jsx";
import IconButton from "./ui/IconButton.jsx";

const FOCUSABLE = "button:not([disabled]), [href], input, select, textarea";

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", loadingText = "Working…", loading = false, type = "danger" }) => {
  const titleId = useId();
  const messageId = useId();
  const contentRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Move focus into the dialog on open and back to where it was on close
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape" && !loading) {
        onClose();
        return;
      }
      // Keep Tab inside the dialog
      if (e.key === "Tab" && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll(FOCUSABLE);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const inside = contentRef.current.contains(document.activeElement);
        if (e.shiftKey && (!inside || document.activeElement === first)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (!loading) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={contentRef}
        className="modal-content"
        role={type === "danger" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {type === "danger" && (
            <span className="modal-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          <h2 className="modal-title" id={titleId}>{title}</h2>
          <IconButton label="Close" className="modal-close" onClick={onClose} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconButton>
        </div>
        <div className="modal-body">
          <p id={messageId}>{message}</p>
        </div>
        <div className="modal-footer">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={type === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            loadingText={loadingText}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
