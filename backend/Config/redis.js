const { createClient } = require("redis");

const isProduction = process.env.NODE_ENV === "production";
let redisUrl = process.env.REDIS_URL;

// In production, if REDIS_URL is missing or contains localhost/127.0.0.1/::1,
// do not attempt localhost connections to prevent endless retry logs.
if (isProduction) {
    if (!redisUrl || redisUrl.includes("localhost") || redisUrl.includes("127.0.0.1") || redisUrl.includes("::1")) {
        console.warn("REDIS_URL is missing or points to localhost in production. Redis connection will not be attempted.");
        redisUrl = null;
    }
} else {
    // In local development, fall back to localhost if REDIS_URL is not set
    if (!redisUrl) {
        redisUrl = "redis://localhost:6379";
    }
}

const client = redisUrl ? createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            const maxRetries = isProduction ? 3 : 5;
            if (retries >= maxRetries) {
                console.error(`Redis reconnection failed after ${maxRetries} attempts. Disabling Redis client.`);
                return false; // Stop reconnection attempts
            }
            // Backoff retry timing
            return Math.min(retries * 500, 2000);
        },
        connectTimeout: 5000 // 5 seconds connection timeout
    }
}) : null;

if (client) {
    client.on("error", (err) => {
        console.error("Redis Client Error:", err);
    });
}

const connectRedis = async () => {
    if (!client) {
        console.log("Redis client is not initialized (no production REDIS_URL or local fallback). Caching disabled.");
        return;
    }
    try {
        await client.connect();
        console.log("Connected to Redis");
    } catch (error) {
        console.error("Error connecting to Redis:", error);
    }
}

const redisClient = {
    async get(key) {
        try {
            if (client && client.isReady) {
                return await client.get(key);
            }
        } catch (err) {
            console.error("Redis get error:", err);
        }
        return null;
    },
    async setEx(key, seconds, value) {
        try {
            if (client && client.isReady) {
                return await client.setEx(key, seconds, value);
            }
        } catch (err) {
            console.error("Redis setEx error:", err);
        }
        return null;
    }
};

module.exports = { redisClient, connectRedis }


