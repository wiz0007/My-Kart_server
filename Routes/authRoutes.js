const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleLogin,
  csrf,
  refresh,
  me,
  logout,
} = require("../Controllers/authController");
const authMiddleware = require("../Middlewares/authMiddleware");
const { createRateLimiter } = require("../Middlewares/security");

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  message: "Too many auth attempts. Please try again later.",
});

router.get("/csrf", csrf);
router.get("/me", authMiddleware, me);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.get("/verify-email/:token", authLimiter, verifyEmail);
router.post("/google", authLimiter, googleLogin);

module.exports = router;
