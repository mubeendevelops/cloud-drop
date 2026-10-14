import { forwardRef } from "react";
import Spinner from "./Spinner.jsx";
import { cx } from "./cx.js";

// Pill button. Variants: primary, secondary, ghost, danger. Sizes: md, sm.
const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      block = false,
      loading = false,
      loadingText,
      icon,
      type = "button",
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cx(
        "btn",
        `btn-${variant}`,
        size === "sm" && "btn-sm",
        block && "btn-block",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  )
);

Button.displayName = "Button";

export default Button;
