import { cx } from "./cx.js";
import logoIcon from "../../assets/cloud-drop-icon.png";

const Logo = ({ size = "md", className }) => (
  <span className={cx("logo", `logo-${size}`, className)}>
    <img className="logo-mark" src={logoIcon} alt="" aria-hidden="true" />
    <span className="logo-text">Cloud Drop</span>
  </span>
);

export default Logo;
