const Product = require("../Models/Product");

const allowedProductFields = ["name", "description", "price", "image", "category"];

const cleanText = (value, max = 500) => String(value || "").trim().slice(0, max);

const normalizeProduct = (input, { partial = false } = {}) => {
  const product = {};

  for (const field of allowedProductFields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      product[field] = input[field];
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(product, "name")) {
    product.name = cleanText(product.name, 120);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(product, "description")) {
    product.description = cleanText(product.description, 1000);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(product, "image")) {
    product.image = cleanText(product.image, 500);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(product, "category")) {
    product.category = cleanText(product.category, 80);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(product, "price")) {
    product.price = Number(product.price);
  }

  if (partial && Object.keys(product).length === 0) return null;
  if ((!partial || Object.prototype.hasOwnProperty.call(product, "name")) && !product.name) return null;
  if ((!partial || Object.prototype.hasOwnProperty.call(product, "category")) && !product.category) return null;
  if ((!partial || Object.prototype.hasOwnProperty.call(product, "image")) && !product.image) return null;
  if ((!partial || Object.prototype.hasOwnProperty.call(product, "price")) && (!Number.isFinite(product.price) || product.price < 0)) return null;

  return product;
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ addedAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const addProduct = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (payload.length === 0 || payload.length > 100) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const products = payload.map(normalizeProduct);

    if (products.some((product) => !product)) {
      return res.status(400).json({ success: false, message: "Invalid product data" });
    }

    const inserted = await Product.insertMany(products, { ordered: true });
    return res.status(201).json({ success: true, inserted });
  } catch (err) {
    console.error("Error adding products:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    return res.status(200).json({ success: true, message: "All products deleted" });
  } catch (error) {
    console.error("Error deleting products:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updates = normalizeProduct(req.body, { partial: true });

    if (!updates) {
      return res.status(400).json({ success: false, message: "Invalid product data" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const category = cleanText(req.params.category, 80);
    const products = await Product.find({ category }).sort({ addedAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching category products:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllProducts,
  addProduct,
  getProductById,
  deleteProduct,
  deleteAllProducts,
  updateProduct,
  getProductsByCategory,
};

