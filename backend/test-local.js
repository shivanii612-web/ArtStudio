"use strict";

const http = require("http");

function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(buf) });
          } catch {
            resolve({ status: res.statusCode, body: buf });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: { message: e.message } }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== LOCAL BACKEND INTEGRATION TESTS ===");
  const testEmail = `local_test_${Date.now()}@example.com`;
  console.log("Using test email:", testEmail);

  // 1. Sign up user
  console.log("\n--- TEST 1: User Signup ---");
  const r1 = await post("/register", {
    name: "Local Test User",
    email: testEmail,
    password: "Password123!",
  });
  console.log("Status  :", r1.status);
  console.log("Response:", JSON.stringify(r1.body));
  if (r1.status !== 200 || !r1.body.success) {
    console.error("Signup failed!");
    process.exit(1);
  }

  // Retrieve OTP from DB
  const mongoose = require("mongoose");
  require("dotenv").config();
  await mongoose.connect(process.env.MONGODB_URI);
  const PendingUserModel = require("./Model/PendingUserModel");
  const pending = await PendingUserModel.findOne({ email: testEmail });
  if (!pending) {
    console.error("Pending user not found in database!");
    await mongoose.disconnect();
    process.exit(1);
  }
  const dbOtp = pending.otp;
  console.log("Retrieved OTP from database:", dbOtp);

  // 2. Verify with WRONG OTP
  console.log("\n--- TEST 2: Verify with Wrong OTP ---");
  const r2 = await post("/verify-email", {
    email: testEmail,
    otp: "000000",
  });
  console.log("Status  :", r2.status);
  console.log("Response:", JSON.stringify(r2.body));
  if (r2.status !== 400 || r2.body.success) {
    console.error("Wrong OTP should fail but passed!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // 3. Resend OTP
  console.log("\n--- TEST 3: Resend OTP ---");
  const r3 = await post("/resend-verification", {
    email: testEmail,
  });
  console.log("Status  :", r3.status);
  console.log("Response:", JSON.stringify(r3.body));
  if (r3.status !== 200 || !r3.body.success) {
    console.error("Resend OTP failed!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Retrieve the new OTP from DB
  const pending2 = await PendingUserModel.findOne({ email: testEmail });
  const newOtp = pending2.otp;
  console.log("Retrieved NEW OTP from database:", newOtp);

  // 4. Verify with CORRECT NEW OTP
  console.log("\n--- TEST 4: Verify with Correct OTP ---");
  const r4 = await post("/verify-email", {
    email: testEmail,
    otp: newOtp,
  });
  console.log("Status  :", r4.status);
  console.log("Response:", JSON.stringify(r4.body));
  if (r4.status !== 200 || !r4.body.success) {
    console.error("Email verification failed with correct OTP!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // 5. Verify that signup again with same email says already registered
  console.log("\n--- TEST 5: Signup with Already Registered Email ---");
  const r5 = await post("/register", {
    name: "Local Test User",
    email: testEmail,
    password: "Password123!",
  });
  console.log("Status  :", r5.status);
  console.log("Response:", JSON.stringify(r5.body));
  if (r5.status !== 400 || r5.body.success) {
    console.error("Signup with existing email should fail but passed!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // 6. Verify login with newly verified user
  console.log("\n--- TEST 6: User Login ---");
  const r6 = await post("/login", {
    email: testEmail,
    password: "Password123!",
  });
  console.log("Status  :", r6.status);
  console.log("Response:", JSON.stringify(r6.body));
  if (r6.status !== 200 || !r6.body.success) {
    console.error("Login failed!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Cleanup user from DB
  const UserModel = require("./Model/Usermodel");
  await UserModel.deleteOne({ email: testEmail });
  console.log("\nCleaned up test user from database.");

  await mongoose.disconnect();
  console.log("\n=== ALL LOCAL TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
