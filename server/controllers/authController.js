import User from "../models/User.js";
import jwt from "jsonwebtoken";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const register = async (req, res, next) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;
    const name = req.body?.name?.trim();

    if (!email || !password || !name) {
      throw createError("Please provide email, password, and name", 400);
    }

    if (!isValidEmail(email)) {
      throw createError("Please provide a valid email address", 400);
    }

    if (password.length < 6) {
      throw createError("Password must be at least 6 characters", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError("An account with this email already exists", 409);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      throw createError("Please provide email and password", 400);
    }

    if (!isValidEmail(email)) {
      throw createError("Please provide a valid email address", 400);
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw createError("No account found with this email", 404);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createError("Incorrect password", 401);
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    next(error);
  }
};

