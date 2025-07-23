import React from 'react';
import { Row, Col, Select, DatePicker, Input } from 'antd';
import { SearchOutlined, StarFilled, ScissorOutlined, FileTextOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const FeedbackBarberFilters = ({
  searchValue,
  setSearchValue,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  ratingFilter,
  setRatingFilter,
  barberFilter,
  setBarberFilter,
  bookingFilter,
  setBookingFilter,
  barbers = [],
  bookings = []
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

  const barberOptions = [
    { label: 'All Barbers', value: 'All' },
    ...barbers.map(barber => ({
      label: (
        <span>
          <ScissorOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          {barber.name || barber._id}
        </span>
      ),
      value: barber._id || barber.id
    }))
  ];

  const bookingOptions = [
    { label: 'All Bookings', value: 'All' },
    ...bookings.slice(0, 50).map(booking => ({
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 8, color: '#722ed1' }} />
          {booking.label || booking._id || booking.id}
        </span>
      ),
      value: booking._id || booking.id
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
            { label: 'Unapproved', value: 'Unapproved' },
            { label: 'Deleted', value: 'Deleted' }
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
          value={barberFilter}
          onChange={setBarberFilter}
          placeholder="All Barbers"
          options={barberOptions}
          showSearch
          filterOption={(input, option) =>
            option.label?.props?.children?.[1]?.toLowerCase().includes(input.toLowerCase())
          }
        />
      </Col>
      <Col xs={12} sm={6} md={4} lg={4}>
        <Select
          style={{ width: '100%' }}
          value={bookingFilter}
          onChange={setBookingFilter}
          placeholder="All Bookings"
          options={bookingOptions}
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

export default FeedbackBarberFilters;
