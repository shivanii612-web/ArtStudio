import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bgImage from "../../assets/login-bg.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [step, setStep] = useState("email"); // email -> otp -> reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");

  // Step 1: Send reset OTP email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/forgot-password`, { email });
      if (response.data.success) {
        toast.success(response.data.message || "Reset code sent successfully.");
        setStep("otp");
      } else {
        setError(response.data.message || "Failed to send reset code.");
      }
    } catch (err) {
      console.error("Forgot Password Error:", err);
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify reset OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Verification code is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/verify-reset-otp`, {
        email,
        otp,
      });

      if (response.data.success && response.data.resetToken) {
        toast.success(response.data.message || "Code verified successfully.");
        setResetToken(response.data.resetToken);
        setStep("reset");
      } else {
        setError(response.data.message || "Invalid verification code.");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/reset-password`, {
        email,
        resetToken,
        password,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Password reset successful!");
        setTimeout(() => {
          navigate(`/signin?returnTo=${encodeURIComponent(returnTo)}`);
        }, 1500);
      } else {
        setError(response.data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Reset Password Error:", err);
      setError(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
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

      {/* Forgot Password Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 mr-0 md:mr-6 text-white">
        <h1 className="text-3xl font-bold text-center text-white tracking-tight font-serif mb-2">
          Reset Password
        </h1>

        {step === "email" && (
          <div>
            <p className="text-center text-gray-200 mt-1 mb-6 text-sm">
              Enter your email to receive a password reset code.
            </p>

            <form onSubmit={handleSendOtp} className="text-left">
              <label className="text-white font-semibold text-sm">Email</label>
              <input
                type="email"
                placeholder="Enter registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 mb-3.5 p-2.5 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
                required
              />

              {error && (
                <p className="text-red-400 text-xs mt-1 mb-3 font-semibold text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          </div>
        )}

        {step === "otp" && (
          <div>
            <p className="text-center text-gray-200 mt-1 mb-6 text-sm">
              Enter the verification code sent to <br />
              <strong className="text-orange-400 select-all">{email}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="text-left">
              <label className="text-white font-semibold text-sm">Verification Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full mt-1 mb-3.5 p-2.5 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm text-center font-mono tracking-widest text-lg font-bold"
                required
                maxLength={6}
              />

              {error && (
                <p className="text-red-400 text-xs mt-1 mb-3 font-semibold text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          </div>
        )}

        {step === "reset" && (
          <div>
            <p className="text-center text-gray-200 mt-1 mb-6 text-sm">
              Create a new secure password for your account.
            </p>

            <form onSubmit={handleResetPassword} className="text-left">
              {/* New Password */}
              <label className="text-white font-semibold text-sm">New Password</label>
              <div className="relative mt-1 mb-3.5">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 pr-12 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition"
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>

              {/* Confirm Password */}
              <label className="text-white font-semibold text-sm">Confirm Password</label>
              <div className="relative mt-1 mb-3.5">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 pr-12 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition"
                >
                  {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs mt-1 mb-3 font-semibold text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => navigate(`/signin?returnTo=${encodeURIComponent(returnTo)}`)}
          className="w-full mt-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/10 text-sm"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
