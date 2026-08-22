"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const UserModel        = require("../Model/Usermodel");
const PendingUserModel = require("../Model/PendingUserModel");
const bcrypt           = require("bcryptjs");
const jwt              = require("jsonwebtoken");
const { redisClient }  = require("../Config/redis");
const crypto           = require("crypto");
const transporter      = require("../Config/nodemailer");

// ---------------------------------------------------------------------------
// Helper — send the OTP verification email
// Throws on any Nodemailer / SMTP error — callers must catch and return 500.
// ---------------------------------------------------------------------------
const sendVerificationEmail = async (email, name, otp) => {
  const frontendUrl = (
    process.env.FRONTEND_URL ||
    "https://artstudio-1pkw9er54-myself-2eae.vercel.app"
  ).replace(/\/$/, "");

  const verificationUrl =
    `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}&token=${otp}`;

  const mailOptions = {
    from: `"ArtStudio" <${(process.env.EMAIL_USER || "").trim()}>`,
    to: email,
    subject: "ArtStudio — your email verification code",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;
                  border:1px solid #eee;border-radius:10px;">
        <h2 style="color:#f97316;text-align:center;font-family:serif;">ArtStudio</h2>
        <hr style="border:0;border-top:1px solid #eee;"/>
        <p>Hi ${name},</p>
        <p>Please verify your email address to activate your ArtStudio account.</p>
        <div style="text-align:center;margin:24px 0;">
          <p style="font-size:15px;font-weight:bold;color:#333;margin-bottom:8px;">
            Your 6-digit verification code:
          </p>
          <p style="font-size:36px;font-weight:bold;color:#f97316;
                    letter-spacing:8px;margin:0;">${otp}</p>
          <p style="font-size:12px;color:#888;margin-top:8px;">
            This code expires in 15 minutes.
          </p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${verificationUrl}"
             style="background-color:#f97316;color:#fff;padding:12px 28px;
                    text-decoration:none;border-radius:8px;font-weight:bold;
                    display:inline-block;">Verify Email</a>
        </div>
        <p style="font-size:12px;color:#666;">
          Or paste this link in your browser:
        </p>
        <p style="font-size:12px;color:#666;word-break:break-all;">
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
      </div>
    `,
  };

  console.log(`[Email] Attempting to send verification email to: ${email}`);

  // sendMail() will throw if Gmail rejects the message (EAUTH, ECONNECTION, etc.)
  // The caller must NOT swallow this error.
  const info = await transporter.sendMail(mailOptions);

  console.log(`[Email] Verification email sent successfully. MessageId: ${info.messageId}`);
};

// ---------------------------------------------------------------------------
// REGISTER  POST /register
// ---------------------------------------------------------------------------
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if a fully verified account already exists
    const existingVerified = await UserModel.findOne({ email: normalizedEmail });
    if (existingVerified && existingVerified.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please sign in.",
      });
    }

    // 3. Generate OTP
    const otp        = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 4. Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error("[Register] bcrypt error:", hashErr.message);
      return res.status(500).json({ success: false, message: "Internal error. Please try again." });
    }

    // 5. Upsert pending registration record (no real user created yet)
    await PendingUserModel.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: "user",
          otp,
          otpExpires,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 6. Send OTP email — if this fails we return 500 (no success response, no navigation)
    try {
      await sendVerificationEmail(normalizedEmail, name, otp);
    } catch (error) {
      console.error("Verification email sending failed:", error.message);

      // Log error to MongoDB Atlas for remote diagnostics
      try {
        const mongoose = require("mongoose");
        await mongoose.connection.collection("smtp_debug").insertOne({
          context: "registerUser",
          timestamp: new Date(),
          error: error.message,
          stack: error.stack,
          email: normalizedEmail
        });
      } catch (dbErr) {
        console.error("Failed to log SMTP error to DB:", dbErr.message);
      }

      // Roll back: remove the pending record so the same email can retry cleanly
      await PendingUserModel.deleteOne({ email: normalizedEmail }).catch(() => {});

      return res.status(500).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
    }

    // 7. Only now return success — frontend will navigate to /verify-email
    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });

  } catch (err) {
    console.error("[Register] Unexpected error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// VERIFY EMAIL  POST /verify-email
// ---------------------------------------------------------------------------
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for already-verified account (idempotent)
    const alreadyVerified = await UserModel.findOne({ email: normalizedEmail, emailVerified: true });
    if (alreadyVerified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified. You can sign in.",
      });
    }

    const pending = await PendingUserModel.findOne({ email: normalizedEmail });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No pending verification found for this email. Please sign up again.",
      });
    }

    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code." });
    }

    if (new Date() > pending.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    // Check if user already exists in UserModel (unverified)
    let user = await UserModel.findOne({ email: normalizedEmail });

    if (user) {
      user.name = pending.name;
      user.password = pending.password;
      user.role = pending.role || "user";
      user.emailVerified = true;
      await user.save();
    } else {
      user = await UserModel.create({
        name:          pending.name,
        email:         normalizedEmail,
        password:      pending.password,
        role:          pending.role || "user",
        emailVerified: true,
      });
    }

    // Remove pending record
    await PendingUserModel.deleteOne({ _id: pending._id });

    // Cache in Redis
    const userData = user.toObject();
    delete userData.password;
    await redisClient.setEx(`user:${user._id}`, 300, JSON.stringify(userData));

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("[verifyEmail] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// RESEND VERIFICATION  POST /resend-verification
// ---------------------------------------------------------------------------
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Already verified?
    const verified = await UserModel.findOne({ email: normalizedEmail, emailVerified: true });
    if (verified) {
      return res.status(400).json({
        success: false,
        message: "This email is already verified. Please sign in.",
      });
    }

    const pending = await PendingUserModel.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "No pending registration found. Please sign up first.",
      });
    }

    // Generate fresh OTP
    const otp        = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    pending.otp        = otp;
    pending.otpExpires = otpExpires;
    await pending.save();

    try {
      await sendVerificationEmail(normalizedEmail, pending.name, otp);
    } catch (error) {
      console.error("Verification email sending failed:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
    }

    return res.status(200).json({ success: true, message: "New OTP sent successfully." });
  } catch (err) {
    console.error("[resendVerification] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// LOGIN  POST /login
// ---------------------------------------------------------------------------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid password." });
    }

    if (user.role !== "admin" && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "8h" }
    );

    const userData = user.toObject();
    delete userData.password;

    await redisClient.setEx(`user:${user._id}`, 300, JSON.stringify(userData));

    const cachedUser = await redisClient.get(`user:${user._id}`);
    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: cachedUser ? JSON.parse(cachedUser) : userData,
    });
  } catch (err) {
    console.error("[loginUser] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// UPDATE USER  PUT /update/:id
// ---------------------------------------------------------------------------
const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name) user.name = name;
    if (role) user.role = role;

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await UserModel.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: "Email already registered." });
      }
      user.email = normalizedEmail;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Keep emailVerified true
    user.emailVerified = true;

    const updated  = await user.save();
    const userData = updated.toObject();
    delete userData.password;

    // Clear/invalidate Redis cache for that user
    await redisClient.del(`user:${updated._id}`);

    return res.status(200).json({ success: true, message: "User updated.", updatedUser: userData });
  } catch (err) {
    console.error("[updateUser] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to update user." });
  }
};

// ---------------------------------------------------------------------------
// DELETE USER  DELETE /deleteuser/:id
// ---------------------------------------------------------------------------
const deleteUser = async (req, res) => {
  try {
    const deleted = await UserModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await redisClient.del(`user:${deleted._id}`);

    const userData = deleted.toObject();
    delete userData.password;

    return res.status(200).json({ success: true, message: "User deleted.", deletedUser: userData });
  } catch (err) {
    console.error("[deleteUser] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete user." });
  }
};

// ---------------------------------------------------------------------------
// GET USER BY ID  GET /user/:id
// ---------------------------------------------------------------------------
const getUserById = async (req, res) => {
  try {
    const cached = await redisClient.get(`user:${req.params.id}`);
    if (cached) {
      return res.status(200).json({ success: true, user: JSON.parse(cached), source: "Redis" });
    }

    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await redisClient.setEx(`user:${user._id}`, 300, JSON.stringify(user));
    return res.status(200).json({ success: true, user, source: "MongoDB" });
  } catch (err) {
    console.error("[getUserById] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// GET ME  GET /me
// ---------------------------------------------------------------------------
const getMe = async (req, res) => {
  try {
    const cached = await redisClient.get(`user:${req.user.id}`);
    if (cached) {
      return res.status(200).json({ success: true, user: JSON.parse(cached), source: "Redis" });
    }

    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await redisClient.setEx(`user:${user._id}`, 300, JSON.stringify(user));
    return res.status(200).json({ success: true, user, source: "MongoDB" });
  } catch (err) {
    console.error("[getMe] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// GOOGLE LOGIN  POST /google-login
// ---------------------------------------------------------------------------
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required." });
    }

    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    if (!googleRes.ok) {
      return res.status(400).json({ success: false, message: "Invalid Google token." });
    }

    const payload = await googleRes.json();
    const { email, name, aud } = payload;

    const expectedClientId =
      "1020379146945-5froer8b8q3gt2ehrdjp9u8dqvthlgm1.apps.googleusercontent.com";
    if (aud !== expectedClientId) {
      return res.status(400).json({ success: false, message: "Invalid Google token audience." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("[GoogleLogin] Normalizing and looking up email:", normalizedEmail);

    let user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await UserModel.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
        emailVerified: true,
      });
      console.log("[GoogleLogin] Created new Google account for:", normalizedEmail);
    } else {
      console.log("[GoogleLogin] Reusing existing account. Role:", user.role);
      // Ensure existing user gets verified flag updated if not already set
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
        console.log("[GoogleLogin] Marked existing account as emailVerified.");
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "8h" }
    );

    const userData = user.toObject();
    delete userData.password;
    await redisClient.setEx(`user:${user._id}`, 300, JSON.stringify(userData));

    return res.status(200).json({
      success: true,
      message: "Google Login Successful.",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("[googleLogin] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// Helper — send the Password Reset Email
// ---------------------------------------------------------------------------
const sendPasswordResetEmail = async (email, name, otp) => {
  const mailOptions = {
    from: `"ArtStudio" <${(process.env.EMAIL_USER || "").trim()}>`,
    to: email,
    subject: "ArtStudio — your password reset code",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;
                  border:1px solid #eee;border-radius:10px;">
        <h2 style="color:#f97316;text-align:center;font-family:serif;">ArtStudio</h2>
        <hr style="border:0;border-top:1px solid #eee;"/>
        <p>Hi ${name},</p>
        <p>You requested a password reset for your ArtStudio account. Use the verification code below to reset your password:</p>
        <div style="text-align:center;margin:24px 0;">
          <p style="font-size:15px;font-weight:bold;color:#333;margin-bottom:8px;">
            Your 6-digit verification code:
          </p>
          <p style="font-size:36px;font-weight:bold;color:#f97316;
                    letter-spacing:8px;margin:0;">${otp}</p>
          <p style="font-size:12px;color:#888;margin-top:8px;">
            This code expires in 10 minutes.
          </p>
        </div>
        <p style="font-size:12px;color:#666;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  console.log(`[Email] Attempting to send password reset email to: ${email}`);
  await transporter.sendMail(mailOptions);
  console.log(`[Email] Password reset email sent successfully.`);
};

// ---------------------------------------------------------------------------
// FORGOT PASSWORD  POST /forgot-password
// ---------------------------------------------------------------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    // Safe message to prevent account enumeration
    const safeMessage = "If this email is registered, a password reset code has been sent.";

    if (!user) {
      return res.status(200).json({ success: true, message: safeMessage });
    }

    // Generate random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash OTP using SHA-256
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Save to user model
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpires = otpExpires;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(normalizedEmail, user.name, otp);
    } catch (mailErr) {
      console.error("[ForgotPassword] Email send error:", mailErr.message);

      // Log error to MongoDB Atlas for remote diagnostics
      try {
        const mongoose = require("mongoose");
        await mongoose.connection.collection("smtp_debug").insertOne({
          context: "forgotPassword",
          timestamp: new Date(),
          error: mailErr.message,
          stack: mailErr.stack,
          email: normalizedEmail
        });
      } catch (dbErr) {
        console.error("Failed to log SMTP error to DB:", dbErr.message);
      }

      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: "Email service authentication failed. Please contact support." });
    }

    return res.status(200).json({ success: true, message: safeMessage });
  } catch (err) {
    console.error("[forgotPassword] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// VERIFY RESET OTP  POST /verify-reset-otp
// ---------------------------------------------------------------------------
const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and verification code are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    // Verify OTP using SHA-256
    const hashedIncoming = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (user.resetPasswordOtp !== hashedIncoming) {
      return res.status(400).json({ success: false, message: "Invalid verification code." });
    }

    // OTP is valid. Invalidate the OTP and generate a short-lived reset password token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordTokenExpires = resetTokenExpires;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Verification code verified successfully.",
      resetToken,
    });
  } catch (err) {
    console.error("[verifyResetOtp] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
// RESET PASSWORD  POST /reset-password
// ---------------------------------------------------------------------------
const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ success: false, message: "Reset token and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    // Identify user strictly by the resetToken
    const hashedIncomingToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await UserModel.findOne({
      resetPasswordToken: hashedIncomingToken,
    });

    if (!user || !user.resetPasswordTokenExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset session. Please request a new OTP." });
    }

    if (new Date() > user.resetPasswordTokenExpires) {
      return res.status(400).json({ success: false, message: "Reset session has expired. Please request a new OTP." });
    }

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    // Clear user cached data in Redis to force refresh on login
    await redisClient.del(`user:${user._id}`);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("[resetPassword] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ---------------------------------------------------------------------------
module.exports = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getUserById,
  getMe,
  googleLogin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
