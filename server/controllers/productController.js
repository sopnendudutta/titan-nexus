const db = require('../config/db');
const ActivityLog = require('../models/ActivityLog');
const catchAsync = require('../utils/catchAsync');
const redisClient = require('../config/redisClient');

// 1. Create Product
exports.createProduct = catchAsync(async (req, res, next) => {
    const { sku, name, description, category_id, price, quantity } = req.body;

    const [productResult] = await db.query(
        'INSERT INTO products(sku,name,description,category_id,price) VALUES(?,?,?,?,?)',
        [sku, name, description, category_id, price]
    );
    const newProductId = productResult.insertId;

    await db.query(
        'INSERT INTO inventory (product_id, quantity_on_hand) VALUES (?, ?)',
        [newProductId, quantity || 0]
    );

    const newLog = new ActivityLog({
        action: 'PRODUCT_CREATED',
        details: { productId: newProductId, sku: sku, initialStock: quantity },
        performedBy: req.user.email // 👈 Fixed typo
    });
    await newLog.save();
    await redisClient.del('all_products');

    res.status(201).json({
        success: true,
        message: "Product forged in Titan and logged in Nexus!",
        data: { id: newProductId, sku }
    });
});

// 2. Get All Products
exports.getAllProducts = catchAsync(async (req, res, next) => {
    const cacheKey = 'all_products';
    const cachedProducts = await redisClient.get(cacheKey);

    if (cachedProducts) {
        return res.status(200).json({
            success: true,
            source: 'Redis Cache ⚡',
            count: JSON.parse(cachedProducts).length,
            data: JSON.parse(cachedProducts)
        });
    }

    // 👈 Added LEFT JOIN so React can actually see the quantities!
    const [products] = await db.query(`
        SELECT p.*, i.quantity_on_hand as quantity 
        FROM products p 
        LEFT JOIN inventory i ON p.product_id = i.product_id
    `);

    await redisClient.set(cacheKey, JSON.stringify(products), { EX: 3600 });

    res.status(200).json({
        success: true,
        source: 'MySQL Database 🗄️',
        count: products.length,
        data: products
    });
});

// 3. Update Stock
exports.updateStock = catchAsync(async (req, res, next) => {
    const { sku } = req.params;
    const { newQuantity } = req.body;

    const [productRows] = await db.query('SELECT product_id from products WHERE sku = ?', [sku]);

    if (productRows.length === 0) {
        const error = new Error("Product not found in Titan core");
        error.statusCode = 404;
        throw error;
    }

    const productId = productRows[0].product_id;
    await db.query('UPDATE inventory SET quantity_on_hand = ? WHERE product_id = ?', [newQuantity, productId]);

    const newLog = new ActivityLog({
        action: 'STOCK_UPDATED',
        details: { productId, sku, newStockLevel: newQuantity },
        performedBy: req.user.email // 👈 Fixed typo
    });
    await newLog.save();
    await redisClient.del('all_products');

    res.status(200).json({
        success: true,
        message: `Stock for ${sku} updated to ${newQuantity}`,
        data: { sku, newQuantity }
    });
});

// 4. Delete Product
exports.deleteProduct = catchAsync(async (req, res, next) => {
    const { sku } = req.params;
    const [productRows] = await db.query('SELECT product_id FROM products WHERE sku = ?', [sku]);

    if (productRows.length === 0) {
        const error = new Error("Product not found in Titan core");
        error.statusCode = 404;
        throw error;
    }

    const productId = productRows[0].product_id;

    await db.query('DELETE FROM inventory WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM products WHERE product_id = ?', [productId]);

    const newLog = new ActivityLog({
        action: 'PRODUCT_DELETED',
        details: { productID: productId, sku: sku, note: "Permanently removed" },
        performedBy: req.user.email // 👈 Fixed typo
    });
    await newLog.save();
    await redisClient.del('all_products');

    res.status(200).json({
        success: true,
        message: `Product ${sku} deleted.`
    });
});