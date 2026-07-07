const dotenv = require("dotenv");
dotenv.config();

const validateConfig = require("./Utils/validateConfig");
validateConfig();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const productRoutes = require("./Routes/productRoutes");
const authRoutes = require("./Routes/authRoutes");
const cartRoutes = require("./Routes/cartRoutes");
const addressRoutes = require("./Routes/addressRoutes");
const csrfProtection = require("./Middlewares/csrfProtection");
const {
  corsOptions,
  securityHeaders,
  originGuard,
  sanitizeRequest,
  createRateLimiter,
  notFoundHandler,
  errorHandler,
} = require("./Middlewares/security");

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(securityHeaders);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(originGuard);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(sanitizeRequest);
app.use(csrfProtection);

app.use(
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    message: "Too many requests. Please try again later.",
  })
);

app.use("/uploads", express.static("uploads", {
  dotfiles: "deny",
  index: false,
  maxAge: "1d",
}));

connectDB();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





