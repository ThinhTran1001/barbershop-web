import React, { useState } from "react";
import { Typography, List } from "antd";

const { Title } = Typography;

const ServiceList = ({ services, tabs, activeTab, handleTabClick }) => {
  const [expandedService, setExpandedService] = useState(null);
  const displayServices = services || [];

  const toggleService = (index) => {
    setExpandedService(expandedService === index ? null : index);
  };

  return (
    <div className="services-list">
      <Title level={2} className="services-title" style={{ color: "white" }}>
        DỊCH VỤ & BẢNG GIÁ
      </Title>
      <div className="service-tabs row mb-4">
        {tabs.map((tab) => (
          <div key={tab.id} className="col-2 px-1">
            <div
              className={`service-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <div className="tab-label">{tab.label}</div>
            </div>
          </div>
        ))}
      </div>

      <List
        dataSource={displayServices}
        renderItem={(service, index) => (
          <div key={index} className="service-item-container">
            <div
              className="service-item"
              onClick={() => toggleService(index)}
              style={{
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                padding: "15px",
                borderBottom: "1px dashed #444",
                backgroundColor:
                  expandedService === index ? "#2a2a2a" : "transparent",
                borderRadius: "4px",
              }}
            >
              <div className="service-name">{service.name}</div>
              <div className="service-price">
                {service.price?.toLocaleString()} đ
              </div>
            </div>

            {expandedService === index && (
              <div
                className="service-details"
                style={{
                  padding: "15px",
                  backgroundColor: "#2a2a2a",
                  borderRadius: "0 0 4px 4px",
                  marginBottom: "10px",
                  animation: "fade 0.3s ease-in",
                }}
              >
                <p>
                  <strong>Mô tả:</strong>{" "}
                  {service.description || service.detail}
                </p>
                <p>
                  <strong>Các bước:</strong>{" "}
                  {Array.isArray(service.steps)
                    ? service.steps.join(", ")
                    : typeof service.steps === "string"
                    ? service.steps.replace(/(?<=[a-zà-ỹ])(?=[A-ZÀ-Ỹ])/g, ", ")
                    : ""}
                </p>
                <p>
                  <strong>Thời gian:</strong> {service.durationMinutes} phút
                </p>
                <p>
                  <strong>Phù hợp với:</strong>{" "}
                  {Array.isArray(service.suggestedFor)
                    ? service.suggestedFor.join(", ")
                    : service.suggestedFor}
                </p>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ServiceList;
