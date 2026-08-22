import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import bgImage from "../../assets/login-bg.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../features/user/userSlice";
import { setUserCart } from "../../features/cart/Cartslice";
import { setUserWishlist } from "../../features/wishlist/Wishlistslice";
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
      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");
      const response = await axios.post(
        `${BACKEND_URL}/google-login`,
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
        dispatch(setUserCart(response.data.user._id));
        dispatch(setUserWishlist(response.data.user._id));

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
      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");
      const response = await axios.post(
        `${BACKEND_URL}/login`,
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
        dispatch(setUserCart(response.data.user._id));
        dispatch(setUserWishlist(response.data.user._id));

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
      className="relative min-h-screen bg-cover bg-center flex flex-col md:flex-row items-center justify-center md:justify-between px-6 md:px-16 lg:px-32 py-10 md:py-0"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Left Content */}

      <div className="relative z-10 text-white max-w-xl pr-8 md:block hidden">
        <h1 className="text-6xl font-bold mb-4 tracking-tight drop-shadow-lg font-serif">
          ArtStudio
        </h1>
        <p className="text-2xl font-light text-gray-200 mb-12">
          Find the perfect tools for every masterpiece.
        </p>

        <div className="border-l-2 border-orange-500 pl-6 my-8">
          <p className="text-2xl italic font-serif leading-relaxed text-gray-100">
            “Art is not what you see, but what you make others see.”
          </p>
          <p className="text-sm tracking-widest text-orange-400 uppercase mt-4 font-semibold">
            Create. Explore. Express.
          </p>
        </div>
      </div>

      {/* Login Form */}

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[400px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 mr-0 md:mr-6"
      >
        <h1 className="text-3xl font-bold text-center text-white tracking-tight font-serif">
          Welcome Back
        </h1>

        <p className="text-center text-gray-200 mt-1 mb-4 text-sm">
          Login to continue your creative journey 🎨
        </p>

        {/* Email */}

        <label className="text-white font-semibold text-sm">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 mb-3.5 p-2.5 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
          required
        />

        {/* Password */}

        <div className="flex justify-between items-center mt-1.5 mb-1 px-0.5">
          <label className="text-white font-semibold text-sm">
            Password
          </label>
        </div>

        <div className="relative mt-1 mb-3.5">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 pr-12 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
            required
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition"
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
          className="w-full mt-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm"
        >
          Sign In
        </button>

        {/* Google */}

        <div className="w-full mt-2.5 flex justify-center text-sm">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginFailure}
          />
        </div>

        <div className="flex items-center my-3.5">
          <hr className="flex-1 border-gray-300" />

          <span className="px-3 text-white text-xs">
            OR
          </span>

          <hr className="flex-1 border-gray-300" />
        </div>

        <p className="text-center text-white text-sm">
          New to ArtStudio?
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/signup?returnTo=${encodeURIComponent(returnTo)}`
            )
          }
          className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-lg hover:shadow-blue-600/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm"
        >
          Create Account
        </button>
      </form>
    </div>
  );
};

export default SignIn;