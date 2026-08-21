"use strict";

const UserModel       = require("../Model/Usermodel");
const PendingUserModel = require("../Model/PendingUserModel");
const bcrypt          = require("bcryptjs");
const jwt             = require("jsonwebtoken");
const { redisClient } = require("../Config/redis");
const crypto          = require("crypto");
const nodemailer      = require("nodemailer");
const { getTransporter } = require("../Config/nodemailer");

// ---------------------------------------------------------------------------
// Helper — send the OTP verification email
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
    subject: "Welcome to ArtStudio — verify your email address",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;
                  border:1px solid #eee;border-radius:10px;">
        <h2 style="color:#f97316;text-align:center;font-family:serif;">ArtStudio</h2>
        <hr style="border:0;border-top:1px solid #eee;"/>
        <p>Welcome to ArtStudio, ${name}!</p>
        <p>Please verify your email address to activate your account.</p>
        <div style="text-align:center;margin:20px 0;">
          <p style="font-size:16px;font-weight:bold;color:#333;">Your Verification Code:</p>
          <p style="font-size:32px;font-weight:bold;color:#f97316;
                    letter-spacing:5px;margin:10px 0;">${otp}</p>
        </div>
        <div style="text-align:center;margin:30px 0;">
          <a href="${verificationUrl}"
             style="background-color:#f97316;color:white;padding:12px 24px;
                    text-decoration:none;border-radius:8px;font-weight:bold;
                    display:inline-block;">Verify Email</a>
        </div>
        <p style="font-size:12px;color:#666;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="font-size:12px;color:#666;word-break:break-all;">
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
      </div>
    `,
  };

  console.log(`[Email] Sending OTP to: ${email}`);

  const transporter = await getTransporter();
  const info = await transporter.sendMail(mailOptions);

  console.log(`[Email] OTP sent. MessageId: ${info.messageId}`);

  // When using the Ethereal fallback print the preview URL so you can inspect the email
  if (transporter._isEthereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("=========================================================");
    console.log("[Ethereal] OTP EMAIL PREVIEW URL:");
    console.log(" ", previewUrl);
    console.log(" Open this URL in your browser to see the OTP email.");
    console.log("=========================================================");
  }
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
          role: role || "user",
          otp,
          otpExpires,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 6. Send OTP email — if this fails we return 500 (no success response, no navigation)
    try {
      await sendVerificationEmail(normalizedEmail, name, otp);
    } catch (mailErr) {
      console.error("===========================================");
      console.error("[Register] EMAIL SEND FAILED");
      console.error("  Code   :", mailErr.code || "N/A");
      console.error("  Message:", mailErr.message);
      console.error("  To     :", normalizedEmail);
      console.error("===========================================");

      // Roll back: remove the pending record so the same email can retry cleanly
      await PendingUserModel.deleteOne({ email: normalizedEmail }).catch(() => {});

      if (mailErr.code === "EAUTH") {
        return res.status(500).json({
          success: false,
          message:
            "Email service authentication failed. Please contact support.",
        });
      }
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

    // Create the real user — emailVerified: true
    const user = await UserModel.create({
      name:          pending.name,
      email:         normalizedEmail,
      password:      pending.password,
      role:          pending.role || "user",
      emailVerified: true,
    });

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
    } catch (mailErr) {
      console.error("===========================================");
      console.error("[Resend] EMAIL SEND FAILED");
      console.error("  Code   :", mailErr.code || "N/A");
      console.error("  Message:", mailErr.message);
      console.error("  To     :", normalizedEmail);
      console.error("===========================================");

      if (mailErr.code === "EAUTH") {
        return res.status(500).json({
          success: false,
          message: "Email service authentication failed. Please contact support.",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
    }

    return res.status(200).json({ success: true, message: "New verification code sent." });
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

    if (name)     user.name = name;
    if (role)     user.role = role;
    if (email)    user.email = email.trim().toLowerCase();
    if (password) user.password = await bcrypt.hash(password, 10);

    const updated  = await user.save();
    const userData = updated.toObject();
    delete userData.password;

    await redisClient.setEx(`user:${updated._id}`, 300, JSON.stringify(userData));

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

    let user = await UserModel.findOne({ email });
    if (!user) {
      const hashedPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-12),
        10
      );
      user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
        emailVerified: true,
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
};
