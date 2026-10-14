import { forwardRef } from "react";
import { cx } from "./cx.js";

// Round icon-only button. Renders a link when href is given.
// Tones: neutral, primary, danger.
const IconButton = forwardRef(
  ({ label, tone = "neutral", href, className, children, ...rest }, ref) => {
    const classes = cx("icon-btn", `icon-btn-${tone}`, className);
    if (href) {
      return (
        <a
          ref={ref}
          href={href}
          className={classes}
          aria-label={label}
          title={label}
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        aria-label={label}
        title={label}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
