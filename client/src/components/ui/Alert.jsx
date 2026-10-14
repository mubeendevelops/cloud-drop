import { cx } from "./cx.js";

// Inline message. Tones: error, info.
const Alert = ({ tone = "error", action, className, children }) => (
  <div
    className={cx("alert", `alert-${tone}`, className)}
    role={tone === "error" ? "alert" : "status"}
  >
    <svg className="alert-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d={tone === "error" ? "M12 7v6M12 16.5h.01" : "M12 16v-5M12 7.5h.01"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
    <div className="alert-body">{children}</div>
    {action}
  </div>
);

export default Alert;
