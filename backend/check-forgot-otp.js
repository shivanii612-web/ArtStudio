require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const UserModel = require("./Model/Usermodel");
  
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node check-forgot-otp.js <email>");
    process.exit(1);
  }
  
  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    console.log(`User ${email} not found.`);
    process.exit(1);
  }
  
  if (!user.resetPasswordOtp) {
    console.log(`No resetPasswordOtp found for user ${email}.`);
    process.exit(0);
  }
  
  console.log("Found resetPasswordOtp hash:", user.resetPasswordOtp);
  console.log("Brute-forcing 6-digit OTP...");
  
  const startTime = Date.now();
  let foundOtp = null;
  for (let i = 100000; i <= 999999; i++) {
    const otpStr = i.toString();
    const hash = crypto.createHash("sha256").update(otpStr).digest("hex");
    if (hash === user.resetPasswordOtp) {
      foundOtp = otpStr;
      break;
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  if (foundOtp) {
    console.log(`\nSUCCESS! Decoded OTP is: ${foundOtp} (found in ${duration}s)`);
  } else {
    console.log(`\nFAILED to decode OTP. Checked all 6-digit values in ${duration}s.`);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
