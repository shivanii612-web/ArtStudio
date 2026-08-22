import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/user/userSlice";
import { toast } from "react-toastify";
import { logoutCart } from "../features/cart/Cartslice";
import { logoutWishlist } from "../features/wishlist/Wishlistslice";
import axios from "axios";
import { FaHome } from "react-icons/fa";

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
  const isHomePage = location.pathname === "/";

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
    <nav className="sticky top-0 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800/60 text-white px-4 sm:px-8 py-3.5 flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0 z-50 shadow-md shadow-black/10">

      {/* Logo */}
      <h1
        onClick={() => navigate("/")}
        className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-amber-200 hover:opacity-90 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      >
        ArtStudio
      </h1>

      {/* Product Search Area */}
      <div ref={searchRef} className="relative flex-1 w-full max-w-md mx-0 lg:mx-8">
        <div className="relative group">
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
            className="w-full bg-slate-800/40 backdrop-blur-sm text-white pl-10 pr-4 py-2 rounded-xl border border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/40 focus:outline-none focus:bg-slate-800/60 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 placeholder-slate-400/60 text-sm font-medium tracking-wide transition duration-300 shadow-inner"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 group-hover:text-slate-300 transition duration-300 pointer-events-none">🔍</span>
        </div>

        {showDropdown && (
          <div className="absolute left-0 mt-2 w-full bg-slate-900 rounded-xl shadow-xl overflow-hidden z-50 border border-slate-800">
            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map((prod) => (
                  <div
                    key={prod._id}
                    onClick={() => handleResultClick(prod)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800/60 last:border-b-0 transition duration-150"
                  >
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {prod.title}
                      </p>
                      <p className="text-xs text-orange-400">₹{prod.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-3 w-full lg:w-auto">

        {/* Home Icon Only (Visible only on internal pages) */}
        {!isHomePage && (
          <button
            onClick={() => navigate("/")}
            className="group flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border border-orange-400/20 text-white transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-sm shadow-black/10 shrink-0"
            title="Home"
          >
            <FaHome className="text-lg sm:text-xl group-hover:scale-110 transition duration-300" />
          </button>
        )}

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
          className={`group flex items-center justify-center gap-1 sm:gap-2.5 
          ${
            isWishlistPage
              ? "bg-[#1e293b] border-orange-500/35 text-orange-400"
              : "bg-[#1e293b]/40 border-slate-800/70 text-slate-300"
          }
          hover:bg-[#1e293b] hover:text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border
          text-xs sm:text-base font-semibold transition-all duration-300 hover:scale-[1.02] 
          cursor-pointer shadow-sm shadow-black/10`}
        >
          <span>Wishlist</span>

          <span className="relative w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">

            <span
              className={`absolute transition-all duration-300 text-sm sm:text-xl ${
                isWishlistPage
                  ? "opacity-0 scale-0"
                  : "opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-0 text-[#FF6B6B]"
              }`}
            >
              ♡
            </span>

            <span
              className={`absolute transition-all duration-300 text-sm sm:text-xl ${
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
          className="bg-gradient-to-r from-orange-500 to-orange-600 
          hover:from-orange-400 hover:to-orange-500 
          text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold 
          transition-all duration-300 hover:scale-[1.02] 
          shadow-lg shadow-orange-500/10 border border-orange-400/20 cursor-pointer"
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
          className={`flex items-center justify-center gap-1 sm:gap-2
          ${
            isOrdersPage
              ? "bg-[#1e293b] border-orange-500/35 text-orange-400"
              : "bg-[#1e293b]/40 border-slate-800/70 text-slate-300"
          }
          hover:bg-[#1e293b] hover:text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border
          text-xs sm:text-base font-semibold transition-all duration-300 hover:scale-[1.02]
          cursor-pointer shadow-sm shadow-black/10`}
        >
          Orders
        </button>

        {/* User Dropdown */}
        <div className="relative">

          {user ? (
            <>
              <button
                onClick={() => setOpen(!open)}
                className="bg-[#1e293b]/50 hover:bg-[#1e293b] border border-slate-800/70
                text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold 
                transition duration-300 shadow-sm hover:scale-[1.02] cursor-pointer flex items-center gap-1 max-w-[100px] sm:max-w-none"
              >
                <span className="truncate">👤 {user.name}</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 
                rounded-xl shadow-xl overflow-hidden z-50 border border-slate-850">

                  <div className="px-4 py-3 border-b border-slate-800">

                    <p className="font-bold text-slate-200">
                      {user.name}
                    </p>

                    <p className="text-sm text-slate-400">
                      {user.email}
                    </p>

                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 
                    hover:bg-slate-800 text-red-400 transition duration-150"
                  >
                    Sign Out
                  </button>

                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              className="bg-gradient-to-r from-orange-500 to-orange-600 
              hover:from-orange-400 hover:to-orange-500 
              text-white px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold 
              shadow-lg shadow-orange-500/40 hover:shadow-orange-500/20 
              transition-all duration-300 hover:scale-[1.02] cursor-pointer"
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