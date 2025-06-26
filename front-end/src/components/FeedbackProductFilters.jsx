import React from 'react';
import { Row, Col, Select, DatePicker, Input } from 'antd';
import { SearchOutlined, StarOutlined, ShoppingOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const FeedbackProductFilters = ({ 
  searchValue, 
  setSearchValue, 
  statusFilter, 
  setStatusFilter, 
  dateRange, 
  setDateRange,
  ratingFilter,
  setRatingFilter,
  productFilter,
  setProductFilter,
  products
}) => {
  return (
    <Row gutter={[16, 16]} className="feedback-filters-row">
      <Col xs={24} sm={12} md={8}>
        <Input
          placeholder="Search by comment, user name, product name..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
          className="feedback-filters-search-input"
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Select
          style={{ width: '100%' }}
          placeholder="Filter by status"
          value={statusFilter}
          onChange={value => setStatusFilter(value)}
          className="feedback-filters-select"
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Approved', value: 'approved' },
            { label: 'Pending', value: 'pending' }
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <RangePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          value={dateRange}
          onChange={setDateRange}
          allowClear
          placeholder={['From Date', 'To Date']}
          className="feedback-filters-date-picker"
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Select
          style={{ width: '100%' }}
          placeholder="Filter by star rating"
          prefix={<StarOutlined />}
          value={ratingFilter}
          onChange={value => setRatingFilter(value)}
          allowClear
          className="feedback-filters-select"
          options={[
            { label: '⭐⭐⭐⭐⭐ 5 stars', value: 5 },
            { label: '⭐⭐⭐⭐ 4 stars', value: 4 },
            { label: '⭐⭐⭐ 3 stars', value: 3 },
            { label: '⭐⭐ 2 stars', value: 2 },
            { label: '⭐ 1 star', value: 1 }
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Select
          style={{ width: '100%' }}
          placeholder="Filter by product"
          prefix={<ShoppingOutlined />}
          value={productFilter}
          onChange={value => setProductFilter(value)}
          allowClear
          showSearch
          optionFilterProp="children"
          className="feedback-filters-select"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={products?.map(product => ({
            label: product.name,
            value: product._id
          })) || []}
        />
      </Col>
    </Row>
  );
};

export default FeedbackProductFilters;