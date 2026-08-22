require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log("Fetching latest SMTP debug logs from MongoDB Atlas...");
  const logs = await mongoose.connection.collection("smtp_debug")
    .find({})
    .sort({ timestamp: -1 })
    .limit(5)
    .toArray();
    
  if (logs.length === 0) {
    console.log("No SMTP debug logs found.");
  } else {
    logs.forEach((log, index) => {
      console.log(`\n--- Log #${index + 1} (${log.timestamp}) ---`);
      console.log(`Context: ${log.context}`);
      console.log(`Email  : ${log.email}`);
      console.log(`Error  : ${log.error}`);
      console.log(`Stack  : ${log.stack}`);
    });
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
