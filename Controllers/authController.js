const User = require("../Models/userSchema");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { signAccessToken } = require("../Utils/authToken");
const {
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  getRefreshCookie,
} = require("../Utils/authCookie");
const { setCsrfCookie } = require("../Utils/csrfToken");
const {
  createRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
} = require("../Utils/refreshToken");
const {
  getVerificationTokenExpiresAt,
  getPasswordResetTokenExpiresAt,
  isAccountLocked,
  recordFailedLogin,
  resetFailedLogins,
} = require("../Utils/accountSecurity");
const {
  createOneTimeToken,
  hashOneTimeToken,
  isValidOneTimeToken,
} = require("../Utils/oneTimeToken");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const genericResetMessage = "If an account exists, password reset instructions have been sent.";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeName = (name) => String(name || "").trim().replace(/\s+/g, " ");
const isValidPassword = (password) => password.length >= 8 && password.length <= 128;

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendSafeError = (res, status, msg) => res.status(status).json({ msg });
const sendInvalidCredentials = (res) => sendSafeError(res, 401, "Invalid credentials");
const sendAccountLocked = (res) => sendSafeError(res, 429, "Too many failed attempts. Try again later.");

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
});

const issueSession = async (res, user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = createRefreshToken();

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = getRefreshTokenExpiresAt();
  await user.save();

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);

  return formatUser(user);
};

exports.register = async (req, res) => {
  try {
    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return sendSafeError(res, 400, "All fields are required");
    }

    if (name.length < 2 || name.length > 80) {
      return sendSafeError(res, 400, "Invalid name");
    }

    if (!emailPattern.test(email)) {
      return sendSafeError(res, 400, "Invalid email address");
    }

    if (!isValidPassword(password)) {
      return sendSafeError(res, 400, "Password must be 8 to 128 characters");
    }

    const existing = await User.findOne({ email }).select("_id");
    if (existing) return sendSafeError(res, 409, "User already exists");

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = createOneTimeToken();

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
      verificationTokenHash: hashOneTimeToken(verificationToken),
      verificationTokenExpiresAt: getVerificationTokenExpiresAt(),
    });

    const verifyURL = `${FRONTEND_URL.replace(/\/$/, "")}/verify-email/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newUser.email,
      subject: "Verify your MyKart email",
      html: `<p>Verify your email: <a href="${verifyURL}">Verify</a></p>`,
    });

    return res.status(201).json({ msg: "Verification email sent" });
  } catch (err) {
    console.error("Registration failed:", err);
    return sendSafeError(res, 500, "Registration failed");
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!isValidOneTimeToken(token)) {
      return sendSafeError(res, 400, "Invalid or expired token");
    }

    const verificationTokenHash = hashOneTimeToken(token);
    const user = await User.findOne({ verificationTokenHash }).select(
      "+verificationTokenHash +verificationTokenExpiresAt"
    );

    if (!user) return sendSafeError(res, 400, "Invalid or expired token");

    if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt <= new Date()) {
      user.verificationTokenHash = undefined;
      user.verificationTokenExpiresAt = undefined;
      await user.save();
      return sendSafeError(res, 400, "Invalid or expired token");
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error("Verification failed:", err);
    return sendSafeError(res, 500, "Verification failed");
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!emailPattern.test(email)) {
      return res.status(200).json({ msg: genericResetMessage });
    }

    const user = await User.findOne({ email }).select("authProvider email name");

    if (!user || user.authProvider !== "local") {
      return res.status(200).json({ msg: genericResetMessage });
    }

    const resetToken = createOneTimeToken();
    user.passwordResetTokenHash = hashOneTimeToken(resetToken);
    user.passwordResetTokenExpiresAt = getPasswordResetTokenExpiresAt();
    await user.save();

    const resetURL = `${FRONTEND_URL.replace(/\/$/, "")}/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset your MyKart password",
        html: `<p>Reset your password: <a href="${resetURL}">Reset password</a></p>`,
      });
    } catch (mailError) {
      console.error("Password reset email failed:", mailError);
    }

    return res.status(200).json({ msg: genericResetMessage });
  } catch (err) {
    console.error("Forgot password failed:", err);
    return res.status(200).json({ msg: genericResetMessage });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const password = String(req.body.password || "");

    if (!isValidOneTimeToken(token) || !isValidPassword(password)) {
      return sendSafeError(res, 400, "Invalid or expired reset token");
    }

    const passwordResetTokenHash = hashOneTimeToken(token);
    const user = await User.findOne({ passwordResetTokenHash }).select(
      "+password +passwordResetTokenHash +passwordResetTokenExpiresAt +failedLoginAttempts +lockUntil"
    );

    if (!user) return sendSafeError(res, 400, "Invalid or expired reset token");

    if (!user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt <= new Date()) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetTokenExpiresAt = undefined;
      await user.save();
      return sendSafeError(res, 400, "Invalid or expired reset token");
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    resetFailedLogins(user);
    await user.save();

    clearAuthCookies(res);
    return res.status(200).json({ msg: "Password reset successful" });
  } catch (err) {
    console.error("Reset password failed:", err);
    return sendSafeError(res, 500, "Password reset failed");
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password || !emailPattern.test(email)) {
      return sendInvalidCredentials(res);
    }

    const user = await User.findOne({ email }).select(
      "+password +failedLoginAttempts +lockUntil isVerified authProvider name email avatar"
    );

    if (!user || user.authProvider !== "local" || !user.password) {
      return sendInvalidCredentials(res);
    }

    if (user.lockUntil && user.lockUntil <= new Date()) {
      resetFailedLogins(user);
    }

    if (isAccountLocked(user)) {
      return sendAccountLocked(res);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const locked = await recordFailedLogin(user);
      return locked ? sendAccountLocked(res) : sendInvalidCredentials(res);
    }

    resetFailedLogins(user);

    if (!user.isVerified) {
      await user.save();
      return sendSafeError(res, 403, "Please verify your email first");
    }

    user.lastLoginAt = new Date();
    const userPayload = await issueSession(res, user);

    return res.status(200).json({
      msg: "Login successful",
      user: userPayload,
    });
  } catch (err) {
    console.error("Login failed:", err);
    return sendSafeError(res, 500, "Login failed");
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || !process.env.GOOGLE_CLIENT_ID) {
      return sendSafeError(res, 400, "Google login is not available");
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    const normalizedEmail = normalizeEmail(email);

    if (!emailPattern.test(normalizedEmail)) {
      return sendSafeError(res, 400, "Invalid Google account");
    }

    let user = await User.findOne({ email: normalizedEmail }).select("+password +failedLoginAttempts +lockUntil");

    if (!user) {
      user = await User.create({
        name: normalizeName(name) || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        authProvider: "google",
        isVerified: true,
        avatar: picture,
        lastLoginAt: new Date(),
      });
    } else {
      if (!user.password && user.authProvider !== "google") {
        user.authProvider = "google";
      }

      if (!user.avatar && picture) {
        user.avatar = picture;
      }

      if (!user.isVerified) {
        user.isVerified = true;
      }

      resetFailedLogins(user);
      user.lastLoginAt = new Date();
    }

    const userPayload = await issueSession(res, user);

    return res.json({
      msg: "Google login successful",
      user: userPayload,
    });
  } catch (error) {
    console.error("Google login failed:", error);
    return sendSafeError(res, 500, "Google login failed");
  }
};

exports.csrf = async (req, res) => {
  const csrfToken = setCsrfCookie(res);
  return res.status(200).json({ csrfToken });
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = getRefreshCookie(req);

    if (!refreshToken) {
      clearAuthCookies(res);
      return sendSafeError(res, 401, "Authentication required");
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);
    const user = await User.findOne({ refreshTokenHash }).select(
      "+refreshTokenHash +refreshTokenExpiresAt name email avatar"
    );

    if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt <= new Date()) {
      if (user) {
        user.refreshTokenHash = undefined;
        user.refreshTokenExpiresAt = undefined;
        await user.save();
      }

      clearAuthCookies(res);
      return sendSafeError(res, 401, "Authentication required");
    }

    const userPayload = await issueSession(res, user);

    return res.status(200).json({
      msg: "Session refreshed",
      user: userPayload,
    });
  } catch (err) {
    console.error("Refresh failed:", err);
    clearAuthCookies(res);
    return sendSafeError(res, 401, "Authentication required");
  }
};

exports.me = async (req, res) => {
  return res.status(200).json({
    user: formatUser(req.user),
  });
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = getRefreshCookie(req);

    if (refreshToken) {
      const refreshTokenHash = hashRefreshToken(refreshToken);
      await User.updateOne(
        { refreshTokenHash },
        { $unset: { refreshTokenHash: "", refreshTokenExpiresAt: "" } }
      );
    }

    clearAuthCookies(res);
    return res.status(200).json({ msg: "Logged out" });
  } catch (err) {
    console.error("Logout failed:", err);
    clearAuthCookies(res);
    return res.status(200).json({ msg: "Logged out" });
  }
};
