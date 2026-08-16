import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../../assets/login-bg.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useDispatch } from "react-redux";

import { loginSuccess } from "../../features/user/userSlice";
import { toast } from "react-toastify";


const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3000/register",
        {
          name,
          email,
          password,
        }
      );

      if (response.data.token) {

        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
          })
        );

        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );
      }

      toast.success("Account Created Successfully!");

      setTimeout(() => {
        navigate("/");
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
      className="relative min-h-screen bg-cover bg-center flex items-center justify-between px-32"
      style={{ backgroundImage: `url(${bgImage})` }}
    >

      <div className="absolute inset-0 bg-black/40"></div>


      <div className="relative z-10 text-white max-w-lg">

        <h1 className="text-6xl font-bold mb-6">
          ArtStudio
        </h1>

        <p className="text-2xl font-semibold mb-4">
          Start your creative journey today.
        </p>

        <p className="text-lg text-gray-200 leading-8 mb-8">
          Create your account and explore premium quality art
          supplies designed for every artist.
        </p>

        <div className="space-y-4 text-xl">
          <p>🖌 Premium Brushes</p>
          <p>🎨 Professional Colors</p>
          <p>📒 Quality Sketchbooks</p>
          <p>✏ Drawing Essentials</p>
        </div>

      </div>



      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[400px] bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-8 mr-6"
      >

        <h1 className="text-5xl font-bold text-center text-white">
          Create Account
        </h1>


        <p className="text-center text-gray-200 mt-2 mb-8">
          Join ArtStudio 🎨
        </p>


        <label className="text-white font-semibold">
          Name
        </label>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="w-full mt-2 mb-5 p-3 rounded-xl bg-white/90 outline-none"
          required
        />



        <label className="text-white font-semibold">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full mt-2 mb-5 p-3 rounded-xl bg-white/90 outline-none"
          required
        />



        <label className="text-white font-semibold">
          Password
        </label>


        <div className="relative mt-2 mb-5">

          <input
            type={showPassword ? "text":"password"}
            placeholder="Create Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full p-3 pr-12 rounded-xl bg-white/90 outline-none"
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
          className="w-full mt-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          Create Account
        </button>



        <button
          type="button"
          className="w-full mt-4 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold"
        >
          Sign Up with Google
        </button>



        <div className="flex items-center my-6">

          <hr className="flex-1 border-gray-300"/>

          <span className="px-3 text-white">
            OR
          </span>

          <hr className="flex-1 border-gray-300"/>

        </div>



        <p className="text-center text-white">
          Already have an account?
        </p>


        <button
          type="button"
          onClick={()=>navigate("/signin")}
          className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Sign In
        </button>


      </form>


    </div>
  );
};

export default SignUp;