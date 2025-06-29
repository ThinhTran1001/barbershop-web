import React, { useEffect, useState } from 'react';
import { Table, Typography, Spin, message, Tag } from 'antd';
import { getMyBookings } from '../../services/serviceApi.js';

const { Title } = Typography;

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBookings()
      .then(data => setBookings(data))
      .catch(() => message.error('Không thể tải danh sách đặt lịch!'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'Dịch vụ', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Thợ cắt', dataIndex: 'barberName', key: 'barberName' },
    { title: 'Ngày đặt', dataIndex: 'bookingDate', key: 'bookingDate' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: status => <Tag color={status === 'completed' ? 'green' : 'blue'}>{status}</Tag> },
  ];

  const dataSource = bookings.map(b => ({
    key: b._id,
    serviceName: b.service?.name || b.serviceId?.name || 'N/A',
    barberName: b.barber?.userId?.name || b.barberId?.userId?.name || 'Tự động',
    bookingDate: b.bookingDate ? new Date(b.bookingDate).toLocaleString() : '',
    status: b.status || 'pending',
  }));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Title level={2}>Lịch sử đặt lịch của tôi</Title>
      {loading ? <Spin size="large" /> : <Table columns={columns} dataSource={dataSource} pagination={false} />}
    </div>
  );
};

export default MyBookingsPage;

