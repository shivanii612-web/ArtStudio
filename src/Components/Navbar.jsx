import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/user/UserSlice";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const { user } = useSelector((state) => state.user);

  const cart = useSelector((state) => state.cart.items) || [];

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const isWishlistPage = location.pathname === "/wishlist";
  const isOrdersPage = location.pathname === "/orders";

  const handleLogout = () => {
    dispatch(logout());

    toast.success("Logout Successful!");

    setTimeout(() => {
      navigate("/signin");
    }, 1000);
  };

  return (
    <nav className="bg-[#2f4357] text-white px-8 py-4 flex justify-between items-center">

      {/* Logo */}
      <h1
        onClick={() => navigate("/")}
        className="text-3xl font-bold text-orange-400 cursor-pointer"
      >
        ArtStudio
      </h1>

      {/* Navigation */}
      <ul className="flex gap-8 text-white font-semibold">

        <li
          onClick={() => navigate("/")}
          className="cursor-pointer transition duration-300 hover:scale-110"
        >
          Home
        </li>

        <li
          onClick={() => navigate("/")}
          className="cursor-pointer transition duration-300 hover:scale-110"
        >
          Product
        </li>

        <li className="cursor-pointer transition duration-300 hover:scale-110">
          About
        </li>

        <li className="cursor-pointer transition duration-300 hover:scale-110">
          Contact
        </li>

      </ul>

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Wishlist */}
        <button
          onClick={() => navigate("/wishlist")}
          className={`group flex items-center justify-center gap-2 
          ${
            isWishlistPage
              ? "bg-[#3d566e]"
              : "bg-[#34495E]"
          }
          hover:bg-[#3d566e] text-white px-4 py-2 rounded-lg 
          font-semibold transition duration-300 hover:scale-105 
          border border-gray-600/35 cursor-pointer`}
        >
          <span>Wishlist</span>

          <span className="relative w-5 h-5 flex items-center justify-center">

            <span
              className={`absolute transition-all duration-300 text-xl ${
                isWishlistPage
                  ? "opacity-0 scale-0"
                  : "opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-0 text-[#FF6B6B]"
              }`}
            >
              ♡
            </span>

            <span
              className={`absolute transition-all duration-300 text-xl ${
                isWishlistPage
                  ? "opacity-100 scale-100 text-red-600"
                  : "opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-125 text-red-600"
              }`}
            >
              ♥
            </span>

          </span>
        </button>

        {/* Cart */}
        <button
          onClick={() => navigate("/cart")}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg 
          font-semibold transition duration-300 hover:scale-105"
        >
          Cart : {cartCount}
        </button>

        {/* Orders */}
        <button
          onClick={() => navigate("/orders")}
          className={`${
            isOrdersPage
              ? "bg-[#3d566e]"
              : "bg-[#34495E]"
          }
          hover:bg-[#3d566e] text-white px-4 py-2 rounded-lg 
          font-semibold transition duration-300 hover:scale-105`}
        >
          Orders
        </button>

        {/* User Dropdown */}
        <div className="relative">

          <button
            onClick={() => setOpen(!open)}
            className="bg-[#34495E] hover:bg-[#3d566e] 
            text-white px-4 py-2 rounded-lg font-semibold 
            transition duration-300"
          >
            👤 {user ? user.name : "User"}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white 
            rounded-lg shadow-xl overflow-hidden z-50">

              {user ? (
                <>
                  <div className="px-4 py-3 border-b">

                    <p className="font-bold text-gray-800">
                      {user.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {user.email}
                    </p>

                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 
                    hover:bg-gray-100 text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate("/signin")}
                  className="w-full text-left px-4 py-3 
                  hover:bg-gray-100 text-gray-700"
                >
                  Sign In
                </button>
              )}

            </div>
          )}

        </div>

      </div>

    </nav>
  );
};

export default Navbar;