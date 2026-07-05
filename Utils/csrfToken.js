const crypto = require("crypto");
const { parseCookies } = require("./authCookie");

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "mykart_csrf";
const CSRF_HEADER_NAME = process.env.CSRF_HEADER_NAME || "X-CSRF-Token";

const isProduction = process.env.NODE_ENV === "production";
const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");
const secure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : sameSite === "none" || isProduction;

const csrfCookieOptions = {
  httpOnly: false,
  secure,
  sameSite,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

const setCsrfCookie = (res, token = createCsrfToken()) => {
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  return token;
};

const getCsrfCookie = (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[CSRF_COOKIE_NAME];
};

const tokensMatch = (cookieToken, headerToken) => {
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) return false;

  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
};

module.exports = {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfToken,
  setCsrfCookie,
  getCsrfCookie,
  tokensMatch,
};
