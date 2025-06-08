import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { ShoppingOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const DiscountStats = ({ statistics = { total: 0, active: 0, expiring: 0, expired: 0 } }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Total Discounts" 
            value={statistics.total} 
            prefix={<ShoppingOutlined />} 
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Active" 
            value={statistics.active} 
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Expiring Soon" 
            value={statistics.expiring} 
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Expired" 
            value={statistics.expired} 
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default DiscountStats;