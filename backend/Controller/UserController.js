"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const UserModel        = require("../Model/Usermodel");
const bcrypt           = require("bcryptjs");
const jwt              = require("jsonwebtoken");
const { redisClient }  = require("../Config/redis");
const crypto           = require("crypto");

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

    // 2. Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please sign in.",
      });
    }

    // 3. Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error("[Register] bcrypt error:", hashErr.message);
      return res.status(500).json({ success: false, message: "Internal error. Please try again." });
    }

    // 4. Create user in UserModel
    const newUser = await UserModel.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
      emailVerified: true, // Mark verified directly so they can sign in without email verification
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    });

  } catch (err) {
    console.error("[Register] Unexpected error:", err);
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
module.exports = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getUserById,
  getMe,
  googleLogin,
};
