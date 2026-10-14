import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  register,
  login,
  getMe,
  getErrorMessage,
  isNetworkError,
  isUnauthorized,
  setUnauthorizedHandler,
} from "../services/api.js";

const AuthContext = createContext(null);

const getAuthErrorMessage = (error, fallbackMessage) => {
  if (isNetworkError(error)) return getErrorMessage(error, fallbackMessage);

  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;

  if (status === 409) return "An account with this email already exists";
  if (status === 401) return "Invalid email or password";
  if (status === 429) return "Too many attempts. Please try again later.";

  return error.message || fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  // Set when the stored token could not be checked because the server did not
  // answer; the token is kept so a retry can restore the session.
  const [connectionError, setConnectionError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [verifyAttempt, setVerifyAttempt] = useState(0);
  // The token already known to be valid (just issued, or confirmed by getMe)
  const verifiedTokenRef = useRef(null);

  const clearSession = useCallback(() => {
    verifiedTokenRef.current = null;
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setConnectionError("");
  }, []);

  // Any authenticated request answered with 401 ends the session
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setSessionExpired(true);
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Verify a stored token on mount, and again when the user retries
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (verifiedTokenRef.current === token) {
      // Issued by signIn/signUp a moment ago; no need to ask the server again
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setConnectionError("");

    getMe()
      .then((userData) => {
        if (cancelled) return;
        verifiedTokenRef.current = token;
        setUser(userData);
      })
      .catch((error) => {
        if (cancelled) return;
        // A 401 has already cleared the session through the interceptor.
        // Anything else (timeout, network error, 5xx) keeps the token.
        if (!isUnauthorized(error)) {
          setConnectionError(
            getErrorMessage(error, "Could not reach the server.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, verifyAttempt]);

  const startSession = (response) => {
    verifiedTokenRef.current = response.token;
    localStorage.setItem("token", response.token);
    setSessionExpired(false);
    setConnectionError("");
    setToken(response.token);
    setUser(response.user);
  };

  const signUp = async (email, password, name) => {
    try {
      const response = await register(email, password, name);
      startSession(response);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getAuthErrorMessage(error, "Registration failed"),
      };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await login(email, password);
      startSession(response);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getAuthErrorMessage(error, "Login failed"),
      };
    }
  };

  const signOut = clearSession;

  const retryConnection = useCallback(() => {
    setVerifyAttempt((attempt) => attempt + 1);
  }, []);

  const acknowledgeSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = {
    user,
    token,
    loading,
    connectionError,
    sessionExpired,
    signUp,
    signIn,
    signOut,
    retryConnection,
    acknowledgeSessionExpired,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
