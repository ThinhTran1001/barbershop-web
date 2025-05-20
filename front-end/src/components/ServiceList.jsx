import React from "react";
import { Typography, List } from "antd";

const { Title, Paragraph } = Typography;

const ServiceList = ({ services }) => (
  <div className="services-list">
    <Title level={2} className="services-title">DỊCH VỤ & BẢNG GIÁ</Title>
    <List
      dataSource={services}
      renderItem={(service, index) => (
        <List.Item key={index} className="service-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Title level={4}>{service.name}</Title>
          <Paragraph><strong>Giá:</strong> {service.price?.toLocaleString()} VND</Paragraph>
          <Paragraph><strong>Mô tả:</strong> {service.description}</Paragraph>
          <Paragraph><strong>Các bước:</strong> {service.steps}</Paragraph>
          <Paragraph><strong>Thời gian:</strong> {service.durationMinutes} phút</Paragraph>
          <Paragraph><strong>Phù hợp với:</strong> {Array.isArray(service.suggestedFor) ? service.suggestedFor.join(', ') : ''}</Paragraph>
        </List.Item>
      )}
    />
  </div>
);

export default ServiceList;
