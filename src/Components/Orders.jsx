import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useSelector((state) => state.user.user);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://art-studio-mh42.onrender.com/").replace(/\/$/, "");
      const res = await axios.get(
        `${BACKEND_URL}/orders/user/${user._id}`
      );

      setOrders(res.data.orders);
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchOrders();
    }
  }, [user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      case "Processing":
        return "bg-purple-50 text-purple-700 border-purple-200";

      default:
        return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-500";

      case "Shipped":
        return "bg-blue-500";

      case "Cancelled":
        return "bg-red-500";

      case "Processing":
        return "bg-purple-500";

      default:
        return "bg-orange-500";
    }
  };

  const formatDate = (date) => {
    if (!date) return null;

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#263746]">
      <Navbar />

      <div className="relative overflow-hidden">

        {/* Background Decoration */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 md:pt-14 pb-8">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">

            <div>
              <div className="flex items-center gap-2 mb-3">

                <span className="w-9 h-[2px] bg-orange-500"></span>

                <span className="text-xs font-bold tracking-[0.25em] uppercase text-orange-500">
                  ArtStudio
                </span>

              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#263746]">
                My Orders
              </h1>

              <p className="text-gray-500 mt-3 text-base sm:text-lg">
                Track your artwork supplies and order deliveries
              </p>
            </div>

            {/* Total Orders */}
            <div className="flex items-center gap-3 bg-white border border-[#eee5dc] rounded-2xl px-5 py-4 shadow-sm">

              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">

                <svg
                  className="w-6 h-6 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m-8-4l8 4m0 0v10"
                  />
                </svg>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Total Orders
                </p>

                <p className="text-2xl font-black text-[#263746] leading-tight">
                  {orders.length}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* Orders */}
        <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pb-16">

          {/* Loading */}
          {loading ? (

            <div className="flex flex-col gap-6">

              {[1, 2].map((item) => (

                <div
                  key={item}
                  className="bg-white rounded-[1.75rem] border border-[#eee5dc] overflow-hidden shadow-sm animate-pulse"
                >

                  <div className="h-24 bg-gray-100"></div>

                  <div className="p-6 space-y-4">

                    <div className="h-5 bg-gray-100 rounded-lg w-1/3"></div>

                    <div className="h-16 bg-gray-100 rounded-2xl"></div>

                    <div className="h-16 bg-gray-100 rounded-2xl"></div>

                    <div className="h-20 bg-gray-100 rounded-2xl"></div>

                  </div>

                </div>

              ))}

            </div>

          ) : orders.length === 0 ? (

            /* No Orders */
            <div className="bg-white border border-[#eee5dc] rounded-[2rem] shadow-sm px-6 py-16 text-center">

              <div className="mx-auto w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mb-6">

                <svg
                  className="w-10 h-10 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m-8-4l8 4m0 0v10"
                  />
                </svg>

              </div>

              <h2 className="text-2xl font-bold text-[#263746]">
                No Orders Yet
              </h2>

              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Your artwork supplies and purchases will appear here once you
                place your first order.
              </p>

            </div>

          ) : (

            /*
             * IMPORTANT
             * Every order comes one below another.
             * No two orders side by side.
             */
            <div className="flex flex-col gap-7">

              {orders.map((order) => {

                const orderDate = formatDate(
                  order.createdAt ||
                    order.orderDate ||
                    order.date
                );

                return (

                  <article
                    key={order._id}
                    className="group w-full bg-white rounded-[1.75rem] border border-[#eee5dc] overflow-hidden shadow-[0_8px_30px_rgba(45,67,86,0.06)] hover:shadow-[0_18px_45px_rgba(45,67,86,0.12)] transition-all duration-300"
                  >

                    {/* =========================
                        ORDER HEADER
                    ========================== */}

                    <div className="relative px-6 md:px-8 py-5 bg-[#263746] text-white overflow-hidden">

                      <div className="absolute -right-10 -top-16 w-40 h-40 rounded-full bg-orange-500/10"></div>

                      <div className="absolute right-32 -bottom-20 w-32 h-32 rounded-full bg-purple-500/10"></div>

                      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>

                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                            Order ID
                          </p>

                          <p className="text-xl font-bold tracking-wide mt-1">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>

                          {orderDate && (
                            <p className="text-xs text-gray-400 mt-1">
                              Placed on {orderDate}
                            </p>
                          )}

                        </div>

                        {/* Status */}
                        <div
                          className={`self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold ${getStatusStyle(
                            order.status
                          )}`}
                        >

                          <span
                            className={`w-2 h-2 rounded-full ${getStatusDot(
                              order.status
                            )}`}
                          ></span>

                          {order.status || "Pending"}

                        </div>

                      </div>

                    </div>

                    {/* =========================
                        ORDER BODY
                    ========================== */}

                    <div className="p-6 md:p-8">

                      {/* Products Header */}
                      <div className="flex items-center justify-between mb-5">

                        <div>

                          <h2 className="text-xl font-bold text-[#263746]">
                            Order Items
                          </h2>

                          <p className="text-xs text-gray-400 mt-1">
                            Products included in this order
                          </p>

                        </div>

                        <span className="px-4 py-2 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
                          {order.products.length}{" "}
                          {order.products.length === 1
                            ? "Item"
                            : "Items"}
                        </span>

                      </div>

                      {/* Products */}
                      <div className="space-y-3">

                        {order.products.map((item, index) => (

                          <div
                            key={item._id || index}
                            className="flex items-center justify-between gap-5 px-5 py-4 rounded-2xl bg-[#fcfaf7] border border-[#f1e9df] hover:border-orange-200 transition-colors"
                          >

                            <div className="flex items-center gap-4 min-w-0">

                              <div className="w-11 h-11 shrink-0 rounded-xl bg-white border border-[#eee5dc] flex items-center justify-center">

                                <svg
                                  className="w-5 h-5 text-orange-400"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 3v18M3 12h18"
                                  />
                                </svg>

                              </div>

                              <div className="min-w-0">

                                <p className="font-bold text-sm md:text-base text-[#263746] truncate">
                                  {item.name}
                                </p>

                                <p className="text-xs text-gray-400 mt-1">
                                  Quantity: {item.quantity} × ₹
                                  {item.price}
                                </p>

                              </div>

                            </div>

                            <div className="text-right shrink-0">

                              <p className="font-bold text-base text-[#263746]">
                                ₹{item.price * item.quantity}
                              </p>

                              <p className="text-[11px] text-gray-400 mt-1">
                                Total
                              </p>

                            </div>

                          </div>

                        ))}

                      </div>

                      {/* Divider */}
                      <div className="border-t border-dashed border-gray-200 my-7"></div>

                      {/* Bottom Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Delivery */}
                        <div className="rounded-2xl bg-[#faf9f7] border border-[#eee9e2] p-5">

                          <div className="flex items-center gap-3 mb-4">

                            <div className="w-9 h-9 rounded-xl bg-white border border-[#eee5dc] flex items-center justify-center">

                              <svg
                                className="w-4 h-4 text-orange-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z"
                                />

                                <circle
                                  cx="12"
                                  cy="11"
                                  r="2.2"
                                />

                              </svg>

                            </div>

                            <h3 className="font-bold text-sm text-[#263746]">
                              Delivery Address
                            </h3>

                          </div>

                          <div className="text-sm text-gray-500 leading-6 pl-12">

                            <p className="font-bold text-gray-700">
                              {order.fullName}
                            </p>

                            <p>{order.address}</p>

                            <p>
                              {order.city}, {order.state}
                            </p>

                            <p>{order.pincode}</p>

                          </div>

                        </div>

                        {/* Total */}
                        <div className="rounded-2xl bg-[#263746] p-5 text-white">

                          <div className="flex items-center justify-between">

                            <h3 className="text-sm font-semibold text-gray-300">
                              Total Amount
                            </h3>

                            <span className="text-orange-400 text-lg">
                              ₹
                            </span>

                          </div>

                          <p className="text-3xl md:text-4xl font-black text-white mt-2">
                            ₹{order.totalAmount}
                          </p>

                          <div className="mt-4 flex items-center justify-between">

                            <span className="text-xs text-gray-400">
                              Payment Method
                            </span>

                            <span className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-gray-200">
                              💳 {order.paymentMethod}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* =========================
                        FOOTER
                    ========================== */}

                    <div className="px-6 md:px-8 py-3.5 border-t border-[#eee5dc] bg-[#fffdf9]">

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>

                          <span className="text-xs font-bold text-[#263746]">
                            ArtStudio
                          </span>

                        </div>

                        <span className="text-xs text-gray-400">
                          Thank you for your order 🎨
                        </span>

                      </div>

                    </div>

                  </article>

                );
              })}

            </div>
          )}

        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Orders;