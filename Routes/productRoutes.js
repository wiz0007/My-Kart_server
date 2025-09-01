const express = require('express');
// const upload = require('../Middlewares/upload');
const { getAllProducts, addProduct, getProductById, deleteProduct, deleteAllProducts, updateProduct, getProductsByCategory } = require('../Controllers/productController');
const router = express.Router();

// router.post('/upload', upload.single('image'), (req, res) => {
//   res.json({ imageUrl: `/uploads/${req.file.filename}` });
// });

router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.get('/products/category/:category', getProductsByCategory);
router.post('/products', addProduct);
router.delete('/products/:id', deleteProduct);
router.delete('/products', deleteAllProducts);
router.put('/products/:id', updateProduct);

module.exports = router;
