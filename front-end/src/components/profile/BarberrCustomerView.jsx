import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBarberPublicById } from '../../services/barberApi';
import { Card, Avatar, Typography, Statistic, Tag, Row, Col, Descriptions, Spin, message } from 'antd';
import { UserOutlined, StarFilled, ScissorOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function BarberCustomerView() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getBarberPublicById(id);
        setProfile(res.data);
      } catch (err) {
        message.error('Không thể tải thông tin thợ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <Spin />;
  if (!profile) return <div>Không tìm thấy thợ</div>;

  const { name, avatarUrl, specialties, experienceYears, averageRating, totalBookings, bio, image } = profile;

  return (
    <div style={{ maxWidth: 700, margin: '80px auto', padding: 24 }}>
      <Card>
        <Row gutter={32} align="middle">
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Avatar
              src={avatarUrl || image}
              size={120}
              icon={<UserOutlined />}
              style={{ marginBottom: 16, border: '2px solid #eee' }}
            />
            <Title level={3} style={{ marginBottom: 0 }}>{name}</Title>
            <Text type="secondary">{bio}</Text>
            <div style={{ marginTop: 16 }}>
              <Statistic
                title="Đánh giá"
                value={averageRating || 0}
                prefix={<StarFilled style={{ color: '#faad14' }} />}
                suffix="⭐"
                style={{ marginBottom: 8 }}
              />
              <Statistic
                title="Tổng lịch đã cắt"
                value={totalBookings || 0}
                prefix={<ScissorOutlined />}
                style={{ marginBottom: 8 }}
              />
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Descriptions
              title="Thông tin chi tiết"
              bordered
              column={1}
              size="middle"
              labelStyle={{ width: 180, fontWeight: 500 }}
            >
              <Descriptions.Item label="Chuyên môn">
                {specialties && specialties.length > 0 ? specialties.map(s => <Tag key={s}>{s}</Tag>) : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm">{experienceYears} năm</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>
    </div>
  );
} 