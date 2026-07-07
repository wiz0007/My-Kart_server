const weakSecretValues = new Set([
  "replace_with_a_long_random_secret",
  "replace_with_a_long_random_admin_key",
  "dev_only_change_this_jwt_secret",
  "password",
  "secret",
  "changeme",
]);

const requiredInProduction = ["MONGO_URL", "JWT_SECRET"];

const isProduction = () => process.env.NODE_ENV === "production";

const hasValue = (value) => Boolean(String(value || "").trim());

const isWeakSecret = (value) => {
  if (!value) return true;
  const normalized = String(value).trim();
  return normalized.length < 32 || weakSecretValues.has(normalized.toLowerCase());
};

const normalizeSameSite = () => String(process.env.COOKIE_SAME_SITE || "").toLowerCase();

const getConfiguredOrigins = () => {
  return [process.env.FRONTEND_URL, process.env.CLIENT_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .flatMap((origin) => origin.split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const validateConfig = () => {
  const errors = [];

  if (isProduction()) {
    for (const key of requiredInProduction) {
      if (!process.env[key]) errors.push(`${key} is required in production`);
    }

    if (hasValue(process.env.JWT_SECRET) && isWeakSecret(process.env.JWT_SECRET)) {
      errors.push("JWT_SECRET must be at least 32 characters and not a placeholder");
    }

    if (hasValue(process.env.ADMIN_API_KEY) && isWeakSecret(process.env.ADMIN_API_KEY)) {
      errors.push("ADMIN_API_KEY must be at least 32 characters and not a placeholder when configured");
    }

    const allowedOrigins = getConfiguredOrigins();

    if (allowedOrigins.length === 0) {
      errors.push("At least one production CORS origin must be configured");
    }

    if (allowedOrigins.some((origin) => origin.includes("localhost") || origin.includes("127.0.0.1"))) {
      errors.push("Production CORS origins must not include localhost");
    }

    if (process.env.COOKIE_SECURE === "false") {
      errors.push("COOKIE_SECURE must not be false in production");
    }
  }

  if (normalizeSameSite() === "none" && process.env.COOKIE_SECURE === "false") {
    errors.push("COOKIE_SECURE must be true when COOKIE_SAME_SITE=none");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid server configuration:\n- ${errors.join("\n- ")}`);
  }
};

module.exports = validateConfig;
