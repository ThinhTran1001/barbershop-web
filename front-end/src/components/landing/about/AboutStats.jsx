import React from 'react';
import { Row, Col, Statistic, Typography } from 'antd';

const { Title } = Typography;

const AboutStats = () => {
  return (
    <div className="about-stats" style={{ padding: '60px 20px', background: '#f0f2f5' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>Thống kê nổi bật</Title>
      <Row justify="center" gutter={40}>
        <Col xs={24} sm={8}>
          <Statistic title="Khách hàng" value={5000} suffix="+" valueStyle={{ color: '#f1c40f' }} />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic title="Tỉnh thành" value={63} valueStyle={{ color: '#f1c40f' }} />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic title="Quốc gia" value={4} valueStyle={{ color: '#f1c40f' }} />
        </Col>
      </Row>
    </div>
  );
};

export default AboutStats;
