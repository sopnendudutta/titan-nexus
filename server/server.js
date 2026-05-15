
// importing modules
require('dotenv').config();
const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const db = require('./config/db');
require('./config/redisClient');
const rateLimit = require('express-rate-limit');



const app = express();
app.set('trust proxy', 1);
app.use(express.json());
//  Restricts API access to your frontend URL
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Nexus Flexible Layer (MongoDB)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Nexus Connected: MongoDB is Live'))
    .catch(err => console.error('❌ MongoDB Connection Failed:', err));

// adding rate limiter 
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // creating a 1 minute window
    max: 500, // limiting the req to 10 per IP
    message: {
        success: false,
        message: 'Security Alert: Too many requests ! Try again after 60 seconds.'
    },
    standardHeader: true, // return the rate-limit info to the header in rate-limit section
    legacyHeaders: false  // disable the previous rate-limiter
})

// Routing
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);


// Health Check Route
app.get('/api/status', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ message: "Titan Nexus Operational", mysql: "OK", mongodb: "OK" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Titan Nexus Server soaring on port ${PORT}`));