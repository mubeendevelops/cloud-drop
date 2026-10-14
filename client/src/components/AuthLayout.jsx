import Card from "./ui/Card.jsx";
import GradientMesh from "./ui/GradientMesh.jsx";
import Logo from "./ui/Logo.jsx";
import AppFooter from "./AppFooter.jsx";

// Centered card with the logo above it; used by sign-in, sign-up and the
// connection-error screen.
const AuthLayout = ({ children }) => (
  <div className="page page-auth">
    <GradientMesh className="mesh-auth" />
    <main className="auth-main">
      <Logo size="lg" className="auth-logo" />
      <Card className="auth-card">{children}</Card>
      <p className="auth-tagline">
        Upload, store, and download your files from anywhere.
      </p>
    </main>
    <AppFooter />
  </div>
);

export default AuthLayout;
