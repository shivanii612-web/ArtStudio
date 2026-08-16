import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoute = () => {
  const location = useLocation();

  const { user, token } = useSelector((state) => state.user);

  const storedToken = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const currentUser = user || storedUser;
  const currentToken = token || storedToken;

  // Login check
  if (!currentToken) {
    return (
      <Navigate
        to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Admin check
  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;