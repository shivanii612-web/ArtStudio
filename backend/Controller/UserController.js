const UserModel = require("../Model/Usermodel");
const PendingUserModel = require("../Model/PendingUserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { redisClient } = require("../Config/redis");
const crypto = require("crypto");
const transporter = require("../Config/nodemailer");

const sendVerificationEmail = async (email, name, otp) => {
  const frontendUrl = (process.env.FRONTEND_URL || "https://artstudio-1pkw9er54-myself-2eae.vercel.app").replace(/\/$/, "");
  const verificationUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}&token=${otp}`;

  const mailOptions = {
    from: `"ArtStudio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to ArtStudio! Please verify your email address",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f97316; text-align: center; font-family: serif;">ArtStudio</h2>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p>Welcome to ArtStudio, ${name}!</p>
        <p>Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 16px; font-weight: bold; color: #333;">Your Verification Code:</p>
          <p style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 5px; margin: 10px 0;">${otp}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button above does not work, copy and paste the following link into your browser:</p>
        <p style="font-size: 12px; color: #666; word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
      </div>
    `,
  };

  console.log(`[Email] Attempting to send OTP to: ${email}`);
  // This will throw if credentials are wrong (EAUTH) or SMTP is unreachable (ECONNECTION)
  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] OTP sent successfully to: ${email} | MessageId: ${info.messageId}`);
};


// REGISTER NEW USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already registered. Please sign in.",
        });
      } else {
        // Remove unverified placeholder in main UserModel
        await UserModel.deleteOne({ _id: existingUser._id });
        await redisClient.del(`user:${existingUser._id}`);
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error("Password hashing failed:", hashErr);
      return res.status(500).json({
        success: false,
        message: "Password hashing failed",
      });
    }

    // Save pending user temporarily
    await PendingUserModel.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "user",
        otp,
        otpExpires,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Send verification email using Nodemailer
    try {
      await sendVerificationEmail(normalizedEmail, name, otp);
    } catch (mailErr) {
      console.error("========================================");
      console.error("[Register] Email sending FAILED");
      console.error("Error code   :", mailErr.code);
      console.error("Error message:", mailErr.message);
      console.error("To           :", normalizedEmail);
      console.error("========================================");
      // On EAUTH the app password is wrong — give a specific message
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

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });

  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// LOGIN EXISTING USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 1. Get user from MongoDB
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") }
    });

    console.log("User: ", user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (user.role !== "admin" && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secret_key",
      { expiresIn: "8h" }
    );

    // Remove password before Redis
    const userData = user.toObject();
    delete userData.password;

    // 2. Store user in Redis
    await redisClient.setEx(
      `user:${user._id}`,
      60 * 5,
      JSON.stringify(userData)
    );

    // 3. Get user from Redis
    const cachedUser = await redisClient.get(
      `user:${user._id}`
    );

    if (cachedUser) {
      console.log("User fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        token,
        user: JSON.parse(cachedUser),
        source: "Redis Cache",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: userData,
      source: "MongoDB",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// UPDATE USER
const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    // 1. Get user from MongoDB
    const user = await UserModel.findById(req.params.id);

    console.log("User: ", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name || user.name;
    
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      // Check if there is another user with this email to avoid duplicate key error
      const existingUser = await UserModel.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") }
      });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        await UserModel.findByIdAndDelete(existingUser._id);
        await redisClient.del(`user:${existingUser._id}`);
      }
      user.email = email;
    }

    user.role = role || user.role;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    // Remove password before Redis
    const userData = updatedUser.toObject();
    delete userData.password;

    // 2. Store updated user in Redis
    await redisClient.setEx(
      `user:${updatedUser._id}`,
      60 * 5,
      JSON.stringify(userData)
    );

    // 3. Get updated user from Redis
    const cachedUser = await redisClient.get(
      `user:${updatedUser._id}`
    );

    if (cachedUser) {
      console.log("Updated user fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        updatedUser: JSON.parse(cachedUser),
        source: "Redis Cache",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      updatedUser: userData,
      source: "MongoDB",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};


// DELETE USER
const deleteUser = async (req, res) => {
  try {
    // 1. Delete user from MongoDB
    const deletedUser = await UserModel.findByIdAndDelete(
      req.params.id
    );

    console.log("User: ", deletedUser);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      "Deleting user with ID: ",
      req.params.id
    );

    // Remove password before Redis
    const userData = deletedUser.toObject();
    delete userData.password;

    // 2. Store deleted user in Redis
    await redisClient.setEx(
      `deletedUser:${deletedUser._id}`,
      60 * 5,
      JSON.stringify(userData)
    );

    // 3. Get deleted user from Redis
    const cachedUser = await redisClient.get(
      `deletedUser:${deletedUser._id}`
    );

    if (cachedUser) {
      console.log("Deleted user fetched from Redis cache");

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
        deletedUser: JSON.parse(cachedUser),
        source: "Redis Cache",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      deletedUser: userData,
      source: "MongoDB",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};


// GET USER BY ID
const getUserById = async (req, res) => {
  try {
    // 1. Get user from MongoDB
    const user = await UserModel.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Store user in Redis
    await redisClient.setEx(
      `user:${user._id}`,
      60 * 5,
      JSON.stringify(user)
    );

    // 3. Get user from Redis
    const cachedUser = await redisClient.get(
      `user:${user._id}`
    );

    if (cachedUser) {
      console.log("User fetched from Redis cache");

      return res.status(200).json({
        success: true,
        user: JSON.parse(cachedUser),
        source: "Redis Cache",
      });
    }

    return res.status(200).json({
      success: true,
      user,
      source: "MongoDB",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// GET ME
const getMe = async (req, res) => {
  try {
    // 1. Get user from MongoDB
    const user = await UserModel.findById(
      req.user.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Store user in Redis
    await redisClient.setEx(
      `user:${user._id}`,
      60 * 5,
      JSON.stringify(user)
    );

    // 3. Get user from Redis
    const cachedUser = await redisClient.get(
      `user:${user._id}`
    );

    if (cachedUser) {
      console.log("User fetched from Redis cache");

      return res.status(200).json({
        success: true,
        user: JSON.parse(cachedUser),
        source: "Redis Cache",
      });
    }

    return res.status(200).json({
      success: true,
      user,
      source: "MongoDB",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// GOOGLE LOGIN
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    // Verify token with Google's tokeninfo API
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!googleRes.ok) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token",
      });
    }

    const payload = await googleRes.json();
    const { email, name, aud } = payload;

    // Optional safety check: check if audience matches client ID
    const expectedClientId = "1020379146945-5froer8b8q3gt2ehrdjp9u8dqvthlgm1.apps.googleusercontent.com";
    if (aud !== expectedClientId) {
       return res.status(400).json({
         success: false,
         message: "Invalid Google token audience",
       });
    }

    // Find or create user in MongoDB
    let user = await UserModel.findOne({ email });

    if (!user) {
      // Create a user with a hashed random password since password is required by model
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role: "user", // Default role
        emailVerified: true,
      });
    }

    // Generate local JWT token
    const token = jwt.sign(
      { id: user._id },
      "secret_key",
      { expiresIn: "8h" }
    );

    // Remove password before storing in Redis cache
    const userData = user.toObject();
    delete userData.password;

    // Cache the user in Redis
    await redisClient.setEx(
      `user:${user._id}`,
      60 * 5,
      JSON.stringify(userData)
    );

    return res.status(200).json({
      success: true,
      message: "Google Login Successful",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Google Login Controller Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// VERIFY EMAIL
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
    const pendingUser = await PendingUserModel.findOne({ email: normalizedEmail });

    if (!pendingUser) {
      // Check if user is already verified and registered in main UserModel
      const alreadyUser = await UserModel.findOne({ email: normalizedEmail });
      if (alreadyUser && alreadyUser.emailVerified) {
        return res.status(200).json({
          success: true,
          message: "Email verified successfully. Account created.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (pendingUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (pendingUser.otpExpires && new Date() > pendingUser.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    // Create the actual user document in MongoDB
    const user = await UserModel.create({
      name: pendingUser.name,
      email: normalizedEmail,
      password: pendingUser.password,
      role: pendingUser.role || "user",
      emailVerified: true,
    });

    // Delete pending temporary data
    await PendingUserModel.deleteOne({ _id: pendingUser._id });

    // Store in Redis
    const userData = user.toObject();
    delete userData.password;
    await redisClient.setEx(
      `user:${user._id}`,
      60 * 5,
      JSON.stringify(userData)
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. Account created.",
    });
  } catch (err) {
    console.error("verifyEmail Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// RESEND VERIFICATION EMAIL
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pendingUser = await PendingUserModel.findOne({ email: normalizedEmail });

    if (!pendingUser) {
      // Check if user is already verified and registered
      const verifiedUser = await UserModel.findOne({ email: normalizedEmail });
      if (verifiedUser && verifiedUser.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already registered. Please sign in.",
        });
      }
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    pendingUser.otp = otp;
    pendingUser.otpExpires = otpExpires;
    pendingUser.createdAt = new Date(); // Reset TTL index
    await pendingUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, pendingUser.name, otp);
    } catch (mailErr) {
      console.error("========================================");
      console.error("[Resend] Email sending FAILED");
      console.error("Error code   :", mailErr.code);
      console.error("Error message:", mailErr.message);
      console.error("To           :", normalizedEmail);
      console.error("========================================");
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

    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully.",
    });
  } catch (err) {
    console.error("resendVerification Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


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