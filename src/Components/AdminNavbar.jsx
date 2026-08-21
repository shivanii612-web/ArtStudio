import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/user/userSlice";
import { clearCart } from "../features/cart/Cartslice";
import { clearWishlist } from "../features/wishlist/Wishlistslice";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const isProducts = location.pathname === "/admin/products";
  const isOrders = location.pathname === "/admin/orders";

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    dispatch(clearWishlist());

    navigate("/signin");
  };

  return (
    <nav className="bg-[#2f4357] text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 border-b-2 border-[#F97316] shadow-sm">

      {/* Admin Logo / Title */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-6 bg-[#F97316] rounded-full"></span>
        <h1 className="text-2xl font-bold tracking-tight">
          Admin Panel
        </h1>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-4 sm:gap-8 items-center justify-center">

        {/* Products */}
        <button
          onClick={() => navigate("/admin/products")}
          className={`font-semibold transition duration-200 hover:text-[#F97316] relative py-1 ${
            isProducts ? "text-[#F97316]" : "text-gray-300"
          }`}
        >
          Products
          {isProducts && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F97316] rounded-full"></span>
          )}
        </button>

        {/* Orders */}
        <button
          onClick={() => navigate("/admin/orders")}
          className={`font-semibold transition duration-200 hover:text-[#F97316] relative py-1 ${
            isOrders ? "text-[#F97316]" : "text-gray-300"
          }`}
        >
          Orders
          {isOrders && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F97316] rounded-full"></span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="bg-[#DC2626] px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition duration-200 shadow-sm"
        >
          Logout
        </button>

      </div>

    </nav>
  );
};

export default AdminNavbar;