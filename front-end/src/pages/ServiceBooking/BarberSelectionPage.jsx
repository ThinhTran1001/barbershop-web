import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarberList from '../../components/BarberList.jsx';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const BarberSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [skipped, setSkipped] = useState(false);

  const handleSelect = (barber) => {
    setSelectedBarber(barber);
    setSkipped(false);
    localStorage.setItem('selectedBarber', JSON.stringify(barber));
    navigate('/booking-info');
  };

  const handleSkip = () => {
    setSelectedBarber(null);
    setSkipped(true);
    localStorage.removeItem('selectedBarber');
    navigate('/booking-info');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>Chọn thợ cắt tóc</Title>
        <BarberList onSelect={handleSelect} onSkip={handleSkip} />
      </Card>
    </div>
  );
};

export default BarberSelectionPage;
