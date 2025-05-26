import React from "react";
import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import "../../css/landing/common-header.css";

const { Header } = Layout;

const navItems = [
  { key: "home", label: "TRANG CHỦ", path: "/" },
  { key: "about", label: "GIỚI THIỆU", path: "/about" },
  { key: "services", label: "DỊCH VỤ & BẢNG GIÁ", path: "/services" },
  { key: "products", label: "SẢN PHẨM", path: "/products" },
  { key: "news", label: "TIN TỨC", path: "/news" },
  { key: "contact", label: "LIÊN HỆ", path: "/contact" },
];

export default function UserHeader() {
  const location = useLocation();

  const selectedKey = navItems.find((item) =>
    location.pathname == "/" ? item.path == "/" : location.pathname.startsWith(item.path)
  )?.key;

  return (
    <Header
      className="fixed-top px-3"
      style={{
        backgroundColor: "#000",
        zIndex: 1000,
        borderBottom: "1px solid rgba(255, 193, 7, 0.2)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        height: "auto",
      }}
    >
      <Menu
        mode="horizontal"
        theme="dark"
        selectedKeys={[selectedKey]}
        className="d-flex justify-content-center flex-wrap text-uppercase fw-bold"
        style={{
          backgroundColor: "transparent",
          color: "#ffc107",
          borderBottom: "none",
        }}
        items={navItems.map((item) => ({
          key: item.key,
          label: (
            <Link
              to={item.path}
              style={{
                color: "#ffc107",
                textDecoration: "none" 
              }}
            >
              {item.label}
            </Link>
          ),
        }))}
      />
    </Header>
  );
}