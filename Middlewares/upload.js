const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = new Set(["image/jpeg", "image/png", "image/jpg", "image/webp"]);

  if (allowed.has(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new Error("Unsupported file type"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload;
