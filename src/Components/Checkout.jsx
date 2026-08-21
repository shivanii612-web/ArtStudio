import React, { useState } from "react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../features/cart/Cartslice";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cart = useSelector((state) => state.cart.items) || [];
  const user = useSelector((state) => state.user.user);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const getPrice = (price) => {
    return Number(String(price).replace("₹", ""));
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) =>
      total + getPrice(item.price) * item.quantity,
    0
  );

  const shipping = cart.length > 0 ? 50 : 0;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {

  try {

    const orderData = {

      userId: user._id,

      fullName,
      phone,
      address,
      city,
      state,
      pincode,

      paymentMethod,

      products: cart.map((item) => ({
        productId: item._id,
        name: item.title,
        quantity: item.quantity,
        price: getPrice(item.price),
      })),

      totalAmount: total,

    };


    const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");
    const response = await axios.post(
      `${BACKEND_URL}/orders/place`,
      orderData
    );

    toast.success("Order placed successfully!");


    dispatch(clearCart());


    navigate("/");


  } catch(error) {

    console.log(
      error.response?.data || error.message
    );

    toast.error(error.response?.data?.message || "Order failed!");

  }

};

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-10">
        <h1 className="text-4xl font-bold text-center mb-10">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Side */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">

            <h2 className="text-2xl font-bold mb-6">
              Shipping Details
            </h2>

            <div className="grid grid-cols-2 gap-5">

              <div>
                <label className="font-semibold">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-2"
                  placeholder="Enter Full Name"
                />
              </div>

              <div>
                <label className="font-semibold">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-2"
                  placeholder="Enter Phone Number"
                />
              </div>

              <div>
                <label className="font-semibold">
                  City
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-2"
                  placeholder="Enter City"
                />
              </div>

              <div>
                <label className="font-semibold">
                  State
                </label>

                <input
                  type="text"
                  value={state}
                  onChange={(e) =>
                    setState(e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-2"
                  placeholder="Enter State"
                />
              </div>

              <div>
                <label className="font-semibold">
                  Pincode
                </label>

                <input
                  type="text"
                  value={pincode}
                  onChange={(e) =>
                    setPincode(e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-2"
                  placeholder="Enter Pincode"
                />
              </div>

              <div>
                <label className="font-semibold">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-2"
                >
                  <option value="COD">
                    Cash on Delivery
                  </option>
                  <option value="Online">
                    Online Payment
                  </option>
                </select>
              </div>

            </div>

            <div className="mt-6">
              <label className="font-semibold">
                Address
              </label>

              <textarea
                rows="5"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                className="w-full border rounded-lg p-3 mt-2"
                placeholder="Enter Full Address"
              />
            </div>

          </div>

          {/* Right Side */}
          <div className="bg-white rounded-2xl shadow-lg p-8 h-fit">

            <h2 className="text-2xl font-bold mb-6">
              Order Summary
            </h2>

            {cart.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 border-b pb-4 mb-4"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-gray-500">
                    Qty : {item.quantity}
                  </p>
                </div>

                <p className="font-bold">
                  ₹{getPrice(item.price) * item.quantity}
                </p>
              </div>
            ))}

            <div className="flex justify-between mt-6">
              <span>Items</span>
              <span>{cartCount}</span>
            </div>

            <div className="flex justify-between mt-3">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between mt-3">
              <span>Shipping</span>
              <span>₹{shipping}</span>
            </div>

            <hr className="my-5" />

            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg"
            >
              Place Order
            </button>

          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;