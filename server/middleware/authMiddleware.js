import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      const error = new Error("Not authorized, no token provided");
      error.statusCode = 401;
      throw error;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.userId);
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 401;
        throw error;
      }

      // Attach user to request
      req.user = {
        userId: user._id.toString(),
        email: user.email,
      };

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        const authError = new Error("Invalid token");
        authError.statusCode = 401;
        throw authError;
      }
      if (error.name === "TokenExpiredError") {
        const authError = new Error("Token expired");
        authError.statusCode = 401;
        throw authError;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

