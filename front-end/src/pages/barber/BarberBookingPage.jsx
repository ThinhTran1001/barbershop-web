import React from 'react';
import { useParams } from 'react-router-dom';
import BarberBookingList from '../../components/BarberBookingList.jsx';
import { Card } from 'antd';

const BarberBookingPage = () => {
  const { barberId } = useParams();
  return (
    <Card style={{ maxWidth: 900, margin: '32px auto' }}>
      <BarberBookingList barberId={barberId} />
    </Card>
  );
};

export default BarberBookingPage;

