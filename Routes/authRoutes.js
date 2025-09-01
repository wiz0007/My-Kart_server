const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  googleLogin
} = require("../Controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);

router.post("/google", googleLogin);

module.exports = router;