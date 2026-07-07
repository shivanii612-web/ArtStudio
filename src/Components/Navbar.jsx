import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ cartCount }) => {
  const navigate = useNavigate();
  return (
    <nav className="bg-stone-800 py-4 shadow-md">
      <div className="flex justify-between items-center px-8">
        <h1 className="text-orange-400 text-3xl font-bold">
          ArtStudio
        </h1>

        <ul className="flex gap-8 text-white font-semibold">
          <li 
            onClick={() => navigate("/")}
            className="cursor-pointer transition duration-300 hover:scale-110">
            Home
          </li>

          <li className="cursor-pointer transition duration-300 hover:scale-110">
            Product
          </li>

          <li className="cursor-pointer transition duration-300 hover:scale-110">
            About
          </li>

          <li className="cursor-pointer transition duration-300 hover:scale-110">
            Contact
          </li>
        </ul>

        <button 
          onClick={() => navigate("/cart")}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold transition duration-300 hover:scale-105">
          Cart : {cartCount || 0}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;