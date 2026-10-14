import { cx } from "./cx.js";

const Spinner = ({ size, className }) => (
  <svg
    className={cx("spinner", className)}
    viewBox="0 0 24 24"
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      opacity="0.25"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export default Spinner;
