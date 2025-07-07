import React from "react";

const ServiceItem = ({ service, expanded, onClick }) => {
  if (!service) return null;
  return (
    <div
      className="service-item"
      onClick={onClick}
      style={{
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        padding: "15px",
        borderBottom: "1px dashed #444",
        backgroundColor: expanded ? "#2a2a2a" : "transparent",
        borderRadius: "4px",
      }}
    >
      <div>
        {service.name || JSON.stringify(service)}
      </div>
      <div className="service-price">
        {service.price?.toLocaleString()} đ
      </div>
    </div>
  );
};

export default ServiceItem;
