"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const nodemailer = require("nodemailer");
const dns = require("dns");

// Read and sanitise credentials — never log the password value
const emailUser = (process.env.EMAIL_USER || "")
  .trim()
  .replace(/^["']|["']$/g, "");

const emailPass = (process.env.EMAIL_PASS || "")
  .replace(/\s/g, "")          // strip spaces (e.g. "xxxx xxxx xxxx xxxx" → "xxxxxxxxxxxxxxxx")
  .replace(/^["']|["']$/g, ""); // strip accidental surrounding quotes

// ── Build the Gmail transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  lookup: (hostname, options, callback) => {
    // Force IPv4 by resolving hostname directly to A (IPv4) records
    // This prevents "ENETUNREACH" IPv6 errors on Render
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return dns.lookup(hostname, options, callback);
      }
      callback(null, addresses[0], 4);
    });
  },
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 10000,
  greetingTimeout:   10000,
  socketTimeout:     15000,
});

// ── Startup verification — runs immediately when server starts ────────────────
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error.message);
    console.error("[SMTP Diagnoses] EMAIL_USER:", (process.env.EMAIL_USER || "").trim());
    const pass = (process.env.EMAIL_PASS || "").replace(/\s/g, "").replace(/^["']|["']$/g, "");
    console.error("[SMTP Diagnoses] EMAIL_PASS length:", pass.length, "(must be 16)");
    if (pass.length === 0) {
      console.error("[SMTP Diagnoses] Error: EMAIL_PASS environment variable is missing!");
    } else if (pass.length !== 16) {
      console.error("[SMTP Diagnoses] Error: EMAIL_PASS is not a 16-character App Password!");
    }
  } else {
    console.log("Email transporter is ready");
  }
});

module.exports = transporter;
