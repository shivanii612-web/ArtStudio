// Temporary debug server — exposes real errors, then we delete this
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectToDB = require("./Config/db");
const productRoutes = require("./Routes/ProductRoute");
const userRoutes = require("./Routes/UserRoute");
const orderRoutes = require("./Routes/OrderRoute");
const { connectRedis } = require("./Config/redis");

// Catch ALL unhandled rejections and print them
process.on("unhandledRejection", (reason, promise) => {
  console.error("=== UNHANDLED REJECTION ===");
  console.error("Reason:", reason);
  if (reason && reason.stack) console.error("Stack:", reason.stack);
});

process.on("uncaughtException", (err) => {
  console.error("=== UNCAUGHT EXCEPTION ===");
  console.error(err.message);
  console.error(err.stack);
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Express 5 global error handler — catches errors from async route handlers
app.use((err, req, res, next) => {
  console.error("=== EXPRESS ERROR HANDLER ===");
  console.error("URL  :", req.method, req.url);
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  res.status(500).json({ success: false, message: err.message });
});

app.use("/", userRoutes);
app.use("/", productRoutes);
app.use("/orders", orderRoutes);

// Re-add error handler AFTER routes (Express requires it after routes)
app.use((err, req, res, next) => {
  console.error("=== EXPRESS ERROR HANDLER (post-routes) ===");
  console.error("URL  :", req.method, req.url);
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  if (!res.headersSent) {
    res.status(500).json({ success: false, message: err.message });
  }
});

connectToDB();
connectRedis();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});
