// Test controllers directly to expose the real 500 cause
"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function main() {
  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");

  const { createClient } = require("redis");
  const redisRaw = createClient({ url: process.env.REDIS_URL });
  redisRaw.on("error", () => {});
  await redisRaw.connect();
  console.log("Redis connected");

  // ── TEST getAllProducts ──────────────────────────────────────────────────────
  console.log("\n=== TESTING getAllProducts ===");
  try {
    const Product = require("./Model/Productmodel");
    const { redisClient } = require("./Config/redis");

    // Simulate exactly what the controller does
    const cachedProducts = await redisClient.get("products");
    console.log("Redis cache 'products':", cachedProducts ? "HIT (len=" + cachedProducts.length + ")" : "MISS");

    if (cachedProducts) {
      const parsed = JSON.parse(cachedProducts);
      console.log("Parsed from cache:", Array.isArray(parsed) ? parsed.length + " items" : typeof parsed);
    }

    const products = await Product.find();
    console.log("Product.find() count:", products.length);

    const jsonStr = JSON.stringify(products);
    console.log("JSON.stringify works:", jsonStr.length, "chars");
    await redisClient.setEx("products", 300, jsonStr);
    console.log("redisClient.setEx: OK");

    console.log("getAllProducts simulation: ALL STEPS PASSED");
  } catch (err) {
    console.error("getAllProducts FAILED AT STEP:", err.message);
    console.error(err.stack);
  }

  // ── TEST register flow ───────────────────────────────────────────────────────
  console.log("\n=== TESTING register flow ===");
  try {
    const UserModel = require("./Model/Usermodel");
    const PendingUserModel = require("./Model/PendingUserModel");
    const bcrypt = require("bcryptjs");
    const crypto = require("crypto");

    const testEmail = "controller-test-" + Date.now() + "@example.com";
    const normalizedEmail = testEmail.trim().toLowerCase();

    // Step 1: check existing
    const existing = await UserModel.findOne({ email: normalizedEmail });
    console.log("UserModel.findOne:", existing ? "found" : "null (expected)");

    // Step 2: OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    console.log("OTP generated:", otp.length === 6 ? "OK" : "FAIL");

    // Step 3: hash
    const hashedPw = await bcrypt.hash("TestPass123!", 10);
    console.log("bcrypt.hash: OK, length=" + hashedPw.length);

    // Step 4: upsert pending
    const pending = await PendingUserModel.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { name: "Test", email: normalizedEmail, password: hashedPw, role: "user", otp, otpExpires } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("PendingUserModel upsert: OK, id=" + pending._id);

    // Step 5: sendMail
    console.log("Testing sendMail...");
    const transporter = require("./Config/nodemailer");
    const emailUser = (process.env.EMAIL_USER || "").trim().replace(/^["']|["']$/g, "");
    const info = await transporter.sendMail({
      from: `"ArtStudio Test" <${emailUser}>`,
      to: emailUser, // send to self for test
      subject: "ArtStudio Debug Test",
      text: "OTP: " + otp,
    });
    console.log("sendMail: OK, MessageId=" + info.messageId);

    // Cleanup
    await PendingUserModel.deleteOne({ email: normalizedEmail });
    console.log("register flow simulation: ALL STEPS PASSED");
  } catch (err) {
    console.error("register FAILED AT STEP:", err.message);
    console.error("Error code:", err.code || "none");
    console.error(err.stack);
  }

  await mongoose.disconnect();
  await redisRaw.disconnect();
  console.log("\n=== CONTROLLER DEBUG COMPLETE ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  console.error(err.stack);
  process.exit(1);
});
