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

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const nodemailer = require("nodemailer");

// Read and sanitise credentials — never log the password value
const emailUser = (process.env.EMAIL_USER || "")
  .trim()
  .replace(/^["']|["']$/g, "");

const emailPass = (process.env.EMAIL_PASS || "")
  .replace(/\s/g, "")          // strip spaces (e.g. "xxxx xxxx xxxx xxxx" → "xxxxxxxxxxxxxxxx")
  .replace(/^["']|["']$/g, ""); // strip accidental surrounding quotes

// ── Build the Gmail transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Port 465 is secure
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
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error.message);
  } else {
    console.log("Email transporter is ready");
  }
});

module.exports = transporter;
