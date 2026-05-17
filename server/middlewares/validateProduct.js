const { z } = require('zod');
// 🚨 DELETED: const { validate } = require('../models/ActivityLog');

const productSchema = z.object({
    sku: z.string().min(3, "SKU must be at least 3 characters").max(20),
    name: z.string().min(3, "Name must be at least 3 characters").max(100),
    description: z.string().optional().nullable(),
    category_id: z.number().int().positive("Category_id must be a positive integer"),
    price: z.number().positive("Price must be greater than 0"),
    quantity: z.number().int().min(0, "Qunatity cannot be negative").default(0)
});

const validateProduct = (req, res, next) => {
    console.log("🛡️ Validation checkpoint reached");

    const result = productSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Validation Failed: Invalid Data",
            details: result.error.flatten().fieldErrors
        });
    }

    req.body = result.data;
    next();
};

module.exports = validateProduct;