import Cart from "../Models/cartModel.js";
import Product from "../Models/Product.js";

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id; // assuming auth middleware sets req.user

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Update quantity
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].price = product.price;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user cart
const getCart = async (req, res) => {
  try {
    console.log("Decoded user:", req.user); // 👈 check if user is attached
    const userId = req.user.id; // from authMiddleware

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }

    res.json(cart);
  } catch (error) {
    console.error("Error in getCart:", error.message);
    res.status(500).json({ error: "Error fetching cart", details: error.message });
  }
};



const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { productId } = req.params;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // remove the item
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    // recalculate totalAmount
    cart.totalAmount = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();

    // repopulate products before sending back
    cart = await Cart.findOne({ user: userId }).populate("items.product");

    res.json(cart);
  } catch (err) {
    console.error("Error in removeFromCart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update item quantity
const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    // 🔑 repopulate product details before sending back
    cart = await Cart.findOne({ user: userId }).populate("items.product");

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {addToCart, getCart, removeFromCart, updateQuantity};
