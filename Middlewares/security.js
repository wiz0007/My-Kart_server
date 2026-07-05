const mongoose = require("mongoose");

const developmentAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const productionAllowedOrigins = [
  "https://my-kart-taupe.vercel.app",
];

const getDefaultAllowedOrigins = () => {
  return process.env.NODE_ENV === "production" ? productionAllowedOrigins : [...developmentAllowedOrigins, ...productionAllowedOrigins];
};

const getAllowedOrigins = () => {
  const envOrigins = [process.env.FRONTEND_URL, process.env.CLIENT_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .flatMap((origin) => origin.split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...getDefaultAllowedOrigins(), ...envOrigins]);
};

const isAllowedOrigin = (origin) => !origin || getAllowedOrigins().has(origin);

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    const error = new Error("Origin not allowed by CORS");
    error.status = 403;
    return callback(error);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Admin-API-Key", "X-CSRF-Token"],
  credentials: true,
  maxAge: 60 * 60,
};

const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
};

const originGuard = (req, res, next) => {
  const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
  if (safeMethods.has(req.method)) return next();

  const origin = req.get("Origin");
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ msg: "Origin not allowed" });
  }

  return next();
};

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.entries(value).reduce((clean, [key, nestedValue]) => {
      if (key.startsWith("$") || key.includes(".")) return clean;
      clean[key] = sanitizeValue(nestedValue);
      return clean;
    }, {});
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  next();
};

const createRateLimiter = ({ windowMs, max, message }) => {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.originalUrl.split("?")[0]}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({ msg: message || "Too many requests" });
    }

    if (hits.size > 10000) {
      for (const [storedKey, storedValue] of hits.entries()) {
        if (storedValue.resetAt <= now) hits.delete(storedKey);
      }
    }

    return next();
  };
};

const validateObjectId = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({ msg: `Invalid ${paramName}` });
  }

  return next();
};

const requireAdminApiKey = (req, res, next) => {
  const configuredKey = process.env.ADMIN_API_KEY;
  const providedKey = req.get("X-Admin-API-Key");

  if (!configuredKey) {
    return res.status(403).json({ msg: "Admin API key is not configured" });
  }

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(403).json({ msg: "Admin access denied" });
  }

  return next();
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ msg: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || err.status || 500;
  const safeMessage = statusCode >= 500 ? "Server error" : err.message;

  if (statusCode >= 500) {
    console.error("Unhandled error:", err);
  }

  return res.status(statusCode).json({ msg: safeMessage });
};

module.exports = {
  corsOptions,
  securityHeaders,
  originGuard,
  sanitizeRequest,
  createRateLimiter,
  validateObjectId,
  requireAdminApiKey,
  notFoundHandler,
  errorHandler,
};
