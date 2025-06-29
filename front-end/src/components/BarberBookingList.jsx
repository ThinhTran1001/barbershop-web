import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Alert, Spin, Typography } from 'antd';
import 'antd/dist/reset.css';

const BarberBookingList = ({ barberId, date, status }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!barberId) return;
    setLoading(true);
    setError(null);
    let url = `/api/barbers/${barberId}/bookings`;
    const params = {};
    if (date) params.date = date;
    if (status) params.status = status;
    axios.get(url, { params })
      .then(res => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Error fetching bookings');
        setLoading(false);
      });
  }, [barberId, date, status]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (_, record) => record.customerId?.name || record.customerName || 'N/A',
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (_, record) => record.serviceId?.name || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => status,
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      render: (note) => note || '',
    },
  ];

  if (!barberId) return <Alert message="Please select a barber." type="info" showIcon />;
  if (loading) return <Spin tip="Loading bookings..." style={{width:'100%'}} />;
  if (error) return <Alert message={error} type="error" showIcon />;
  if (bookings.length === 0) return <Alert message="No bookings found." type="warning" showIcon />;

  return (
    <div>
      <Typography.Title level={3}>Booking Schedule</Typography.Title>
      <Table
        columns={columns}
        dataSource={bookings.map(b => ({ ...b, key: b._id }))}
        pagination={{ pageSize: 10 }}
        bordered
      />
    </div>
  );
};

export default BarberBookingList;
