// src/components/Header/BarberHeader.jsx
import { Layout, Button } from "antd";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const { Header } = Layout;

const BarberHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Header className="d-flex justify-content-between align-items-center bg-white px-4 shadow-sm">
      <div>
        <h4 className="mb-0">Barber Dashboard</h4>
      </div>

      <div className="d-flex align-items-center gap-3">
        <span>{user?.name} ({user?.role})</span>
        <Button type="primary" danger onClick={handleLogout}>Logout</Button>
      </div>
    </Header>
  );
};

export default BarberHeader;
