const jwt = require("jsonwebtoken");
const User = require("../Models/userSchema");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user (exclude password field)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ msg: "User not found. Please signup or login first." });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ msg: "Invalid token. Please login again." });
    }
  }

  // If no token
  return res.status(401).json({ msg: "Not authorized. Please signup or login to continue." });
};

module.exports = authMiddleware;


