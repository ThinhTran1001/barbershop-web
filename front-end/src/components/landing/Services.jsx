import React, { useState, useEffect } from "react";
import serviceImage from "../../assets/images/service.jpg";
import "../../css/landing/service.css";
import { getAllServices } from "../../services/api";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await getAllServices();
        const data = response.data;
        setServices(data);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  const renderContent = () => (
    <div className="container">
      <div className="services-content">
        <div className="services-info">
          <h2 className="services-title">
            DỊCH VỤ & <span className="highlight">BẢNG GIÁ</span>
          </h2>
          <div className="title-separator1"></div>

          {loading && <div className="loading">Đang tải dữ liệu...</div>}
          {error && <div className="error">{error}</div>}
          
          {!loading && !error && (
            <ul className="services-list">
              {services.map((service) => (
                <li key={service._id} className="service-item">
                  <span className="service-name">{service.name}</span>
                  <span className="service-price">
                    {service.price.toLocaleString("vi-VN")} VND
                  </span>
                </li>
              ))}
            </ul>
          )}
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
  );

  return <section className="services-section">{renderContent()}</section>;
}
