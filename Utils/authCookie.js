const ACCESS_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "mykart_access";
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "mykart_refresh";

const isProduction = process.env.NODE_ENV === "production";
const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");
const secure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : sameSite === "none" || isProduction;

const positiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const accessCookieMaxAge = positiveNumber(process.env.ACCESS_COOKIE_MAX_AGE_MS, 15 * 60 * 1000);
const refreshCookieMaxAge = positiveNumber(process.env.REFRESH_COOKIE_MAX_AGE_MS, 30 * 24 * 60 * 60 * 1000);

const createCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure,
  sameSite,
  path: "/",
  maxAge,
});

const accessCookieOptions = createCookieOptions(accessCookieMaxAge);
const refreshCookieOptions = createCookieOptions(refreshCookieMaxAge);

const setAccessCookie = (res, token) => {
  res.cookie(ACCESS_COOKIE_NAME, token, accessCookieOptions);
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
};

const clearCookie = (res, name) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  });
};

const clearAccessCookie = (res) => clearCookie(res, ACCESS_COOKIE_NAME);
const clearRefreshCookie = (res) => clearCookie(res, REFRESH_COOKIE_NAME);

const clearAuthCookies = (res) => {
  clearAccessCookie(res);
  clearRefreshCookie(res);
};

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
};

const getAccessCookie = (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[ACCESS_COOKIE_NAME];
};

const getRefreshCookie = (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[REFRESH_COOKIE_NAME];
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions,
  setAccessCookie,
  setRefreshCookie,
  clearAccessCookie,
  clearRefreshCookie,
  clearAuthCookies,
  parseCookies,
  getAccessCookie,
  getRefreshCookie,
};
