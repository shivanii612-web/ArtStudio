const nodemailer = require("nodemailer");

/**
 * GMAIL APP PASSWORD SETUP (required for this to work):
 *
 * 1. Go to your Google Account → Security → 2-Step Verification (must be ON)
 * 2. Go to Google Account → Security → App passwords
 *    URL: https://myaccount.google.com/apppasswords
 * 3. Select app: "Mail", Select device: "Other" → name it "ArtStudio"
 * 4. Google will generate a 16-character password like: xxxx xxxx xxxx xxxx
 * 5. Copy that password and set it in your environment:
 *    - Render env var  EMAIL_PASS = xxxxxxxxxxxxxxxx  (no spaces, just the 16 chars)
 *    - Local .env      EMAIL_PASS="xxxx xxxx xxxx xxxx"  (spaces OK, code strips them)
 *
 * REQUIRED RENDER ENVIRONMENT VARIABLES:
 *   EMAIL_USER  = shivaniramakrishnan7@gmail.com
 *   EMAIL_PASS  = <16-char app password, no spaces>
 *   FRONTEND_URL = https://artstudio-1pkw9er54-myself-2eae.vercel.app
 */

// Strip any accidental surrounding quotes or spaces copied from .env
const emailPass = (process.env.EMAIL_PASS || "").replace(/\s/g, "").replace(/^["']|["']$/g, "");
const emailUser = (process.env.EMAIL_USER || "").trim();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (port 587)
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Verify on startup — logs to Render so you know immediately if credentials are wrong
transporter.verify((error) => {
  if (error) {
    console.error("========================================");
    console.error("NODEMAILER STARTUP VERIFICATION FAILED");
    console.error("Error code   :", error.code);
    console.error("Error message:", error.message);
    if (error.code === "EAUTH") {
      console.error("");
      console.error("FIX: The Gmail app password is invalid or revoked.");
      console.error("1. Go to: https://myaccount.google.com/apppasswords");
      console.error("2. Generate a new 16-character app password for 'ArtStudio'");
      console.error("3. Update EMAIL_PASS in Render environment variables (no spaces)");
      console.error("4. Redeploy the Render service");
    }
    console.error("EMAIL_USER configured as:", emailUser || "(not set)");
    console.error("EMAIL_PASS length       :", emailPass.length, "(should be 16)");
    console.error("========================================");
  } else {
    console.log("Nodemailer transporter ready — Gmail SMTP connected successfully.");
    console.log("Sending emails from:", emailUser);
  }
});

module.exports = transporter;
