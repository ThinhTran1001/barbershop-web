import React from 'react';
import { Row, Col, Input, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FeedbackProductFilters = ({
  searchValue,
  setSearchValue,
  statusFilter,
  setStatusFilter,
  setDateRange,
  fetchFeedbacks,
  loading
}) => {
  return (
    <Row justify="space-between" align="middle" className="header-row">
      <Col>
        <Space size="middle">
          <Search
            placeholder="Search..."
            allowClear
            className="search-input"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="filter-select"
          >
            <Option value="all">All</Option>
            <Option value="approved">Approved</Option>
            <Option value="pending">Pending</Option>
          </Select>
          <RangePicker
            onChange={(dates) => setDateRange(dates || [])}
            format="DD/MM/YYYY"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchFeedbacks}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

export default FeedbackProductFilters;