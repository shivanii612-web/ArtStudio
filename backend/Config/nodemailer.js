const nodemailer = require("nodemailer");

// Gmail App Password must be set WITHOUT spaces in the Render environment variable.
// Example: if the app password shown by Google is "rocl dvfn itbt emaj",
// set EMAIL_PASS on Render as: rocldfvnitbtemaj  (no spaces)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    // Strip any accidental spaces that may have been copied into the env var
    pass: (process.env.EMAIL_PASS || "").replace(/\s/g, ""),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter configuration on startup so misconfiguration is caught early
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer transporter verification FAILED:", error.message);
    console.error(
      "Check that EMAIL_USER and EMAIL_PASS are set correctly in Render environment variables."
    );
    console.error(
      "Gmail App Password must be entered WITHOUT spaces (16 characters, no spaces)."
    );
  } else {
    console.log("Nodemailer transporter is ready to send emails.");
  }
});

module.exports = transporter;
