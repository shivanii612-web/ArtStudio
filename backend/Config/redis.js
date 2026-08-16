const { createClient } = require("redis");

const client = createClient({
    url : process.env.REDIS_URL || "redis://localhost:6380",
})

client.on("error" , (err) => {
    console.log("Redis Client Error", err)
})

const connectRedis = async () => {
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
            if (client.isReady) {
                return await client.get(key);
            }
        } catch (err) {
            console.error("Redis get error:", err);
        }
        return null;
    },
    async setEx(key, seconds, value) {
        try {
            if (client.isReady) {
                return await client.setEx(key, seconds, value);
            }
        } catch (err) {
            console.error("Redis setEx error:", err);
        }
        return null;
    }
};

module.exports = { redisClient, connectRedis }

