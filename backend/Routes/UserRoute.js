const express = require("express");
const router = express.Router();
const UserAuth = require("../Middleware/authmiddleware");
const adminAuth = require("../Middleware/adminmiddleware");

const { registerUser, loginUser, updateUser, deleteUser, getUserById, getMe, googleLogin } = require("../Controller/UserController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.get("/me", UserAuth, getMe);
router.put("/update/:id", adminAuth, updateUser);
router.delete("/deleteuser/:id", deleteUser);
router.get("/user/:id", getUserById);

module.exports = router;