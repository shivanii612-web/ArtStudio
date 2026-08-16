import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import bgImage from "../../assets/login-bg.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../features/user/userSlice";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const returnTo =
    new URLSearchParams(location.search).get("returnTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/google-login",
        {
          credential: credentialResponse.credential,
        }
      );

      if (response.data.token) {
        // Save login data
        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        // Redux store update
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
          })
        );

        toast.success("Google Login Successful!");

        setTimeout(() => {
          // Admin Login
          if (response.data.user.role === "admin") {
            navigate("/admin/products");
          }
          // Normal User Login
          else {
            navigate(returnTo);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(
        error.response?.data?.message ||
          "Google Login Failed!"
      );
    }
  };

  const handleGoogleLoginFailure = (error) => {
    console.error("Google Login Failed:", error);
    toast.error("Google Login Failed!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3000/login",
        {
          email,
          password,
        }
      );

      if (response.data.token) {
        // Save login data
        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        // Redux store update
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
          })
        );

        toast.success("Login Successful!");

        setTimeout(() => {
          // Admin Login
          if (response.data.user.role === "admin") {
            navigate("/admin/products");
          }

          // Normal User Login
          else {
            navigate(returnTo);
          }
        }, 1000);
      }
    } catch (error) {
      console.log(
        "Login Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Login Failed!"
      );
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-between px-32"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Left Content */}

      <div className="relative z-10 text-white max-w-lg">
        <h1 className="text-6xl font-bold mb-6 drop-shadow-lg">
          ArtStudio
        </h1>

        <p className="text-2xl font-semibold mb-4">
          Find the perfect tools for every masterpiece.
        </p>

        <p className="text-lg text-gray-200 leading-8 mb-8">
          Everything you need to bring your ideas to life with
          premium quality art supplies.
        </p>

        <div className="space-y-4 text-xl">
          <p>🖌 Premium Brushes</p>
          <p>🎨 Professional Colors</p>
          <p>📒 Quality Sketchbooks</p>
          <p>✏ Drawing Essentials</p>
        </div>
      </div>

      {/* Login Form */}

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[400px] bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-8 mr-6"
      >
        <h1 className="text-5xl font-bold text-center text-white">
          Welcome Back
        </h1>

        <p className="text-center text-gray-200 mt-2 mb-8">
          Login to continue your creative journey 🎨
        </p>

        {/* Email */}

        <label className="text-white font-semibold">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-2 mb-5 p-3 rounded-xl bg-white/90 outline-none"
          required
        />

        {/* Password */}

        <label className="text-white font-semibold">
          Password
        </label>

        <div className="relative mt-2">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pr-12 rounded-xl bg-white/90 outline-none"
            required
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
          >
            {showPassword ? (
              <FaEyeSlash size={20} />
            ) : (
              <FaEye size={20} />
            )}
          </button>
        </div>

        {/* Login Button */}

        <button
          type="submit"
          className="w-full mt-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition"
        >
          Sign In
        </button>

        {/* Google */}

        <div className="w-full mt-4 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginFailure}
          />
        </div>

        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300" />

          <span className="px-3 text-white">
            OR
          </span>

          <hr className="flex-1 border-gray-300" />
        </div>

        <p className="text-center text-white">
          New to ArtStudio?
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/signup?returnTo=${encodeURIComponent(returnTo)}`
            )
          }
          className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Create Account
        </button>
      </form>
    </div>
  );
};

export default SignIn;