import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import { isValidEmail } from "./ui/validation.js";

const SignIn = ({ onSwitchToSignUp, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const { signIn } = useAuth();

  const validate = () => {
    const next = {};
    if (!email) next.email = "Enter your email address";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address, like name@example.com";
    if (!password) next.password = "Enter your password";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const next = validate();
    setErrors(next);
    // Move focus to the first field that needs attention
    const firstInvalid = next.email ? emailRef : next.password ? passwordRef : null;
    if (firstInvalid) {
      firstInvalid.current?.focus();
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      onSuccess("Welcome back!");
    } else {
      setFormError(result.message);
    }
  };

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError("");
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Welcome back to Cloud Drop</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <Input
          ref={emailRef}
          id="email"
          type="email"
          label="Email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          error={errors.email}
          disabled={loading}
          required
          autoComplete="email"
        />

        <Input
          ref={passwordRef}
          id="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
          error={errors.password}
          disabled={loading}
          required
          autoComplete="current-password"
        />

        {formError && <Alert>{formError}</Alert>}

        <Button
          type="submit"
          block
          loading={loading}
          loadingText="Signing in…"
        >
          Sign in
        </Button>
      </form>

      <p className="auth-switch">
        Don't have an account?{" "}
        <button
          type="button"
          className="link-button"
          onClick={onSwitchToSignUp}
          disabled={loading}
        >
          Create one
        </button>
      </p>
    </div>
  );
};

export default SignIn;
