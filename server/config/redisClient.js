const { createClient } = require('redis');

// now we creating the client 
const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client error:', err));
redisClient.on('connect', () => console.log('Redis Cache connected successfully'));

// let us connect the db 

redisClient.connect().catch((err) => console.error('Failed to connect to Redis', err));

module.exports = redisClient;