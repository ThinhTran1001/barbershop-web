import { Layout, Menu, Button } from "antd";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";

const { Header } = Layout;

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedKey = location.pathname.includes("brand")
    ? "brand"
    : location.pathname.includes("category")
      ? "category"
      : "product";

  return (
    <Header
      className="d-flex align-items-center justify-content-between px-4"
      style={{
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo hoặc tiêu đề */}
      <div className="fw-bold fs-5" onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
        🧔‍ Barber Admin
      </div>

      {/* Menu */}
      <Menu
        theme="light"
        mode="horizontal"
        selectedKeys={[selectedKey]}
        className="flex-grow-1 mx-5 border-0"
        style={{ background: "transparent" }}
      >
        <Menu.Item key="product" onClick={() => navigate("/admin/product")}>
          Product
        </Menu.Item>
        <Menu.Item key="brand" onClick={() => navigate("/admin/brand")}>
          Brand
        </Menu.Item>
        <Menu.Item key="category" onClick={() => navigate("/admin/category")}>
          Category
        </Menu.Item>
      </Menu>

      {/* User info + logout */}
      <div className="d-flex align-items-center gap-3">
        <span className="text-muted">
          <UserOutlined className="me-1" />
          {user?.name} ({user?.role})
        </span>
        <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </Header>
  );
};

export default AdminHeader;
