import React, { createContext, useContext, useState, useEffect } from "react";
import { register, login, getMe } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Verify token when token changes or on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        localStorage.setItem("token", token);
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          // Token invalid or expired
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
        } finally {
          setLoading(false);
        }
      } else {
        localStorage.removeItem("token");
        setUser(null);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const signUp = async (email, password, name) => {
    try {
      const response = await register(email, password, name);
      setToken(response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || error.message || "Registration failed",
      };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await login(email, password);
      setToken(response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const value = {
    user,
    token,
    loading,
    signUp,
    signIn,
    signOut,
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

