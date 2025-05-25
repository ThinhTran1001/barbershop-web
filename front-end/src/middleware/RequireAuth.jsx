import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin } from "antd";

const RequireRole = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spin fullscreen />;

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default RequireRole;