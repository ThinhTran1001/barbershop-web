import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RoleBasedLayout = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/product" replace />;
    case "barber":
      return <Navigate to="/barber" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default RoleBasedLayout;