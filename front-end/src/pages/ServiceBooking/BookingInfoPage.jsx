import React, { useState } from 'react';
import BookingInfoForm from '../../components/BookingInfoForm.jsx';
import { Card, Typography, message, Descriptions, Divider, Button } from 'antd';
import { createBooking } from '../../services/serviceApi.js';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { Title } = Typography;

const BookingInfoPage = () => {
  // Lấy thông tin đã chọn từ localStorage
  const service = JSON.parse(localStorage.getItem('selectedService') || '{}');
  const barber = JSON.parse(localStorage.getItem('selectedBarber') || '{}');
  const timeSlot = JSON.parse(localStorage.getItem('selectedTimeSlot') || '{}');
  const [submitting, setSubmitting] = useState(false);
  const token = Cookies.get('accessToken');
  console.log(token)
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // Lấy customerId từ token trong cookie (giả sử JWT lưu ở cookie 'token')
      let customerId;
      const token = Cookies.get('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          customerId = payload.id || payload._id || payload.userId;
        } catch (e) {
          customerId = undefined;
        }
      }
      // Chuẩn bị dữ liệu booking gửi lên backend
      const bookingData = {
        customerId,
        serviceId: service._id,
        barberId: barber?._id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        note: formData.note,
        notificationMethods: formData.notificationMethods,
        bookingDate: dayjs().toISOString(), // hoặc chọn ngày thực tế nếu có UI chọn ngày
        durationMinutes: service.durationMinutes || 30, // fallback nếu không có
        // Có thể bổ sung customerId nếu đã đăng nhập
        // autoAssignedBarber: !barber?._id
      };
      await createBooking(bookingData);
      message.success('Đặt lịch thành công!');
      localStorage.removeItem('selectedService');
      localStorage.removeItem('selectedBarber');
      localStorage.removeItem('selectedTimeSlot');
      setTimeout(() => window.location.href = '/', 1500);
    } catch (e) {
      message.error('Đặt lịch thất bại!');
    }
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <Card>
        <Title level={2}>Xác nhận & Nhập thông tin đặt lịch</Title>
        <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Dịch vụ">{service.name} ({service.price?.toLocaleString()} đ)</Descriptions.Item>
          <Descriptions.Item label="Thợ cắt">{barber.userId?.name || 'Tự động chọn'}</Descriptions.Item>
          <Descriptions.Item label="Khung giờ">{timeSlot?.label || timeSlot?.toString() || 'Chưa chọn'}</Descriptions.Item>
        </Descriptions>
        <Divider />
        <BookingInfoForm onSubmit={handleSubmit} />
        <Button type="primary" loading={submitting} htmlType="submit" form="booking-info-form" style={{ marginTop: 24 }} block>
          Xác nhận đặt lịch
        </Button>
      </Card>
    </div>
  );
};

export default BookingInfoPage;
