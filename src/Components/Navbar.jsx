import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/user/userSlice";
import { toast } from "react-toastify";
import { logoutCart } from "../features/cart/Cartslice";
import { logoutWishlist } from "../features/wishlist/Wishlistslice";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const { user } = useSelector((state) => state.user);

  const [searchParams] = useSearchParams();
  const searchParamQuery = searchParams.get("search") || "";

  const [query, setQuery] = useState(searchParamQuery);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Sync search input with URL search param
  useEffect(() => {
    setQuery(searchParamQuery);
  }, [searchParamQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setQuery(val);

    if (!val.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");
      const res = await axios.get(`${BACKEND_URL}/products/search?query=${encodeURIComponent(val.trim())}`);
      if (res.data.success) {
        setResults(res.data.data || []);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setShowDropdown(false);
      if (query.trim()) {
        navigate(`/?search=${encodeURIComponent(query.trim())}`);
      } else {
        navigate("/");
      }
    }
  };

  const handleResultClick = (prod) => {
    setShowDropdown(false);
    navigate(`/?search=${encodeURIComponent(prod.title)}`);
  };

  const cart = useSelector((state) => state.cart.items) || [];

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const isWishlistPage = location.pathname === "/wishlist";
  const isOrdersPage = location.pathname === "/orders";

  const handleLogout = () => {
    dispatch(logout());
    dispatch(logoutCart());
    dispatch(logoutWishlist());

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

      {/* Product Search Area */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim()) {
                setShowDropdown(true);
              }
            }}
            className="w-full bg-[#1F2C39] text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-400 placeholder-gray-400 text-sm font-semibold transition duration-300"
          />
          <span className="absolute left-3 top-2 text-gray-400">🔍</span>
        </div>

        {showDropdown && (
          <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map((prod) => (
                  <div
                    key={prod._id}
                    onClick={() => handleResultClick(prod)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition duration-150"
                  >
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-10 h-10 object-contain rounded"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {prod.title}
                      </p>
                      <p className="text-xs text-gray-500">₹{prod.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Wishlist */}
        <button
          onClick={() => {
            const hasToken = localStorage.getItem("token") || user;
            if (!hasToken) {
              toast.warn("Please sign in to view your wishlist.");
              navigate("/signin?returnTo=/wishlist");
            } else {
              navigate("/wishlist");
            }
          }}
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
          onClick={() => {
            const hasToken = localStorage.getItem("token") || user;
            if (!hasToken) {
              toast.warn("Please sign in to view your cart.");
              navigate("/signin?returnTo=/cart");
            } else {
              navigate("/cart");
            }
          }}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg 
          font-semibold transition duration-300 hover:scale-105"
        >
          Cart : {cartCount}
        </button>

        {/* Orders */}
        <button
          onClick={() => {
            const hasToken = localStorage.getItem("token") || user;
            if (!hasToken) {
              toast.warn("Please sign in to view your orders.");
              navigate("/signin?returnTo=/orders");
            } else {
              navigate("/orders");
            }
          }}
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

          {user ? (
            <>
              <button
                onClick={() => setOpen(!open)}
                className="bg-[#34495E] hover:bg-[#3d566e] 
                text-white px-4 py-2 rounded-lg font-semibold 
                transition duration-300"
              >
                👤 {user.name}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white 
                rounded-lg shadow-xl overflow-hidden z-50">

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
                    Sign Out
                  </button>

                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              className="bg-[#34495E] hover:bg-[#3d566e] 
              text-white px-4 py-2 rounded-lg font-semibold 
              transition duration-300"
            >
              Sign In
            </button>
          )}

        </div>

      </div>

    </nav>
  );
};

export default Navbar;