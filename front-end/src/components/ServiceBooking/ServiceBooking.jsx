import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/reset.css';
import { Typography, List, Image, message } from 'antd';
import axios from 'axios';
import './ServiceBooking.css';

const { Title, Paragraph } = Typography;

const API_URL = "http://localhost:3000/api/services";

const ServiceBooking = () => {
  const [services, setServices] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    '/image/barber1.png',
    '/image/barber2.png',
    '/image/barber3.png',
    '/image/barber4.png',
    '/image/barber5.png',
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(API_URL);
      setServices(response.data);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      message.error("Lỗi khi tải dịch vụ");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="service-booking-wrapper">
      <div className="container mt-5">
        <div className="row">
          {/* Danh sách dịch vụ */}
          <div className="col-md-6">
            <div className="services-list">
              <Title level={2} className="services-title">DỊCH VỤ & BẢNG GIÁ</Title>
              <List
                dataSource={services}
                renderItem={(service, index) => (
                  <List.Item key={index} className="service-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Title level={4} className="service-name">{service.name}</Title>
                    <Paragraph className="service-price"><strong>Giá:</strong> {service.price?.toLocaleString()} VND</Paragraph>
                    <Paragraph><strong>Mô tả:</strong> {service.description}</Paragraph>
                    <Paragraph><strong>Các bước:</strong> {service.steps}</Paragraph>
                    <Paragraph><strong>Thời gian:</strong> {service.durationMinutes} phút</Paragraph>
                    <Paragraph><strong>Phù hợp với:</strong> {Array.isArray(service.suggestedFor) ? service.suggestedFor.join(', ') : ''}</Paragraph>
                  </List.Item>
                )}
              />
            </div>
          </div>

          {/* Hình ảnh chuyển đổi */}
          <div className="col-md-6">
            <div className="image-gallery">
              <Image
                src={images[currentImageIndex]}
                alt={`Barber service ${currentImageIndex + 1}`}
                className="gallery-image"
                preview={false}
                key={currentImageIndex}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;
