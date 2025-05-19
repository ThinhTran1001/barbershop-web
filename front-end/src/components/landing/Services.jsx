import React from "react";
import serviceImage from "../../assets/images/service.jpg";
import "../../css/landing/service.css";

const services = [
  { name: "CẮT TÓC", price: "200.000 VND" },
  { name: "CẠO RÂU", price: "100.000 VND" },
  { name: "CẮT TÓC + CẠO RÂU", price: "250.000 VND" },
  { name: "TẠO KIỂU + SẤY", price: "250.000 VND" },
];

export default function Services() {
  return (
    <section className="services-section">
      <div className="container">
        <div className="services-content">
          <div className="services-info">
            <h2 className="services-title">
              DỊCH VỤ & <span className="highlight">BẢNG GIÁ</span>
            </h2>
            <div className="title-separator"></div>
            
            <ul className="services-list">
              {services.map((service, index) => (
                <li key={index} className="service-item">
                  <span className="service-name">{service.name}</span>
                  <span className="service-price">{service.price}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="services-image-container">
            <img
              src={serviceImage}
              alt="Haircut Service"
              className="services-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}