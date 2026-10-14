import { cx } from "./cx.js";

const Card = ({ as: Tag = "section", className, children, ...rest }) => (
  <Tag className={cx("card", className)} {...rest}>
    {children}
  </Tag>
);

export default Card;
