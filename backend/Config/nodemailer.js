"use strict";

/**
 * nodemailer.js — ArtStudio email transporter (Gmail SMTP)
 *
 * REQUIRED environment variables (backend/.env):
 *   EMAIL_USER = shivaniramakrishnan7@gmail.com
 *   EMAIL_PASS = <16-character Gmail App Password, no spaces>
 *
 * HOW TO GET A GMAIL APP PASSWORD:
 *   1. Sign in to https://myaccount.google.com/security
 *   2. Make sure "2-Step Verification" is ON
 *   3. Go to https://myaccount.google.com/apppasswords
 *   4. Click "Select app" → Other → type "ArtStudio" → Generate
 *   5. Google shows a 16-char password like: xxxx xxxx xxxx xxxx
 *   6. Copy it and set in backend/.env:
 *        EMAIL_PASS=xxxxxxxxxxxxxxxx   (paste the 16 chars, no spaces, no quotes)
 *   7. Restart the backend — you should see:
 *        [Nodemailer] Email transporter is ready.
 *
 * IMPORTANT: Do NOT use your normal Gmail password — it will NOT work.
 *            Only a Gmail App Password works here.
 */

require("dotenv").config();
const nodemailer = require("nodemailer");

// Read and sanitise credentials — never log the password value
const emailUser = (process.env.EMAIL_USER || "")
  .trim()
  .replace(/^["']|["']$/g, "");

const emailPass = (process.env.EMAIL_PASS || "")
  .replace(/\s/g, "")          // strip spaces (e.g. "xxxx xxxx xxxx xxxx" → "xxxxxxxxxxxxxxxx")
  .replace(/^["']|["']$/g, ""); // strip accidental surrounding quotes

// ── Startup credential check ──────────────────────────────────────────────────
console.log("[Nodemailer] EMAIL_USER :", emailUser || "(NOT SET — check backend/.env)");
console.log("[Nodemailer] EMAIL_PASS : length=" + emailPass.length + " (must be 16 for Gmail App Password)");

if (!emailUser) {
  console.error("[Nodemailer] ERROR: EMAIL_USER is not set in backend/.env");
}
if (emailPass.length === 0) {
  console.error("[Nodemailer] ERROR: EMAIL_PASS is not set in backend/.env");
} else if (emailPass.length !== 16) {
  console.error(
    "[Nodemailer] ERROR: EMAIL_PASS length is " + emailPass.length +
    " but a Gmail App Password must be exactly 16 characters."
  );
  console.error("[Nodemailer]        Make sure you are using a Gmail App Password, NOT your normal Gmail password.");
  console.error("[Nodemailer]        Generate one at: https://myaccount.google.com/apppasswords");
}

// ── Build the Gmail transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS on port 587
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout:   10000,
  socketTimeout:     15000,
});

// ── Startup verification — runs immediately when server starts ────────────────
// Logs whether Gmail SMTP authentication succeeds or fails.
// NEVER logs the password.
transporter.verify(function (error) {
  if (error) {
    console.error("[Nodemailer] Email transporter verification FAILED.");
    console.error("[Nodemailer]   Error code   :", error.code);
    console.error("[Nodemailer]   Error message:", error.message);

    if (error.code === "EAUTH") {
      console.error("[Nodemailer]   ──────────────────────────────────────────────────────");
      console.error("[Nodemailer]   CAUSE : Gmail rejected the App Password (EAUTH).");
      console.error("[Nodemailer]   FIX   : The current EMAIL_PASS is invalid or has been revoked.");
      console.error("[Nodemailer]           1. Go to https://myaccount.google.com/apppasswords");
      console.error("[Nodemailer]           2. Delete the old ArtStudio entry if it exists");
      console.error("[Nodemailer]           3. Create a NEW App Password for ArtStudio");
      console.error("[Nodemailer]           4. Copy the 16 chars and update EMAIL_PASS in backend/.env");
      console.error("[Nodemailer]           5. Restart the backend");
      console.error("[Nodemailer]   ──────────────────────────────────────────────────────");
    }

    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error("[Nodemailer]   CAUSE : Cannot reach smtp.gmail.com:587");
      console.error("[Nodemailer]           Port 587 may be blocked by a firewall or VPN.");
      console.error("[Nodemailer]           This works on Render (no firewall). Try disabling VPN locally.");
    }
  } else {
    console.log("[Nodemailer] Email transporter is ready.");
    console.log("[Nodemailer] Sending emails from:", emailUser);
  }
});

module.exports = transporter;
