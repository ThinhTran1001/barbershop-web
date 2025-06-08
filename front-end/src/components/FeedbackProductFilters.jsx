import React from 'react';
import { Row, Col, Select, DatePicker, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const FeedbackBarberFilters = ({ statusFilter, setStatusFilter, setDateRange, handleRefresh }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8}>
        <Select
          style={{ width: '100%' }}
          value={statusFilter}
          onChange={value => setStatusFilter(value)}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Approved', value: 'approved' },
            { label: 'Pending', value: 'pending' }
          ]}
        />
      </Col>
      <Col xs={24} sm={12}>
        <RangePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          onChange={setDateRange}
          allowClear
          placeholder={['From', 'To']}
        />
      </Col>
      <Col xs={24} sm={4}>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} block>
          Refresh
        </Button>
      </Col>
    </Row>
  );
};

export default FeedbackBarberFilters;