const express = require("express");
const router = express.Router();
const UserAuth = require("../Middleware/authmiddleware");
const adminAuth = require("../Middleware/adminmiddleware");

const { registerUser, loginUser, updateUser, deleteUser,getUserById,getMe,googleLogin, verifyEmail, resendVerification, forgotPassword, verifyResetOtp, resetPassword } = require("../Controller/UserController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.get("/me", UserAuth, getMe);
router.put("/update/:id", adminAuth, updateUser);
router.delete("/deleteuser/:id", deleteUser);
router.get("/smtp-diagnostics-secure", (req, res) => {
  const emailUser = (process.env.EMAIL_USER || "").trim();
  const rawPass = process.env.EMAIL_PASS || "";
  const sanitizedPass = rawPass.replace(/\s/g, "").replace(/^["']|["']$/g, "");
  res.json({
    emailUser,
    rawLength: rawPass.length,
    sanitizedLength: sanitizedPass.length,
    matchesWorkingPass: sanitizedPass === "jnxrattkkvosnmoy"
  });
});

router.get("/user/:id", getUserById);

module.exports = router;