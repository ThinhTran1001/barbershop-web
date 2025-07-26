import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../services/api';
import { getBarberBookings } from '../../services/barberApi';
import { useNavigate } from 'react-router-dom';
import { Spin, Button, Table, Tag, Avatar, Typography, message, Modal, Input, Select } from 'antd';
import { StarFilled, EyeOutlined } from '@ant-design/icons';
import { toast, ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../css/profile/customerprofile.css';

const { Title, Text } = Typography;

const statusColors = {
  pending: 'gold',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'red',
  no_show: 'orange',
};

const getImage = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('/assets')) return imagePath.substring(1);
  if (imagePath.startsWith('http')) return imagePath;
  return '';
};

const BarberProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [filterRating, setFilterRating] = useState('All');
  const [searchText, setSearchText] = useState('');


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.warn('Vui lòng đăng nhập để xem thông tin cá nhân.');
      navigate('/login');
      return;
    }
    fetchProfileAndBookings();
  }, [user, authLoading]);

  const fetchProfileAndBookings = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const data = res.data;
      setProfile(data.data || data.user);
      const userId = (data.data || data.user)?._id;
      console.log('userId', userId);
      if (userId) {
        const bookingsRes = await getBarberBookings(userId, { limit: 50 });
        setBookings(bookingsRes.bookings || bookingsRes);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError('Lỗi khi tải thông tin barber hoặc lịch đặt.');
      message.error(err?.response?.data?.message || 'Lỗi kết nối server!');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => <span>{new Date(date).toLocaleString('vi-VN')}</span>,
      align: 'center',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customer, record) => customer?.name || record.customerName || 'N/A',
      align: 'center',
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceId',
      key: 'serviceId',
      render: (service) => service?.name || 'N/A',
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status] || 'default'}>{status}</Tag>,
      align: 'center',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (note) => note || '',
      align: 'center',
    },
  ];

  // Fetch feedbacks khi mở modal
  const handleOpenFeedbackModal = async () => {
    setShowFeedbackModal(true);
    setFeedbackLoading(true);
    try {
      // Gọi API lấy feedbacks cho barber này
      // Giả sử barberId là profile._id
      const res = await fetch(`/api/feedback-barber?barberId=${profile._id}`);
      const data = await res.json();
      setFeedbacks(data.data || []);
    } catch (err) {
      setFeedbacks([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(fb =>
    (filterRating === 'All' || fb.rating === filterRating) &&
    (searchText === '' || (fb.comment && fb.comment.toLowerCase().includes(searchText.toLowerCase())))
  );

  const feedbackColumns = [
    { title: 'Khách hàng', dataIndex: 'reviewer', key: 'reviewer', align: 'center' },
    { title: 'Điểm', dataIndex: 'rating', key: 'rating', align: 'center', render: (r) => <span><StarFilled style={{ color: '#faad14' }} /> {r}</span> },
    { title: 'Bình luận', dataIndex: 'comment', key: 'comment', align: 'left', width: 400 },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', align: 'center', render: (d) => new Date(d).toLocaleString('vi-VN') },
  ];

  if (authLoading || loading) return <Spin tip="Đang tải thông tin..." />;
  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>
        <p>{error}</p>
        <Button onClick={() => navigate('/login')} type="primary">Đăng nhập lại</Button>
      </div>
    );
  }
  if (!profile) return null;

 
  const { userId, bio, experienceYears, specialties, averageRating, totalBookings, profileImageUrl } = profile;
  const name = userId?.name;
  const email = userId?.email;
  const phone = userId?.phone;
  const avatarUrl = getImage(userId?.avatarUrl || profileImageUrl);

  return (
    <div className="customer-profile">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false} transition={Zoom} style={{ marginTop: '80px' }} />
      <h2 className="customer-profile__title">Thông tin thợ cắt tóc</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar src={avatarUrl} size={96} style={{ marginBottom: 16 }}>
          {name?.[0]}
        </Avatar>
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
        <Button type="primary" icon={<StarFilled />} onClick={handleOpenFeedbackModal} style={{ margin: '16px 0' }}>
          Xem đánh giá
        </Button>
      </div>
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
      <Modal
        open={showFeedbackModal}
        onCancel={() => setShowFeedbackModal(false)}
        footer={null}
        title="Đánh giá từ khách hàng"
        width={900}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Select value={filterRating} onChange={setFilterRating} style={{ width: 120 }}>
            <Select.Option value="All">Tất cả điểm</Select.Option>
            {[5,4,3,2,1].map(r => <Select.Option key={r} value={r}>{r} sao</Select.Option>)}
          </Select>
          <Input.Search
            placeholder="Tìm bình luận..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
        </div>
        <Spin spinning={feedbackLoading}>
          <Table
            columns={feedbackColumns}
            dataSource={filteredFeedbacks}
            rowKey={record => record._id}
            pagination={{ pageSize: 6 }}
            bordered
            size="middle"
          />
        </Spin>
      </Modal>
    </div>
  );
};

export default BarberProfile;