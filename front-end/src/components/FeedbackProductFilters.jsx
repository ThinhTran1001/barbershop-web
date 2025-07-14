import React from 'react';
import { Row, Col, Select, DatePicker, Input } from 'antd';
import { SearchOutlined, StarFilled, ShoppingOutlined } from '@ant-design/icons';

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
  products = []
}) => {
  const ratingOptions = [
    { label: 'All Stars', value: 'All' },
    ...Array.from({ length: 5 }, (_, i) => ({
      label: (
        <span>
          <StarFilled style={{ color: '#faad14' }} /> {5 - i} Star{5 - i > 1 ? 's' : ''}
        </span>
      ),
      value: 5 - i
    }))
  ];

  const productOptions = [
    { label: 'All Products', value: 'All' },
    ...products.map(product => ({
      label: (
        <span>
          <ShoppingOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {product.name}
        </span>
      ),
      value: product._id
    }))
  ];

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Input
          placeholder="Search by name or comment..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
        />
      </Col>

      <Col xs={12} sm={6} md={4} lg={3}>
        <Select
          style={{ width: '100%' }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Status', value: 'All' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Pending', value: 'Pending' }
          ]}
        />
      </Col>

      <Col xs={12} sm={6} md={4} lg={3}>
        <Select
          style={{ width: '100%' }}
          value={ratingFilter}
          onChange={setRatingFilter}
          placeholder="All Stars"
          options={ratingOptions}
        />
      </Col>

      <Col xs={12} sm={6} md={4} lg={4}>
        <Select
          style={{ width: '100%' }}
          value={productFilter}
          onChange={setProductFilter}
          placeholder="All Products"
          options={productOptions}
          showSearch
          filterOption={(input, option) =>
            option.label?.props?.children?.[1]?.toLowerCase().includes(input.toLowerCase())
          }
        />
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <RangePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          value={dateRange}
          onChange={setDateRange}
          allowClear
          placeholder={['From', 'To']}
        />
      </Col>
    </Row>
  );
};

export default FeedbackProductFilters;
