import React, { useEffect, useState } from 'react';
import { fetchAllBarbers, fetchBarbersBySpecialty } from '../services/barberApi';
import { Card, Button, Input, Row, Col, Typography, Spin, message } from 'antd';

const { Title } = Typography;

const BarberList = ({ onSelect, onSkip }) => {
  const [barbers, setBarbers] = useState([]);
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBarbers = async () => {
    setLoading(true);
    try {
      let result;
      if (specialty) {
        result = await fetchBarbersBySpecialty(specialty);
      } else {
        result = await fetchAllBarbers();
      }
      setBarbers(Array.isArray(result) ? result : []);
    } catch (e) {
      message.error('Failed to fetch barbers');
      setBarbers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBarbers();
    // eslint-disable-next-line
  }, [specialty]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Chọn thợ cắt tóc</Title>
      <Input.Search
        placeholder="Lọc theo chuyên môn/dịch vụ..."
        value={specialty}
        onChange={e => setSpecialty(e.target.value)}
        onSearch={loadBarbers}
        allowClear
        style={{ maxWidth: 400, marginBottom: 24 }}
      />
      <Button onClick={onSkip} style={{ marginBottom: 24, marginLeft: 16 }}>
        Bỏ qua (Tự động chọn thợ)
      </Button>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}><Spin size="large" /></div>
      ) : (
        <Row gutter={[24, 24]}>
          {barbers.map((barber, idx) => (
            <Col xs={24} sm={12} md={8} lg={6} key={barber._id || idx}>
              <Card
                title={barber.userId?.name}
                bordered={false}
                style={{ minHeight: 180 }}
                actions={[
                  <Button type="primary" block onClick={() => onSelect && onSelect(barber)} key="choose">Chọn</Button>
                ]}
              >
                <div>Exp: {barber.experienceYears || 0} năm</div>
                <div>Rating: {barber.rating || 'N/A'}</div>
                <div>Chuyên môn: {barber.specialties?.join(', ')}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default BarberList;
