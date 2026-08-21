require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const P = require("./Model/PendingUserModel");
  const items = await P.find({}).sort({ createdAt: -1 }).limit(3);
  items.forEach(i => console.log("pending:", i.email, "| otp:", i.otp, "| expires:", i.otpExpires));
  if (items.length === 0) console.log("No pending users found");
  await mongoose.disconnect();
  process.exit(0);
});
