const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// We import the functions directly
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Validations
const validateProduct = require('../middlewares/validateProduct');
const validateStockUpdate = require('../middlewares/validateStockUpdate');
const validateSku = require('../middlewares/validateSku');

// Routes
router.post('/', protect, restrictTo('Admin'), validateProduct, productController.createProduct);
router.get('/', protect, productController.getAllProducts);

// 👈 FIX: Changed 'authMiddleware.protect' to just 'protect'
router.patch('/:sku', protect, validateStockUpdate, productController.updateStock);

router.delete('/:sku', protect, restrictTo('Admin'), validateSku, productController.deleteProduct);

module.exports = router;