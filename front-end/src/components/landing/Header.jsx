import React from "react";
import "../../css/landing/header.css";

export default function Header() {
  const navItems = [
    "TRANG CHỦ",
    "GIỚI THIỆU",
    "DỊCH VỤ & BẢNG GIÁ",
    "SẢN PHẨM",
    "TIN TỨC",
    "LIÊN HỆ"
  ];

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <ul className="nav-list">
            {navItems.map((item, idx) => (
              <li key={item} className="nav-item">
                <a
                  href="#"
                  className={`nav-menu`}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}