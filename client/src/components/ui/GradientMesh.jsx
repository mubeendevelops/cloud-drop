import { useId } from "react";
import { cx } from "./cx.js";

// Decorative pastel mesh (DESIGN.md "Gradient Mesh Backdrop"): blurred blobs
// in the brand stops, faded out toward the bottom by CSS.
const GradientMesh = ({ className }) => {
  const blurId = useId();
  return (
    <div className={cx("mesh", className)} aria-hidden="true">
      <svg viewBox="0 0 1440 480" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="70" />
          </filter>
        </defs>
        <g filter={`url(#${blurId})`}>
          <ellipse cx="160" cy="120" rx="340" ry="170" fill="#f5e9d4" />
          <ellipse cx="460" cy="70" rx="300" ry="150" fill="#ffc9a3" />
          <ellipse cx="770" cy="130" rx="320" ry="150" fill="#c9c2ff" />
          <ellipse cx="1040" cy="60" rx="280" ry="140" fill="#665efd" opacity="0.65" />
          <ellipse cx="1300" cy="140" rx="300" ry="160" fill="#f96bee" opacity="0.5" />
          <ellipse cx="1220" cy="20" rx="200" ry="110" fill="#ea2261" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
};

export default GradientMesh;
