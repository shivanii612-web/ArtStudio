import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Product from "./Components/Product";
import Cart from "./Components/Cart";
import Wishlist from "./Components/Wishlist";

import SignIn from "./Components/login/Signin";
import SignUp from "./Components/login/Signup";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import axios from "axios";
import { loginSuccess, logout } from "./features/user/UserSlice";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";
import AdminProducts from "./Components/AdminProducts";
import Checkout from "./Components/Checkout";
import AdminOrders from "./Components/AdminOrders";
import Orders from "./Components/Orders";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// GoogleOAuthProvider moved to main.jsx to avoid duplicate providers

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        const res = await axios.get("http://localhost:3000/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success && res.data.user) {
          dispatch(
            loginSuccess({
              user: res.data.user,
              token: token,
            }),
          );
        }
      } catch (err) {
        console.log(err);
        dispatch(logout());
      }
    };

    fetchUserProfile();
  }, [dispatch]);

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/" element={<Product />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route
              path="/admin/products"
              element={<AdminProducts />}
            />
            <Route
              path="/admin/orders"
              element={<AdminOrders />}
            />
          </Route>
        </Routes>

        {/* Toast Notification */}
        <ToastContainer
          position="top-right"
          autoClose={2000}
          theme="colored"
        />
      </BrowserRouter>
  );
}

export default App;