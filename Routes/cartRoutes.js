const express = require("express");
const {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
} = require("../Controllers/cartController");
const authMiddleware = require("../Middlewares/authMiddleware");

const router = express.Router();

// Protect all cart routes
router.post("/add", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.put("/update", authMiddleware, updateQuantity);
router.delete("/remove/:productId", authMiddleware, removeFromCart);

module.exports = router;
