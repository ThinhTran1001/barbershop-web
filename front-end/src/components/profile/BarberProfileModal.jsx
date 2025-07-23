import React, { useEffect, useState } from 'react';
import { Modal, Avatar, Typography, Statistic, Tag, Row, Col, Descriptions, Spin, message, Button, Tooltip, Table } from 'antd';
import { getBarberPublicById } from '../../services/barberApi';
import { UserOutlined, StarFilled, ScissorOutlined, CrownFilled, FireFilled, EyeOutlined } from '@ant-design/icons';
import { getBarberFeedbackById } from '../../services/barberApi';

const { Title, Text } = Typography;

function StarRating({ value = 0, max = 5 }) {
  return (
    <span>
      {[...Array(max)].map((_, i) => (
        <StarFilled key={i} style={{ color: i < value ? '#faad14' : '#eee', fontSize: 20, transition: 'color 0.2s' }} />
      ))}
    </span>
  );
}

export default function BarberProfileModal({ barberId, open, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ open: false, feedback: null, loading: false });

  useEffect(() => {
    if (!barberId || !open) return;
    setLoading(true);
    const fetchProfile = async () => {
      try {
        const res = await getBarberPublicById(barberId);
        setProfile(res.data);
      } catch (err) {
        message.error('Không thể tải thông tin thợ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [barberId, open]);

  // Hàm mở modal feedback chi tiết
  const handleShowFeedback = async (feedbackId) => {
    setFeedbackModal({ open: true, feedback: null, loading: true });
    try {
      const res = await getBarberFeedbackById(feedbackId);
      setFeedbackModal({ open: true, feedback: res.data, loading: false });
    } catch (err) {
      setFeedbackModal({ open: false, feedback: null, loading: false });
      message.error('Không thể tải feedback');
    }
  };

  // Table feedbacks (nếu có)
  const feedbacks = profile?.feedbacks || [];
  const feedbackColumns = [
    { title: 'Khách hàng', dataIndex: 'reviewer', key: 'reviewer', align: 'center' },
    { title: 'Điểm', dataIndex: 'rating', key: 'rating', align: 'center', render: (r) => <StarFilled style={{ color: '#faad14' }} /> },
    { title: 'Bình luận', dataIndex: 'comment', key: 'comment', align: 'center', ellipsis: true },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', align: 'center', render: (d) => new Date(d).toLocaleString('vi-VN') },
    { title: '', key: 'action', align: 'center', render: (_, record) => <Button icon={<EyeOutlined />} onClick={() => handleShowFeedback(record._id)}>Chi tiết</Button> },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={750}
      title={<span>Thông tin thợ cắt tóc</span>}
      destroyOnClose
      bodyStyle={{ background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', borderRadius: 12 }}
    >
      {loading ? (
        <Spin />
      ) : !profile ? (
        <div>Không tìm thấy thợ</div>
      ) : (
        <Row gutter={32} align="middle">
          <Col xs={24} md={8} style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <Avatar
                src={profile.avatarUrl || profile.image}
                size={120}
                icon={<UserOutlined />}
                style={{
                  marginBottom: 16,
                  border: '3px solid #fff',
                  boxShadow: '0 4px 24px #b3b3b3',
                  transition: 'transform 0.3s',
                  cursor: 'pointer',
                }}
                className="barber-avatar-animate"
              />
              {profile.averageRating >= 4.5 && (
                <Tooltip title="Top Rated Barber">
                  <CrownFilled style={{
                    color: '#fadb14',
                    fontSize: 32,
                    position: 'absolute',
                    top: -10,
                    right: -18,
                    filter: 'drop-shadow(0 2px 6px #fff)'
                  }} />
                </Tooltip>
              )}
              {profile.totalBookings > 100 && (
                <Tooltip title="Hot Barber">
                  <FireFilled style={{
                    color: '#ff4d4f',
                    fontSize: 28,
                    position: 'absolute',
                    bottom: -10,
                    left: -18,
                    filter: 'drop-shadow(0 2px 6px #fff)'
                  }} />
                </Tooltip>
              )}
            </div>
            <Title level={3} style={{ marginBottom: 0, marginTop: 8 }}>{profile.name}</Title>
            <Text type="secondary">{profile.bio}</Text>
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 500, marginRight: 8 }}>Đánh giá:</span>
                <StarRating value={Math.round(profile.averageRating)} />
                <span style={{ marginLeft: 8, color: '#faad14', fontWeight: 500 }}>{profile.averageRating?.toFixed(1) || 0} / 5</span>
              </div>
              <Statistic
                title={<span style={{ fontWeight: 500 }}><ScissorOutlined /> Tổng lịch đã cắt</span>}
                value={profile.totalBookings || 0}
                valueStyle={{ color: '#1677ff', fontWeight: 600 }}
                style={{ marginBottom: 8 }}
              />
            </div>
            
          </Col>
          <Col xs={24} md={16}>
            <Descriptions
              title={<span style={{ fontWeight: 600, color: '#6366f1' }}>Thông tin chi tiết</span>}
              bordered
              column={1}
              size="middle"
              labelStyle={{ width: 180, fontWeight: 500 }}
              contentStyle={{ fontSize: 16 }}
            >
              <Descriptions.Item label="Chuyên môn">
                {profile.specialties && profile.specialties.length > 0 ? profile.specialties.map((s, idx) => (
                  <Tag
                    key={s}
                    color={["#1677ff", "#36cfc9", "#ff85c0", "#ffc53d", "#73d13d"][idx % 5]}
                    style={{ fontSize: 15, padding: '2px 12px', marginBottom: 4, borderRadius: 16, transition: 'all 0.2s' }}
                  >
                    {s}
                  </Tag>
                )) : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm">{profile.experienceYears} năm</Descriptions.Item>
              <Descriptions.Item label="Ghi chú">{profile.note || ''}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      )}
    </Modal>
  );
}
