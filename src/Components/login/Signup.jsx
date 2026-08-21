import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import bgImage from "../../assets/login-bg.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useDispatch } from "react-redux";

import { loginSuccess } from "../../features/user/userSlice";
import { toast } from "react-toastify";


const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const returnTo = new URLSearchParams(location.search).get("returnTo") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");
      const response = await axios.post(
        `${BACKEND_URL}/register`,
        {
          name,
          email,
          password,
        }
      );

      sessionStorage.setItem("signupEmail", email);
      toast.success(response.data.message || "Verification code sent to your email.");

      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`, {
          state: { email }
        });
      }, 1500);

    } catch (error) {

      console.log(
        "Registration Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
        "Registration Failed!"
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



      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[400px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 mr-0 md:mr-6"
      >
        <h1 className="text-3xl font-bold text-center text-white tracking-tight font-serif">
          Create Your Account
        </h1>

        <p className="text-center text-gray-200 mt-1 mb-4 text-sm">
          Start your creative journey with ArtStudio 🎨
        </p>


        <label className="text-white font-semibold text-sm">
          Name
        </label>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="w-full mt-1 mb-3.5 p-2.5 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
          required
        />



        <label className="text-white font-semibold text-sm">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full mt-1 mb-3.5 p-2.5 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
          required
        />



        <label className="text-white font-semibold text-sm">
          Password
        </label>


        <div className="relative mt-1 mb-3.5">

          <input
            type={showPassword ? "text":"password"}
            placeholder="Create Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full p-2.5 pr-12 rounded-xl bg-white/90 focus:bg-white border border-transparent focus:border-orange-400 outline-none text-slate-800 transition duration-300 shadow-sm text-sm"
            required
          />


          <button
            type="button"
            onClick={()=>setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
          >

            {
              showPassword ?
              <FaEyeSlash size={20}/>
              :
              <FaEye size={20}/>
            }

          </button>

        </div>



        <button
          type="submit"
          className="w-full mt-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-lg hover:shadow-orange-500/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm"
        >
          Create Account
        </button>

        <button
          type="button"
          className="w-full mt-2.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold transition shadow-lg hover:shadow-gray-200 transform hover:-translate-y-[1px] transition-all duration-300 text-sm"
        >
          Sign Up with Google
        </button>



        <div className="flex items-center my-3.5">

          <hr className="flex-1 border-gray-300"/>

          <span className="px-3 text-white text-xs">
            OR
          </span>

          <hr className="flex-1 border-gray-300"/>

        </div>



        <p className="text-center text-white text-sm">
          Already have an account?
        </p>


        <button
          type="button"
          onClick={()=>navigate("/signin")}
          className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-lg hover:shadow-blue-600/20 transform hover:-translate-y-[1px] transition-all duration-300 text-sm"
        >
          Sign In
        </button>


      </form>


    </div>
  );
};

export default SignUp;