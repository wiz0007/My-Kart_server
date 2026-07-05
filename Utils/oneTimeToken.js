const crypto = require("crypto");

const createOneTimeToken = () => crypto.randomBytes(32).toString("hex");

const hashOneTimeToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const isValidOneTimeToken = (token) => {
  return typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);
};

module.exports = {
  createOneTimeToken,
  hashOneTimeToken,
  isValidOneTimeToken,
};
