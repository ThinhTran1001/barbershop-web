import React, { useState } from 'react';
import TimeSlotPicker from '../../components/TimeSlotPicker.jsx';
import { Card, Typography, message } from 'antd';

const { Title } = Typography;

// For demo, you can pass a hardcoded barberId or get it from route/query
const TimeSlotPickerPage = () => {
  // Lấy barberId từ localStorage hoặc route tuỳ flow thực tế
  const barberId = localStorage.getItem('selectedBarberId') || 'BARBER_ID_HERE';
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSelect = (slot) => {
    setSelectedSlot(slot);
    localStorage.setItem('selectedTimeSlot', JSON.stringify(slot));
    // Chuyển sang trang xác nhận booking hoặc booking info
    window.location.href = '/booking-info';
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>Chọn khung giờ đặt lịch</Title>
        <TimeSlotPicker barberId={barberId} onSelect={handleSelect} />
      </Card>
    </div>
  );
};

export default TimeSlotPickerPage;
