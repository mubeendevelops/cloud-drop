// Stands in for the browser's type="email" check, which noValidate turns off
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
