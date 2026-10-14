import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import { isValidEmail } from "./ui/validation.js";

const FIELDS = ["name", "email", "password", "confirmPassword"];

const SignUp = ({ onSwitchToSignIn, onSuccess }) => {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const { signUp } = useAuth();
  const { name, email, password, confirmPassword } = values;

  const validate = () => {
    const next = {};
    if (!name) next.name = "Enter your name";
    if (!email) next.email = "Enter your email address";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address, like name@example.com";
    if (!password) next.password = "Create a password";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    if (!confirmPassword) next.confirmPassword = "Confirm your password";
    else if (password && password !== confirmPassword) next.confirmPassword = "Passwords do not match";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const next = validate();
    setErrors(next);
    // Move focus to the first field that needs attention
    const firstInvalid = FIELDS.find((field) => next[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, name);
    setLoading(false);

    if (result.success) {
      onSuccess("Account created successfully!");
    } else {
      setFormError(result.message);
    }
  };

  const fieldProps = (field) => ({
    id: field,
    value: values[field],
    onChange: (e) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
      if (formError) setFormError("");
    },
    error: errors[field],
    disabled: loading,
    required: true,
  });

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start storing files with Cloud Drop</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <Input
          {...fieldProps("name")}
          type="text"
          label="Name"
          placeholder="Your name"
          autoComplete="name"
        />

        <Input
          {...fieldProps("email")}
          type="email"
          label="Email"
          placeholder="name@example.com"
          autoComplete="email"
        />

        <Input
          {...fieldProps("password")}
          type="password"
          label="Password"
          placeholder="Create a password"
          hint="At least 6 characters"
          autoComplete="new-password"
          minLength={6}
        />

        <Input
          {...fieldProps("confirmPassword")}
          type="password"
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />

        {formError && <Alert>{formError}</Alert>}

        <Button
          type="submit"
          block
          loading={loading}
          loadingText="Creating account…"
        >
          Create account
        </Button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <button
          type="button"
          className="link-button"
          onClick={onSwitchToSignIn}
          disabled={loading}
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default SignUp;
