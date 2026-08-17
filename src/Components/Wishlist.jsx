import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { addtoCart } from "../features/cart/Cartslice";
import { removeFromWishlist } from "../features/wishlist/Wishlistslice";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";

const Wishlist = () => {
  const wishlist = useSelector((state) => state.wishlist.items) || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow px-8 py-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-800">
          Your Wishlist ({wishlist.length} {wishlist.length === 1 ? "Product" : "Products"})
        </h1>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl shadow-md max-w-lg mx-auto mt-8">
            <span className="text-6xl mb-4">❤️</span>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-center mb-6">
              Add items that you like to your wishlist so you can buy them later!
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 shadow-md hover:shadow-lg"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {wishlist.map((item) => (
              <div
                key={item._id}
                className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center gap-4 cursor-pointer hover:shadow-xl hover:scale-102 transition duration-300 relative border border-gray-100"
              >
                <div className="h-[210px] w-full flex items-center justify-center overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="flex flex-col items-center gap-1 text-center w-full">
                  <h2 className="font-semibold text-slate-800 text-base line-clamp-1">{item.title}</h2>
                  <p className="text-orange-500 font-bold text-lg">{item.price}</p>
                </div>

                <div className="flex flex-col gap-2 w-full mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(addtoCart(item));
                      dispatch(removeFromWishlist(item._id));
                    }}
                    className="w-full bg-amber-400 text-slate-900 py-2.5 rounded-lg font-semibold hover:bg-amber-300 transition-colors duration-300 text-sm flex items-center justify-center gap-2 hover:shadow-md active:scale-98"
                  >
                    Move to Cart
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(removeFromWishlist(item._id));
                    }}
                    className="w-full bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-lg font-semibold transition-colors duration-300 text-sm flex items-center justify-center gap-2 border border-gray-200/60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
