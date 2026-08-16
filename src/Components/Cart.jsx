import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  removeItem,
  increaseQuantity,
  decreaseQuantity,
  clearItem,
} from "../features/cart/Cartslice";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";
import { toast } from "react-toastify";

const Cart = () => {
  const cart = useSelector((state) => state.cart.items) || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const getPrice = (price) => {
    return Number(String(price).replace("₹", ""));
  };

  const subtotal = cart.reduce(
    (total, item) =>
      total + getPrice(item.price) * item.quantity,
    0
  );

  const shipping = cart.length > 0 ? 50 : 0;
  const total = subtotal + shipping;

  const handleIncrease = async (item) => {
    try {
      const response = await axios.post(`http://localhost:3000/products/reserve/${item._id}`, { quantity: 1 });
      if (response.data.success) {
        dispatch(increaseQuantity(item._id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to increase quantity");
    }
  };

  const handleDecrease = async (item) => {
    try {
      const response = await axios.post(`http://localhost:3000/products/release/${item._id}`, { quantity: 1 });
      if (response.data.success) {
        dispatch(decreaseQuantity(item._id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decrease quantity");
    }
  };

  const handleRemove = async (item) => {
    try {
      const response = await axios.post(`http://localhost:3000/products/release/${item._id}`, { quantity: item.quantity });
      if (response.data.success) {
        dispatch(clearItem(item._id));
        toast.success("Item removed from cart");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove item");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar cartCount={cartCount} />

      <h1 className="text-3xl font-bold text-center py-6">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <p className="text-center text-xl pb-10">
          Your cart is empty.
        </p>
      ) : (
        <div className="flex gap-6 px-10 pb-10 items-start">
          <div className="w-[68%] bg-white rounded-xl shadow-md p-5">
            <div className="grid grid-cols-5 bg-orange-400 text-white font-bold p-3 rounded-lg mb-4 text-center">
              <p>Product</p>
              <p>Price</p>
              <p>Quantity</p>
              <p>Subtotal</p>
              <p>Remove</p>
            </div>

            {cart.map((item) => {
              const itemSubtotal =
                getPrice(item.price) * item.quantity;

              return (
                <div
                  key={item._id}
                  className="grid grid-cols-5 items-center text-center border-b py-4"
                >
                  <div className="flex items-center gap-4 text-left">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    <h2 className="font-semibold">
                      {item.title}
                    </h2>
                  </div>

                  <p>₹{item.price}</p>

                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="bg-gray-200 px-3 py-1 rounded font-bold"
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => handleIncrease(item)}
                      className="bg-gray-200 px-3 py-1 rounded font-bold"
                    >
                      +
                    </button>
                  </div>

                  <p>₹{itemSubtotal}</p>

                  <button
                    onClick={() => handleRemove(item)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="w-[32%] bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">
              Order Summary
            </h2>

            <div className="flex justify-between mb-4 text-lg">
              <span>Items</span>
              <span>{cartCount}</span>
            </div>

            <div className="flex justify-between mb-4 text-lg">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between mb-4 text-lg">
              <span>Shipping</span>
              <span>₹{shipping}</span>
            </div>

            <hr className="my-4" />

            <div className="flex justify-between text-xl font-bold mb-6">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
             onClick={() => navigate("/checkout")}
             className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-green-700"
            >
             Checkout
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Cart;