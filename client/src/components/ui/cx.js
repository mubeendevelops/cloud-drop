// Joins class names, skipping falsy values
export const cx = (...classes) => classes.filter(Boolean).join(" ");
