import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { StarOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';

const FeedbackProductStats = ({ stats }) => {
  return (
    <Row gutter={16} className="feedback-stats-row">
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Feedback"
            value={stats.total}
            prefix={<StarOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active"
            value={stats.active}
            prefix={<CheckOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Inactive"
            value={stats.inactive}
            prefix={<CloseOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Deleted"
            value={stats.deleted}
            prefix={<DeleteOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default FeedbackProductStats;