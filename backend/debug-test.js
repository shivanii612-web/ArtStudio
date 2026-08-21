// Temporary debug script — identifies the actual crash points
// Run: node debug-test.js
"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("\n=== ENVIRONMENT CHECK ===");
console.log("MONGODB_URI set    :", !!process.env.MONGODB_URI);
console.log("REDIS_URL set      :", !!process.env.REDIS_URL);
console.log("EMAIL_USER set     :", !!process.env.EMAIL_USER);
console.log("EMAIL_PASS set     :", !!process.env.EMAIL_PASS);
const rawPass = (process.env.EMAIL_PASS || "").replace(/\s/g, "").replace(/^["']|["']$/g, "");
console.log("EMAIL_PASS length  :", rawPass.length, "(must be 16)");

async function runTests() {

  // --- TEST 1: MongoDB + Product model ---
  console.log("\n=== TEST 1: MONGODB + PRODUCT MODEL ===");
  try {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB: connected to", mongoose.connection.name);

    const Product = require("./Model/Productmodel");
    const count = await Product.countDocuments();
    console.log("Product.countDocuments():", count);

    if (count > 0) {
      const sample = await Product.findOne().lean();
      console.log("Sample product title:", sample.title);
    } else {
      console.log("WARNING: Product collection is EMPTY — no products to return");
    }

    await mongoose.disconnect();
    console.log("MongoDB: disconnected cleanly");
  } catch (err) {
    console.error("MONGODB ERROR:", err.message);
    console.error("Stack:", err.stack);
  }

  // --- TEST 2: Redis ---
  console.log("\n=== TEST 2: REDIS ===");
  try {
    const { createClient } = require("redis");
    const client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (e) => console.error("Redis client error:", e.message));
    await client.connect();
    console.log("Redis: connected");
    await client.set("debug-test-key", "ok", { EX: 10 });
    const val = await client.get("debug-test-key");
    console.log("Redis set/get test:", val === "ok" ? "PASS" : "FAIL — got: " + val);
    await client.del("debug-test-key");
    await client.disconnect();
    console.log("Redis: disconnected cleanly");
  } catch (err) {
    console.error("REDIS ERROR:", err.message);
    console.error("Stack:", err.stack);
  }

  // --- TEST 3: PendingUserModel upsert ---
  console.log("\n=== TEST 3: PENDING USER MODEL ===");
  try {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGODB_URI);
    const PendingUserModel = require("./Model/PendingUserModel");
    const crypto = require("crypto");
    const bcrypt = require("bcryptjs");

    const testEmail = "debug-test-" + Date.now() + "@example.com";
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    const hashedPw = await bcrypt.hash("TestPass123!", 10);

    const result = await PendingUserModel.findOneAndUpdate(
      { email: testEmail },
      { $set: { name: "Debug User", email: testEmail, password: hashedPw, role: "user", otp, otpExpires } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("PendingUserModel upsert: OK, id=", result._id.toString());

    await PendingUserModel.deleteOne({ email: testEmail });
    console.log("PendingUserModel cleanup: OK");

    await mongoose.disconnect();
  } catch (err) {
    console.error("PENDING USER MODEL ERROR:", err.message);
    console.error("Stack:", err.stack);
  }

  // --- TEST 4: Nodemailer transporter ---
  console.log("\n=== TEST 4: NODEMAILER TRANSPORTER ===");
  try {
    const transporter = require("./Config/nodemailer");
    console.log("Transporter loaded: OK");
    await new Promise((resolve) => {
      transporter.verify((err) => {
        if (err) {
          console.error("Transporter.verify FAILED:", err.code, "|", err.message);
        } else {
          console.log("Transporter.verify: PASS — Gmail SMTP is ready");
        }
        resolve();
      });
    });
  } catch (err) {
    console.error("NODEMAILER LOAD ERROR:", err.message);
  }

  console.log("\n=== DEBUG COMPLETE ===\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Unhandled error in debug-test.js:", err);
  process.exit(1);
});
