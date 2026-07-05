const mongoose = require("mongoose");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: emailPattern,
      index: true,
    },
    password: {
      type: String,
      required() {
        return this.authProvider === "local";
      },
      minlength: 8,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatar: {
      type: String,
      trim: true,
    },
    verificationTokenHash: {
      type: String,
      select: false,
      index: true,
    },
    verificationTokenExpiresAt: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      index: true,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    refreshTokenHash: {
      type: String,
      select: false,
      index: true,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
