"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { fork } = require("child_process");
const path = require("path");

const UserModel = require("./Model/Usermodel");
const PendingUserModel = require("./Model/PendingUserModel");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const ADMIN_ID = "6a87266c4ea105bd3ae044f4";
const EMAILS_TO_CLEAN = [
  "madhu@gmail.com",
  "shivaniramakrishnan7@gmail.com",
  "test_normal_random@gmail.com",
  "test_admin_hack_random@gmail.com",
  "duplicate_test@gmail.com"
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Connecting to MongoDB to clean and seed...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  // 1. Clean database
  console.log("Cleaning up old test users...");
  await UserModel.deleteMany({ email: { $in: EMAILS_TO_CLEAN } });
  await UserModel.deleteOne({ _id: ADMIN_ID });
  await PendingUserModel.deleteMany({ email: { $in: EMAILS_TO_CLEAN } });

  // 2. Seed initial admin
  console.log("Seeding initial admin user...");
  const hashedAdminPassword = await bcrypt.hash("12345678", 10);
  await UserModel.create({
    _id: ADMIN_ID,
    name: "Madhu Admin",
    email: "madhu@gmail.com",
    password: hashedAdminPassword,
    role: "admin",
    emailVerified: true
  });
  console.log("Seeded admin user madhu@gmail.com successfully.");

  // Also seed a normal user for JWT attempts
  console.log("Seeding normal user...");
  const hashedUserPassword = await bcrypt.hash("userpassword", 10);
  await UserModel.create({
    name: "Normal User",
    email: "duplicate_test@gmail.com",
    password: hashedUserPassword,
    role: "user",
    emailVerified: true
  });
  console.log("Seeded normal user duplicate_test@gmail.com successfully.");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");

  // Server is assumed to be running on PORT
  console.log(`Verifying backend server is responsive at ${BASE_URL}...`);

  const results = [];

  function logTest(num, desc, passed, details = "") {
    console.log(`[TEST ${num}] ${desc}: ${passed ? "PASS" : "FAIL"} ${details ? `(${details})` : ""}`);
    results.push({ num, desc, passed, details });
  }

  let adminToken = "";
  let normalUserToken = "";

  try {
    // --- TEST 1: Normal user registration with no role ---
    try {
      const res = await axios.post(`${BASE_URL}/register`, {
        name: "Normal Test",
        email: "test_normal_random@gmail.com",
        password: "password123"
      });
      
      // Verify in DB that it created a PendingUser with role user
      await mongoose.connect(process.env.MONGODB_URI);
      const pending = await PendingUserModel.findOne({ email: "test_normal_random@gmail.com" });
      const user = await UserModel.findOne({ email: "test_normal_random@gmail.com" });
      await mongoose.disconnect();

      const passed = res.status === 200 && pending && pending.role === "user" && !user;
      logTest(1, "Normal user registration with no role", passed, `Status: ${res.status}`);
    } catch (err) {
      logTest(1, "Normal user registration with no role", false, err.message);
    }

    // --- TEST 2: Normal user registration with role: "admin" ---
    try {
      const res = await axios.post(`${BASE_URL}/register`, {
        name: "Hacker Admin",
        email: "test_admin_hack_random@gmail.com",
        password: "password123",
        role: "admin"
      });

      // Verify in DB that pending user role is user, not admin
      await mongoose.connect(process.env.MONGODB_URI);
      const pending = await PendingUserModel.findOne({ email: "test_admin_hack_random@gmail.com" });
      await mongoose.disconnect();

      const passed = res.status === 200 && pending && pending.role === "user";
      logTest(2, "Normal user registration with role: 'admin' (should block/ignore)", passed, `Pending role: ${pending ? pending.role : 'none'}`);
    } catch (err) {
      logTest(2, "Normal user registration with role: 'admin'", false, err.message);
    }

    // --- TEST 3: Existing admin login (madhu@gmail.com / 12345678) ---
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email: "madhu@gmail.com",
        password: "12345678"
      });
      adminToken = res.data.token;
      const passed = res.status === 200 && res.data.success && res.data.user.role === "admin" && !!adminToken;
      logTest(3, "Existing admin login", passed, `Role: ${res.data.user ? res.data.user.role : 'none'}`);
    } catch (err) {
      logTest(3, "Existing admin login", false, err.message);
    }

    // Get normal user token for Test 6
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email: "duplicate_test@gmail.com",
        password: "userpassword"
      });
      normalUserToken = res.data.token;
    } catch (err) {
      console.error("Failed to login normal user:", err.message);
    }

    // --- TEST 4: Use admin JWT to update admin account details ---
    try {
      const res = await axios.put(`${BASE_URL}/update/${ADMIN_ID}`, {
        name: "Admin User",
        email: "shivaniramakrishnan7@gmail.com",
        role: "admin",
        password: "12345678"
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Verify MongoDB state
      await mongoose.connect(process.env.MONGODB_URI);
      const updatedUser = await UserModel.findById(ADMIN_ID);
      await mongoose.disconnect();

      const isBcrypt = await bcrypt.compare("12345678", updatedUser.password);

      const passed = res.status === 200 &&
                     updatedUser.email === "shivaniramakrishnan7@gmail.com" &&
                     updatedUser.role === "admin" &&
                     updatedUser.emailVerified === true &&
                     isBcrypt;

      logTest(4, "Update admin details using admin JWT", passed, `Email: ${updatedUser.email}, bcrypt password check: ${isBcrypt}`);
    } catch (err) {
      logTest(4, "Update admin details using admin JWT", false, err.message);
    }

    // --- TEST 5: Login after update with new credentials ---
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email: "shivaniramakrishnan7@gmail.com",
        password: "12345678"
      });
      const passed = res.status === 200 && res.data.success && res.data.user.role === "admin";
      logTest(5, "Login after update with new credentials", passed, `Status: ${res.status}`);
    } catch (err) {
      logTest(5, "Login after update with new credentials", false, err.message);
    }

    // --- TEST 6: Normal user JWT attempts PUT /update/:id ---
    try {
      await axios.put(`${BASE_URL}/update/${ADMIN_ID}`, {
        name: "Hacked Admin"
      }, {
        headers: { Authorization: `Bearer ${normalUserToken}` }
      });
      logTest(6, "Normal user JWT update attempt (should return 403)", false, "Allowed update!");
    } catch (err) {
      const passed = err.response && err.response.status === 403;
      logTest(6, "Normal user JWT update attempt (should return 403)", passed, `Status: ${err.response ? err.response.status : 'none'}`);
    }

    // --- TEST 7: No Authorization header PUT /update/:id ---
    try {
      await axios.put(`${BASE_URL}/update/${ADMIN_ID}`, {
        name: "Hacked Admin"
      });
      logTest(7, "No Authorization header (should return 401)", false, "Allowed update!");
    } catch (err) {
      const passed = err.response && err.response.status === 401;
      logTest(7, "No Authorization header (should return 401)", passed, `Status: ${err.response ? err.response.status : 'none'}`);
    }

    // --- TEST 8: Invalid/expired Bearer token PUT /update/:id ---
    try {
      await axios.put(`${BASE_URL}/update/${ADMIN_ID}`, {
        name: "Hacked Admin"
      }, {
        headers: { Authorization: "Bearer invalid_token_123" }
      });
      logTest(8, "Invalid Bearer token (should return 401)", false, "Allowed update!");
    } catch (err) {
      const passed = err.response && err.response.status === 401;
      logTest(8, "Invalid Bearer token (should return 401)", passed, `Status: ${err.response ? err.response.status : 'none'}`);
    }

    // --- TEST 9: Duplicate email update attempt ---
    try {
      const res = await axios.put(`${BASE_URL}/update/${ADMIN_ID}`, {
        email: "duplicate_test@gmail.com"
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest(9, "Duplicate email update (should return 400)", false, "Allowed duplicate email!");
    } catch (err) {
      const passed = err.response && err.response.status === 400 && err.response.data.message === "Email already registered.";
      logTest(9, "Duplicate email update (should return 400)", passed, `Status: ${err.response ? err.response.status : 'none'}, Msg: ${err.response && err.response.data ? err.response.data.message : 'none'}`);
    }

  } finally {

    // Print summary
    const allPassed = results.every(r => r.passed);
    console.log("\n=== TEST RUN SUMMARY ===");
    console.log(allPassed ? "ALL TESTS PASSED!" : "SOME TESTS FAILED.");
    console.log("========================\n");
    process.exit(allPassed ? 0 : 1);
  }
}

run().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
