import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TimeSlotPicker from '../../components/TimeSlotPicker.jsx';
import { Card, Typography, message, Alert, Button, Space } from 'antd';
import { InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title } = Typography;

// For demo, you can pass a hardcoded barberId or get it from route/query
const TimeSlotPickerPage = () => {
  const navigate = useNavigate();

  // Lấy barberId từ localStorage hoặc route tuỳ flow thực tế
  const barber = localStorage.getItem('selectedBarber');
  const barberId = barber ? JSON.parse(barber)._id : null;

  // Lấy service information từ localStorage
  const service = localStorage.getItem('selectedService');
  const serviceData = service ? JSON.parse(service) : null;

  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSelect = (selectedDateTime) => {
    setSelectedSlot(selectedDateTime);
    localStorage.setItem('selectedTimeSlot', JSON.stringify(selectedDateTime));
    console.log('Selected DateTime:', selectedDateTime); // Debug log
    // Chuyển sang trang xác nhận booking hoặc booking info
    window.location.href = '/booking-info';
  };

  // Kiểm tra xem có đủ thông tin không
  if (!barberId || !serviceData) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <Card>
          <Title level={2} style={{ marginBottom: 24 }}>Lỗi</Title>
          <p>Thiếu thông tin barber hoặc service. Vui lòng quay lại và chọn lại.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      {/* New Booking Flow Notice */}
      <Alert
        message="🎉 Improved Booking Experience Available!"
        description={
          <Space direction="vertical" size="small">
            <div>We've launched a new single-page booking experience that's faster and easier to use.</div>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/book-service')}
              size="small"
            >
              Try New Booking Experience
            </Button>
          </Space>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
        closable
      />

      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>Chọn khung giờ đặt lịch</Title>
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <p><strong>Dịch vụ:</strong> {serviceData.name}</p>
          <p><strong>Thời gian:</strong> {serviceData.durationMinutes} phút</p>
          <p><strong>Giá:</strong> {serviceData.price?.toLocaleString('vi-VN')} VND</p>
        </div>
        <TimeSlotPicker
          barberId={barberId}
          serviceId={serviceData._id}
          durationMinutes={serviceData.durationMinutes}
          onSelect={handleSelect}
        />
      </Card>
    </div>
  );
};

export default TimeSlotPickerPage;
