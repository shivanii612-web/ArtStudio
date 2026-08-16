const UserModel = require("../Model/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { redisClient } = require("../Config/redis");


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

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    let hashedPassword;

    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      return res.status(500).json({
        success: false,
        message: "Password hashing failed",
      });
    }

    // 1. Create user in MongoDB
    const newuser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Remove password before storing in Redis
    const userData = newuser.toObject();
    delete userData.password;

    // 2. Store user in Redis
    await redisClient.setEx(
      `user:${newuser._id}`,
      60 * 5,
      JSON.stringify(userData)
    );

    // 3. Get user from Redis
    const cachedUser = await redisClient.get(
      `user:${newuser._id}`
    );

    const token = jwt.sign(
      { id: newuser._id },
      "secret_key",
      { expiresIn: "8h" }
    );

    if (cachedUser) {
      console.log("User fetched from Redis cache");

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: JSON.parse(cachedUser),
        source: "Redis Cache",
      });
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
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
    const user = await UserModel.findOne({ email });

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

    const token = jwt.sign(
      { id: user._id },
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
    const { name, email, role } = req.body;

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
    user.email = email || user.email;
    user.role = role || user.role;

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


module.exports = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getUserById,
  getMe,
  googleLogin,
};