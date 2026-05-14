const { z } = require('zod');

const skuSchema = z.object({
    sku: z.string().min(1, " SKU must be atleast 1 characters").max(25)
});

// the middleware for validating sku
const validateSku = (req, res, next) => {
    const result = skuSchema.safeParse(req.params);
    if (!result.success) {
        // 🚨 THE FIX: Added 'return' so the code stops executing!
        return res.status(400).json({
            success: false,
            message: "Validation failed: Invalid Sku",
            details: result.error.flatten().fieldErrors
        });
    }
    req.params = result.data;
    next();
};

module.exports = validateSku;