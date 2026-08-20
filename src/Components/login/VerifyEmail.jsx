import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import bgImage from "../../assets/login-bg.png";
import axios from "axios";
import { toast } from "react-toastify";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const location = useLocation();
  const emailFromState = location.state?.email;
  const emailFromQuery = searchParams.get("email");
  const emailFromSession = sessionStorage.getItem("signupEmail");
  const email = emailFromState || emailFromQuery || emailFromSession;

  const initialToken = searchParams.get("token") || "";

  const [otp, setOtp] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");

  useEffect(() => {
    if (!email) {
      toast.error("No pending verification session found. Please sign up first.");
      navigate("/signup");
    }
  }, [email, navigate]);

  // Pre-fill from URL token if it updates
  useEffect(() => {
    if (initialToken) {
      setOtp(initialToken);
    }
  }, [initialToken]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${BACKEND_URL}/verify-email`, {
        email,
        otp,
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success("Email Verified Successfully!");
        // Clear session email after verification succeeds
        sessionStorage.removeItem("signupEmail");
      } else {
        setError(response.data.message || "Invalid verification code.");
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError(err.response?.data?.message || "Verification failed!");
      toast.error(err.response?.data?.message || "Verification failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const response = await axios.post(`${BACKEND_URL}/resend-verification`, {
        email,
      });
      toast.success(response.data.message || "Verification email sent!");
    } catch (err) {
      console.error("Resend Error:", err);
      toast.error(err.response?.data?.message || "Failed to resend verification email!");
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null; // Prevents render before redirecting
  }

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

      {/* Verification Card */}
      <div className="relative z-10 w-[400px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 mr-0 md:mr-6 text-center text-white">
        <h1 className="text-3xl font-bold text-center text-white tracking-tight font-serif mb-4">
          Email Verification
        </h1>

        {success ? (
          <div className="my-6">
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <p className="text-gray-200 mb-6 text-sm">
              Email verified successfully!
            </p>
            <button
              onClick={() => navigate("/signin")}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div>
            <p className="text-center text-gray-200 mt-1 mb-6 text-sm">
              Please enter the verification code sent to <br />
              <strong className="text-orange-400 select-all">{email}</strong>
            </p>

            <form onSubmit={handleVerify} className="text-left">
              <label className="text-white font-semibold text-sm">
                Verification Code
              </label>
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

            {/* Resend Section */}
            <div className="mt-6 border-t border-white/15 pt-6 text-left">
              <p className="text-xs text-gray-300 text-center mb-3">
                Didn't receive the email?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-lg hover:shadow-blue-600/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend Verification Code"}
              </button>
            </div>

            <button
              onClick={() => navigate("/signin")}
              className="w-full mt-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/10 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
