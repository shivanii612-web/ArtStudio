/**
 * nodemailer.js — ArtStudio email transporter
 *
 * LOCAL DEVELOPMENT (NODE_ENV !== "production"):
 *   If EMAIL_PASS is missing/invalid (EAUTH), the module falls back to an
 *   Ethereal test account automatically.  OTPs are printed to the console
 *   and a preview URL is shown — no real email is sent, but the full
 *   registration → verify flow works end-to-end.
 *
 * PRODUCTION (Render):
 *   Set these environment variables in the Render dashboard:
 *     EMAIL_USER  = shivaniramakrishnan7@gmail.com
 *     EMAIL_PASS  = <16-char Gmail App Password, no spaces>
 *     FRONTEND_URL = https://artstudio-1pkw9er54-myself-2eae.vercel.app
 *
 *   Gmail App Password setup:
 *     1. Sign in to https://myaccount.google.com/security
 *     2. Confirm 2-Step Verification is ON
 *     3. Go to https://myaccount.google.com/apppasswords
 *     4. App = "Mail", Device = "Other" → name it "ArtStudio"
 *     5. Copy the 16-char password and paste into Render env var EMAIL_PASS
 */

"use strict";

require("dotenv").config();
const nodemailer = require("nodemailer");

const isProduction = process.env.NODE_ENV === "production";

// Strip spaces/quotes that may have been accidentally included
const rawPass = process.env.EMAIL_PASS || "";
const emailPass = rawPass.replace(/\s/g, "").replace(/^["']|["']$/g, "");
const emailUser = (process.env.EMAIL_USER || "").trim().replace(/^["']|["']$/g, "");

// Startup validation — logs existence of credentials but NEVER prints the password value
console.log("[Nodemailer] EMAIL_USER configured :", emailUser || "(NOT SET — check backend/.env)");
console.log("[Nodemailer] EMAIL_PASS length      :", emailPass.length, "(must be 16 for Gmail App Password)");

/**
 * Build a real Gmail SMTP transporter.
 */
function buildGmailTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,       // STARTTLS on port 587
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
  });
}

/**
 * Create and return a verified transporter.
 * In development, falls back to an Ethereal test account if Gmail fails.
 * In production, an EAUTH error is thrown immediately so the 500 response
 * reaches the client and is clearly logged.
 */
async function createTransporter() {
  // Always try Gmail first
  if (emailUser && emailPass.length === 16) {
    const gmail = buildGmailTransporter();
    try {
      await gmail.verify();
      console.log("[Nodemailer] Gmail SMTP verified successfully — ready to send.");
      return gmail;
    } catch (err) {
      if (isProduction) {
        // In production surface the real error so it fails loudly
        console.error("[Nodemailer] Gmail SMTP verification FAILED in production!");
        console.error("  Error code   :", err.code);
        console.error("  Error message:", err.message);
        if (err.code === "EAUTH") {
          console.error("  FIX → generate a new App Password at https://myaccount.google.com/apppasswords");
          console.error("        and update EMAIL_PASS in Render environment variables (no spaces, 16 chars).");
        }
        // Return the broken transporter — sendMail will throw EAUTH which
        // registerUser/resendVerification will catch and return 500 to the client.
        return gmail;
      }

      // In development: fall back to Ethereal so the full flow can be tested locally
      console.warn("[Nodemailer] Gmail auth failed in development. Falling back to Ethereal test account.");
      console.warn("  Gmail error:", err.code, "—", err.message);
      if (err.code === "EAUTH") {
        console.warn("  The Gmail app password is invalid/revoked.");
        console.warn("  → To fix for real email: generate a new app password at https://myaccount.google.com/apppasswords");
        console.warn("  → For now, OTPs will be printed to the console (Ethereal preview).");
      }
      return createEtherealTransporter();
    }
  }

  // Credentials incomplete
  if (isProduction) {
    console.error("[Nodemailer] EMAIL_USER or EMAIL_PASS missing/invalid in production — email will fail!");
    return buildGmailTransporter(); // returns broken transporter that will throw on sendMail
  }

  console.warn("[Nodemailer] EMAIL_USER or EMAIL_PASS not properly set. Using Ethereal for local testing.");
  return createEtherealTransporter();
}

/**
 * Creates a fresh Ethereal test account transporter.
 * OTP emails are captured at https://ethereal.email — no real email is sent.
 */
async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  console.log("[Nodemailer][Ethereal] Test account created:", testAccount.user);
  console.log("[Nodemailer][Ethereal] Preview emails at  : https://ethereal.email");
  console.log("[Nodemailer][Ethereal] Login with         :", testAccount.user, "/ (password hidden)");

  const t = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  t._isEthereal = true; // marker so sendVerificationEmail can print the preview URL
  return t;
}

// Singleton promise — resolved once at startup
let _transporterPromise = null;

function getTransporter() {
  if (!_transporterPromise) {
    _transporterPromise = createTransporter().catch((err) => {
      console.error("[Nodemailer] Failed to initialise transporter:", err.message);
      _transporterPromise = null; // allow retry next request
      throw err;
    });
  }
  return _transporterPromise;
}

module.exports = { getTransporter };
