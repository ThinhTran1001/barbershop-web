import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchBarberById, getBarberBookings } from '../../services/barberApi';
import { Spin, Table, Tag, Avatar, Typography, message } from 'antd';

const { Title } = Typography;
const statusColors = {
  pending: 'gold',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'red',
  no_show: 'orange',
};

export default function BarberPublicProfile() {
  const { id } = useParams(); // barberId
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchBarberById(id);
        setProfile(res);
     
        if (user && (user.role === 'admin' || user.id === res.userId._id)) {
          const bookingsRes = await getBarberBookings(id, { limit: 50 });
          setBookings(bookingsRes.bookings || bookingsRes);
        }
      } catch (err) {
        message.error('Không thể tải thông tin thợ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, user]);

  if (loading) return <Spin />;
  if (!profile) return <div>Không tìm thấy thợ</div>;

  const { userId, bio, experienceYears, specialties, averageRating, totalBookings, profileImageUrl } = profile;
  const name = userId?.name;
  const email = userId?.email;
  const phone = userId?.phone;
  const avatarUrl = userId?.avatarUrl || profileImageUrl;

  const columns = [
    { title: 'Ngày', dataIndex: 'bookingDate', key: 'bookingDate', render: (date) => new Date(date).toLocaleString('vi-VN'), align: 'center' },
    { title: 'Khách hàng', dataIndex: 'customerId', key: 'customerId', render: (customer, record) => customer?.name || record.customerName || 'N/A', align: 'center' },
    { title: 'Dịch vụ', dataIndex: 'serviceId', key: 'serviceId', render: (service) => service?.name || 'N/A', align: 'center' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => <Tag color={statusColors[status] || 'default'}>{status}</Tag>, align: 'center' },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', render: (note) => note || '', align: 'center' },
  ];

  return (
    <div className="customer-profile">
      <h2 className="customer-profile__title">Thông tin thợ cắt tóc</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar src={avatarUrl} size={96} style={{ marginBottom: 16 }}>{name?.[0]}</Avatar>
      </div>
      <div className="customer-profile__info">
        <div className="customer-profile__field"><b>Họ tên:</b> {name}</div>
        <div className="customer-profile__field"><b>Email:</b> {email}</div>
        <div className="customer-profile__field"><b>Số điện thoại:</b> {phone}</div>
        <div className="customer-profile__field"><b>Chuyên môn:</b> {specialties?.join(', ')}</div>
        <div className="customer-profile__field"><b>Kinh nghiệm:</b> {experienceYears} năm</div>
        <div className="customer-profile__field"><b>Đánh giá:</b> {averageRating} ⭐</div>
        <div className="customer-profile__field"><b>Tổng số lịch đã cắt:</b> {totalBookings}</div>
        <div className="customer-profile__field"><b>Bio:</b> {bio}</div>
      </div>
      {(user && (user.role === 'admin' || user.id === userId?._id)) && (
        <div className="customer-profile__info" style={{ marginTop: 32 }}>
          <Title level={5}>Lịch đặt của bạn</Title>
          <Table
            columns={columns}
            dataSource={bookings}
            rowKey={record => record._id}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </div>
      )}
    </div>
  );
} 