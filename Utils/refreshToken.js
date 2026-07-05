const crypto = require("crypto");

const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30;

const createRefreshToken = () => crypto.randomBytes(64).toString("hex");

const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getRefreshTokenExpiresAt = () => {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
};

module.exports = {
  REFRESH_TOKEN_TTL_DAYS,
  createRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
};
