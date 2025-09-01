const Product = require("../Models/Product");

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  try {
    const product = req.body;

    if (!Array.isArray(product) || product.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const inserted = await Product.insertMany(product);
    res.status(201).json({ success: true, inserted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    res.status(200).json({
      success: true,
      message: "All products have been deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete products.",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = { getAllProducts, addProduct, getProductById, deleteProduct, deleteAllProducts, updateProduct, getProductsByCategory };
