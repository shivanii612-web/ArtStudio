"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Resend } = require("resend");

// Read Resend API Key from environment
const resendApiKey = (process.env.RESEND_API_KEY || "")
  .trim()
  .replace(/^["']|["']$/g, "");

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Safe diagnostics
if (!resendApiKey) {
  console.warn("[Resend Diagnoses] Warning: RESEND_API_KEY environment variable is missing!");
} else {
  console.log(`[Resend Diagnoses] RESEND_API_KEY exists (length: ${resendApiKey.length})`);
}

// Mimic the Nodemailer transporter interface
const transporter = {
  sendMail: async (mailOptions) => {
    if (!resend) {
      throw new Error("Resend API key is not configured. Please set RESEND_API_KEY in environment variables.");
    }

    // Convert mailOptions to Resend payload
    const payload = {
      from: "ArtStudio <onboarding@resend.dev>",
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
    };

    console.log(`[Resend] Attempting to send email to: ${payload.to}`);

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error("[Resend] Error response from Resend API:", error);
      throw new Error(error.message || "Failed to send email via Resend API.");
    }

    console.log(`[Resend] Email sent successfully. ID: ${data.id}`);
    return { messageId: data.id };
  },

  // Mock verify method for tests
  verify: (callback) => {
    if (resend) {
      if (typeof callback === "function") {
        callback(null, true);
      }
    } else {
      const err = new Error("Resend API key is not configured.");
      err.code = "EMISSINGKEY";
      if (typeof callback === "function") {
        callback(err, null);
      }
    }
  }
};

// Expected startup log
console.log("Email transporter is ready");

module.exports = transporter;
