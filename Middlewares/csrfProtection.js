const { CSRF_HEADER_NAME, getCsrfCookie, tokensMatch } = require("../Utils/csrfToken");

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

const csrfProtection = (req, res, next) => {
  if (safeMethods.has(req.method)) return next();

  const adminApiKey = process.env.ADMIN_API_KEY;
  if (adminApiKey && req.get("X-Admin-API-Key") === adminApiKey) {
    return next();
  }

  const cookieToken = getCsrfCookie(req);
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!tokensMatch(cookieToken, headerToken)) {
    return res.status(403).json({ msg: "Invalid CSRF token" });
  }

  return next();
};

module.exports = csrfProtection;
