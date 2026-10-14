import { forwardRef, useState } from "react";
import { cx } from "./cx.js";

const EyeIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    {!open && (
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    )}
  </svg>
);

// Labelled text field with optional hint, inline error, leading icon and
// trailing control. type="password" adds a show/hide toggle.
const Input = forwardRef(
  (
    {
      id,
      label,
      hideLabel = false,
      hint,
      error,
      type = "text",
      leading,
      trailing,
      className,
      ...rest
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const hintId = hint && !error ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cx("field", error && "field-invalid", className)}>
        <label htmlFor={id} className={cx("field-label", hideLabel && "visually-hidden")}>
          {label}
        </label>
        <div className="field-control">
          {leading && <span className="field-leading">{leading}</span>}
          <input
            ref={ref}
            id={id}
            type={isPassword && visible ? "text" : type}
            className={cx(
              "input",
              leading && "input-has-leading",
              (isPassword || trailing) && "input-has-trailing"
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...rest}
          />
          {isPassword ? (
            <button
              type="button"
              className="field-trailing-btn"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              aria-controls={id}
              disabled={rest.disabled}
            >
              <EyeIcon open={!visible} />
            </button>
          ) : (
            trailing
          )}
        </div>
        {hintId && (
          <p id={hintId} className="field-hint">
            {hint}
          </p>
        )}
        {errorId && (
          <p id={errorId} className="field-error">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v6M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
