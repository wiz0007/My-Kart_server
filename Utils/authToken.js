const jwt = require("jsonwebtoken");

const JWT_ISSUER = "mykart-api";
const JWT_AUDIENCE = "mykart-client";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return secret || "dev_only_change_this_jwt_secret";
};

const signAccessToken = (userId) => {
  const subject = userId.toString();

  return jwt.sign({ id: subject }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    subject,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getJwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
