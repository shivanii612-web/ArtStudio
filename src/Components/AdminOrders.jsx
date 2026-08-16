import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminNavbar from "./AdminNavbar";

const AdminOrders = () => {

  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/orders/all"
      );

      setOrders(res.data.orders);

    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    fetchOrders();
  }, []);


  const updateStatus = async (id, status) => {
    try {

      await axios.put(
        `http://localhost:3000/orders/status/${id}`,
        { status }
      );

      toast.success("Order status updated");

      fetchOrders();

    } catch(error) {
      toast.error("Update failed");
    }
  };


  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1F2937]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[2px] bg-[#F97316]"></span>
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#F97316]">ArtStudio</span>
            <span className="w-8 h-[2px] bg-[#F97316]"></span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1F2937]">
            Order Management
          </h1>
        </div>

        <div className="space-y-8">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-[#E7E0D8] shadow-[0_6px_25px_rgba(231,224,216,0.4)] p-8 border-l-4 border-l-[#F97316] hover:shadow-[0_12px_30px_rgba(231,224,216,0.6)] transition-all duration-300"
            >
              {/* Top Section */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#1F2937]">
                      {order.fullName || order.userId?.name}
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-[#F97316]"></span>
                    <span className="text-xs text-[#64748B] font-mono">
                      ID: #{order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-[#1F2937] mt-3">
                    <p><span className="text-[#64748B] font-semibold mr-1">Email:</span> {order.userId?.email}</p>
                    <p><span className="text-[#64748B] font-semibold mr-1">Phone:</span> {order.phone}</p>
                    <p className="sm:col-span-2"><span className="text-[#64748B] font-semibold mr-1">Address:</span> {order.address}, {order.city}</p>
                    <p><span className="text-[#64748B] font-semibold mr-1">Payment:</span> <span className="bg-[#FFF1E6] text-[#F97316] px-2.5 py-0.5 rounded-lg text-xs font-bold border border-[#E7E0D8]">{order.paymentMethod}</span></p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 self-stretch md:self-auto justify-between md:justify-start">
                  <div className="text-right">
                    <span className="text-xs text-[#64748B] uppercase tracking-wider block font-semibold mb-0.5">Total Amount</span>
                    <h2 className="text-3xl font-black text-[#16A34A] leading-tight">
                      ₹{order.totalAmount}
                    </h2>
                  </div>

                  {/* Status dropdown styled conditionally */}
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className={`mt-1 border px-4 py-2 rounded-xl text-sm font-bold focus:outline-none transition-all duration-200 cursor-pointer ${
                      order.status === "Delivered"
                        ? "border-[#16A34A] text-[#16A34A] bg-[#16A34A]/5"
                        : order.status === "Cancelled"
                        ? "border-[#DC2626] text-[#DC2626] bg-[#DC2626]/5"
                        : order.status === "Shipped"
                        ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/5"
                        : "border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/5"
                    }`}
                  >
                    <option value="Placed">Placed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <hr className="border-[#E7E0D8]/60 my-6" />

              {/* Products section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#F97316] rounded-full"></span>
                  <h3 className="text-lg font-bold text-[#1F2937]">
                    Ordered Products
                  </h3>
                </div>

                <div className="overflow-x-auto border border-[#E7E0D8] rounded-xl shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FFF1E6] text-[#1F2937] text-xs uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4 text-center">Quantity</th>
                        <th className="p-4 text-right">Price</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#E7E0D8]/50">
                      {order.products.map((product) => (
                        <tr
                          key={product._id}
                          className="bg-white hover:bg-[#F8F5F0]/30 transition-colors"
                        >
                          <td className="p-4 font-semibold text-[#1F2937]">{product.name}</td>
                          <td className="p-4 text-center text-[#1F2937] font-medium">{product.quantity}</td>
                          <td className="p-4 text-right text-[#1F2937] font-semibold">₹{product.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default AdminOrders;