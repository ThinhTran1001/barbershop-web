import { Layout, Menu, Button } from "antd";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const { Header } = Layout;

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Header className="d-flex justify-content-between align-items-center bg-white px-4 shadow-sm">
      <Menu theme="light" mode="horizontal" defaultSelectedKeys={["product"]}>
        <Menu.Item key="product" onClick={() => navigate("/admin/product")}>Product</Menu.Item>
        <Menu.Item key="brand" onClick={() => navigate("/admin/brand")}>Brand</Menu.Item>
        <Menu.Item key="category" onClick={() => navigate("/admin/category")}>Category</Menu.Item>
      </Menu>

      <div className="d-flex align-items-center gap-3">
        <span>{user?.name} ({user?.role})</span>
        <Button type="primary" danger onClick={handleLogout}>Logout</Button>
      </div>
    </Header>
  );
};

export default AdminHeader;
