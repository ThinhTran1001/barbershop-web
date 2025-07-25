import React from 'react';
import { Button, Select, Input, Space, Tooltip, Row, Col, DatePicker } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined, ReloadOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import '../pages/ManageDiscountProduct/ManageDiscountProduct.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DiscountSearch = ({
  searchText = '',
  statusFilter = 'all',
  handleSearch,
  handleStatusFilter,
  handleClearFilters,
  fetchDiscounts,
  loading = false,
  setAddModalVisible,
  productsWithoutDiscount = [],
  statistics = { filtered: 0, total: 0 },
  dateRange = [null, null],
  setDateRange = () => {},
}) => {
  return (
    <div className="discount-product-container">
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Search
            placeholder="Search by product name..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={handleStatusFilter}
            style={{ width: '100%' }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All</Option>
            <Option value="active">Active</Option>
            <Option value="expiring">Expiring Soon</Option>
            <Option value="expired">Expired</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            allowEmpty={[true, true]}
            placeholder={["Start date", "End date"]}
          />
        </Col>
        <Col xs={24} sm={24} md={10} lg={8}>
          <Space wrap>
            {(searchText || statusFilter !== 'all' || (dateRange && (dateRange[0] || dateRange[1]))) && (
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearFilters}
                type="default"
              >
                Clear Filters
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDiscounts}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              disabled={productsWithoutDiscount.length === 0}
              className="add-button"
            >
              Add Discount
            </Button>
            {productsWithoutDiscount.length === 0 && (
              <Tooltip title="No products available to add discount">
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            )}
          </Space>
        </Col>
      </Row>
      {(searchText || statusFilter !== 'all' || (dateRange && (dateRange[0] || dateRange[1]))) && (
        <div style={{ marginTop: 8, color: '#666', fontSize: '14px' }}>
          Showing {statistics.filtered} / {statistics.total} discounts
          {searchText && ` | Search: "${searchText}"`}
          {statusFilter !== 'all' && ` | Status: ${
            statusFilter === 'active' ? 'Active' :
            statusFilter === 'expiring' ? 'Expiring Soon' :
            statusFilter === 'expired' ? 'Expired' :
            statusFilter === 'inactive' ? 'Inactive' : 'All'
          }`}
          {dateRange && (dateRange[0] || dateRange[1]) && ` | Date: ${dateRange[0] ? dateRange[0].format('DD/MM/YYYY') : ''} - ${dateRange[1] ? dateRange[1].format('DD/MM/YYYY') : ''}`}
        </div>
      )}
    </div>
  );
};

export default DiscountSearch;