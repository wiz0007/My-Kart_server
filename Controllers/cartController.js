const mongoose = require("mongoose");
const Cart = require("../Models/cartModel");
const Product = require("../Models/Product");

const normalizeQuantity = (quantity) => {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) return null;
  return parsed;
};

const recalculateTotal = (cart) => {
  cart.totalAmount = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const quantity = normalizeQuantity(req.body.quantity || 1);
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId) || !quantity) {
      return res.status(400).json({ message: "Invalid cart item" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = Math.min(cart.items[itemIndex].quantity + quantity, 99);
      cart.items[itemIndex].price = product.price;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }

    recalculateTotal(cart);
    await cart.save();

    const populatedCart = await Cart.findOne({ user: userId }).populate("items.product");
    return res.json(populatedCart);
  } catch (err) {
    console.error("Error adding to cart:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }

    return res.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    recalculateTotal(cart);
    await cart.save();

    cart = await Cart.findOne({ user: userId }).populate("items.product");
    return res.json(cart);
  } catch (err) {
    console.error("Error removing from cart:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    const quantity = normalizeQuantity(req.body.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId) || !quantity) {
      return res.status(400).json({ message: "Invalid cart item" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items[itemIndex].quantity = quantity;
    recalculateTotal(cart);
    await cart.save();

    cart = await Cart.findOne({ user: userId }).populate("items.product");
    return res.json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { addToCart, getCart, removeFromCart, updateQuantity };
