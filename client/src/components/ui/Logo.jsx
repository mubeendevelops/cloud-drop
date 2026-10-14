import { cx } from "./cx.js";

const Logo = ({ size = "md", className }) => (
  <span className={cx("logo", `logo-${size}`, className)}>
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M7 18.5h10.5a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.5 9.6 4.5 4.5 0 0 0 7 18.5z"
          fill="currentColor"
          opacity="0.28"
        />
        <path
          d="M12 16.5v-6m0 0-2.5 2.5M12 10.5l2.5 2.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <span className="logo-text">Cloud Drop</span>
  </span>
);

export default Logo;
