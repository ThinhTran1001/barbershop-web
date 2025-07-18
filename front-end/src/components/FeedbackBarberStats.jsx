import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { StarFilled, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const FeedbackBarberStats = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Total Feedbacks"
            value={stats.total || 0}
            prefix={<StarFilled style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Active"
            value={stats.active || 0}
            prefix={<CheckOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Deleted"
            value={stats.deleted || 0}
            prefix={<CloseOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default FeedbackBarberStats;