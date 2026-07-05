const express = require("express");
const {
  getAllProducts,
  addProduct,
  getProductById,
  deleteProduct,
  deleteAllProducts,
  updateProduct,
  getProductsByCategory,
} = require("../Controllers/productController");
const { requireAdminApiKey, validateObjectId } = require("../Middlewares/security");

const router = express.Router();

router.get("/products", getAllProducts);
router.get("/products/category/:category", getProductsByCategory);
router.get("/products/:id", validateObjectId("id"), getProductById);
router.post("/products", requireAdminApiKey, addProduct);
router.delete("/products", requireAdminApiKey, deleteAllProducts);
router.delete("/products/:id", requireAdminApiKey, validateObjectId("id"), deleteProduct);
router.put("/products/:id", requireAdminApiKey, validateObjectId("id"), updateProduct);

module.exports = router;
