import React from "react";
import { Layout, Menu, Button, Dropdown } from "antd";
import { useAuth } from "../../context/AuthContext";
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
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
          <Dropdown
            menu={{
              items: [
                { key: "logout", label: "Đăng xuất", onClick: handleLogout },
              ],
            }}
          >
            <Button type="text" style={{ color: "#ffc107" }}>
              {user.name || user.email}
            </Button>
          </Dropdown>
        )}
      </div>
    </Header>
  );
}
