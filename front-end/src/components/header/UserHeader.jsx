import React from "react";
import { Layout, Menu, Button, Dropdown, Badge } from "antd";
import { ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useUserCart } from "../../context/UserCartContext";
import { useNavigate } from "react-router-dom";
import "../../css/landing/common-header.css";

const { Header } = Layout;

const navItems = [
  { key: "home", label: "TRANG CHỦ" },
  { key: "about", label: "GIỚI THIỆU" },
  { key: "services", label: "DỊCH VỤ & BẢNG GIÁ" },
  { key: "products", label: "SẢN PHẨM" },
  { key: "news", label: "TIN TỨC" },
  { key: "contact", label: "LIÊN HỆ" },
];

export default function UserHeader() {
  const { user, logout } = useAuth();
  const { getCartCount: getGuestCartCount } = useCart();
  const { getCartCount: getUserCartCount } = useUserCart();
  const navigate = useNavigate();

  // Dùng cart count theo trạng thái đăng nhập
  const getCartCount = () => {
    return user ? getUserCartCount() : getGuestCartCount();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/profile"),
    },
    {
      key: "orders",
      label: "Lịch sử đơn hàng",
      onClick: () => navigate("/my-orders"),
    },
    {
      key: "logout",
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      className="fixed-top px-4 d-flex justify-content-between align-items-center flex-wrap"
      style={{
        backgroundColor: "#000",
        zIndex: 1000,
        borderBottom: "1px solid rgba(255, 193, 7, 0.2)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        height: "auto",
      }}
    >
      <div className="d-flex justify-content-center flex-grow-1">
        <Menu
          mode="horizontal"
          theme="dark"
          items={navItems}
          className="text-uppercase fw-bold"
          style={{
            backgroundColor: "transparent",
            borderBottom: "none",
            color: "#ffc107",
          }}
          defaultSelectedKeys={["home"]}
          onClick={({ key }) => {
            navigate(`/${key === "home" ? "" : key}`);
          }}
        />
      </div>

      <div className="d-flex align-items-center gap-2 ms-auto">
        <Badge count={getCartCount()} showZero={false}>
          <Button
            type="text"
            icon={<ShoppingCartOutlined />}
            style={{ color: "#ffc107", fontSize: "18px" }}
            onClick={() => navigate(user ? "/cart" : "/cart-guest")}
          />
        </Badge>

        {!user ? (
          <>
            <Button type="default" onClick={() => navigate("/login")}>
              Đăng nhập
            </Button>
            <Button
              className="bg-warning"
              onClick={() => navigate("/register")}
            >
              Đăng ký
            </Button>
          </>
        ) : (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ color: "#ffc107" }}>
              <UserOutlined />
              <span style={{ marginLeft: "8px" }}>
                {user.name || user.email}
              </span>
            </Button>
          </Dropdown>
        )}
      </div>
    </Header>
  );
}
