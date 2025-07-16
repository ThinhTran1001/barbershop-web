import React, { useState, useEffect } from "react";
import serviceImage from "../../assets/images/service.jpg";
import "../../css/landing/service.css";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/services");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setServices(Array.isArray(data.services) ? data.services : []);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="services-section">
        <div className="container">
          <div className="services-content">
            <div className="services-info">
              <h2 className="services-title">
                DỊCH VỤ & <span className="highlight">BẢNG GIÁ</span>
              </h2>
              <div className="title-separator"></div>
              <div className="loading">Đang tải dữ liệu...</div>
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

  if (error) {
    return (
      <section className="services-section">
        <div className="container">
          <div className="services-content">
            <div className="services-info">
              <h2 className="services-title">
                DỊCH VỤ & <span className="highlight">BẢNG GIÁ</span>
              </h2>
              <div className="title-separator"></div>
              <div className="error">{error}</div>
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
              {services.map((service) => (
                <li key={service.id} className="service-item">
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