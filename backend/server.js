// Deploy trigger: 2026-08-22T15:05 — admin auth + OTP routes + forgot-password
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectToDB = require("./Config/db");
const productRoutes = require("./Routes/ProductRoute");
const userRoutes = require("./Routes/UserRoute");
const orderRoutes = require("./Routes/OrderRoute");
const { connectRedis } = require("./Config/redis");

const app = express();

const allowedOrigins = [
  "https://artstudio-eta.vercel.app",
  "https://artstudio-1pkw9er54-myself-2eae.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // allow all for now; tighten after go-live
  },
  credentials: true,
}));

app.use(bodyParser.json());

// Health check — confirms which code version is running
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "2026-08-22-resend-migration",
    routes: ["forgot-password", "verify-email", "register-otp", "admin-protected-update"]
  });
});

app.use("/", userRoutes);

app.use("/", productRoutes);
app.use("/orders", orderRoutes);


connectToDB();
connectRedis();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});