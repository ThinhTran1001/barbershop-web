import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin } from "antd";

const RedirectIfAuthenticated = () => {
  const { user, loading } = useAuth();

  if (loading) return <Spin fullscreen />;

  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "barber") return <Navigate to="/barber" replace />;
  return <Navigate to="/" replace />;
};

export default RedirectIfAuthenticated;