import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { StarOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const FeedbackProductStats = ({ stats }) => {
  return (
    <Row gutter={16} className="feedback-stats-row">
      <Col xs={24} sm={12} lg={8}>
        <Card>
          <Statistic
            title="Total Feedback"
            value={stats.total}
            prefix={<StarOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card>
          <Statistic
            title="Approved"
            value={stats.approved}
            prefix={<CheckOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card>
          <Statistic
            title="Pending"
            value={stats.pending}
            prefix={<CloseOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default FeedbackProductStats;