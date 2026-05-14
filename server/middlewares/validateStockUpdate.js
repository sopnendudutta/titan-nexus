const { z, success } = require('zod');

// let's create the schema for JSON body
const stockUpdateSchema = z.object({
    newQuantity: z.number().int().min(0, "stock cannot be negative")
});

const validateStockUpdate = (req, res, next) => {
    const result = stockUpdateSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed: Invalid stock quantity",
            details: result.error.flatten().fieldErrors
        });
    }
    req.body = result.data;
    next();
};

module.exports = validateStockUpdate;