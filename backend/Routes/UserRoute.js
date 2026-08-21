const express = require("express");
const router = express.Router();
const UserAuth = require("../Middleware/authmiddleware");

const { registerUser, loginUser, updateUser, deleteUser,getUserById,getMe,googleLogin, verifyEmail, resendVerification } = require("../Controller/UserController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", UserAuth, getMe);
router.put("/update/:id", updateUser);
router.delete("/deleteuser/:id", deleteUser);
router.get("/user/:id", getUserById);

module.exports = router;