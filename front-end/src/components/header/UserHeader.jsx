import React from "react";
import { Layout, Menu } from "antd";
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
        items={navItems}
        className="d-flex justify-content-center flex-wrap text-uppercase fw-bold"
        style={{
          backgroundColor: "transparent",
          color: "#ffc107",
          borderBottom: "none",
        }}
        defaultSelectedKeys={["home"]}
      />
    </Header>
  );
}
