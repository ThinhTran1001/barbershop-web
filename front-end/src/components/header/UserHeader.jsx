import React from "react";
import { Layout, Menu, Button, Dropdown, Badge } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { useUserCart } from "../../context/UserCartContext";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../../css/landing/common-header.css";

const { Header } = Layout;

// Cập nhật navItems - không có "TRANG CHỦ"
const navItems = [
  { key: "about", label: "GIỚI THIỆU" },
  { key: "services", label: "DỊCH VỤ & BẢNG GIÁ" },
  { key: "products", label: "SẢN PHẨM" },
  { key: "news", label: "TIN TỨC" },
  { key: "contact", label: "LIÊN HỆ" },
];

export default function UserHeader() {
  const { user, logout } = useAuth();
  const { getCartCount: getGuestCartCount } = useCart();
  const { getCartCount: getUserCartCount, clearCart } = useUserCart();
  const navigate = useNavigate();
  const cartCount = user ? getUserCartCount() : getGuestCartCount();

  console.log("UserHeader render, cart count:", cartCount);

  const handleLogout = async () => {
    await logout();
    await clearCart(); // Reset cart khi logout
    navigate("/login");
  };

  const scrollToSection = (sectionId) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        scrollToElement(sectionId);
      }, 100);
    } else {
      scrollToElement(sectionId);
    }
  };

  const scrollToElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      const headerHeight = 70;
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
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
      icon: <ShoppingCartOutlined />,
      label: "Lịch sử đơn hàng",
      onClick: () => navigate("/my-orders"),
    },
    {
      key: "vouchers",
      icon: <GiftOutlined />,
      label: "Voucher của tôi",
      onClick: () => navigate("/my-vouchers"),
    },
    {
      key: "bookings",
      icon: <CalendarOutlined />,
      label: "Lịch hẹn của tôi",
      onClick: () => navigate("/my-booking"),
    },
    {
      key: "feedback",
      icon: <StarOutlined />,
      label: "Đánh giá của tôi",
      onClick: () => navigate("/my-feedback"),
    },
    {
      type: "divider",
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
      {/* Logo BARBERSHOP */}
      <div
        style={{
          fontWeight: "bold",
          fontSize: "20px",
          color: "#ffc107",
          cursor: "pointer",
          marginRight: "32px",
        }}
        onClick={() => {
          navigate("/");
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }, 50);
        }}
      >
        BARBERSHOP
      </div>

      {/* Navigation menu */}
      <Menu
        mode="horizontal"
        theme="dark"
        items={navItems}
        className="text-uppercase fw-bold flex-grow-1"
        style={{
          backgroundColor: "transparent",
          borderBottom: "none",
          color: "#ffc107",
          justifyContent: "center",
        }}
        overflowedIndicator={null} // ✅ Tắt thu gọn "..."
        onClick={({ key }) => {
          if (key === "services") {
            scrollToSection("services");
          } else {
            navigate(`/${key}`);
          }
        }}
      />

      {/* Giỏ hàng & user dropdown */}
      <div className="d-flex align-items-center gap-2 ms-auto">
        <Badge count={cartCount} showZero={false}>
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
            <Button className="bg-warning" onClick={() => navigate("/register")}>
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
