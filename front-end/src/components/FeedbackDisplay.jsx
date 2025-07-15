import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Rate,
  Avatar,
  List,
  Tag,
  Button,
  Space,
  Progress,
  Row,
  Col,
  Image,
  Divider,
  Empty,
  Spin,
  message
} from 'antd';
import {
  UserOutlined,
  LikeOutlined,
  DislikeOutlined,
  CalendarOutlined,
  StarOutlined
} from '@ant-design/icons';
import { getBarberFeedback, getServiceFeedback, markFeedbackHelpful } from '../services/bookingFeedbackApi.js';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const FeedbackDisplay = ({ type, targetId, showStats = true, limit = 10 }) => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: limit,
    total: 0
  });

  useEffect(() => {
    if (targetId) {
      loadFeedback();
    }
  }, [targetId, type]);

  const loadFeedback = async (page = 1) => {
    setLoading(true);
    try {
      let response;
      const filters = {
        page,
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (type === 'barber') {
        response = await getBarberFeedback(targetId, filters);
      } else if (type === 'service') {
        response = await getServiceFeedback(targetId, filters);
      }

      setFeedback(response.feedback || []);
      setStats(response.stats || null);
      setPagination(response.pagination || pagination);

    } catch (error) {
      console.error('Error loading feedback:', error);
      message.error('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulClick = async (feedbackId, isHelpful) => {
    try {
      await markFeedbackHelpful(feedbackId, isHelpful);
      message.success('Cảm ơn phản hồi của bạn!');
      // Reload feedback to get updated counts
      loadFeedback(pagination.current);
    } catch (error) {
      message.error('Không thể gửi phản hồi');
    }
  };

  const renderRatingDistribution = () => {
    if (!stats?.ratingDistribution) return null;

    const total = stats.totalReviews;
    const distribution = stats.ratingDistribution;

    return (
      <div>
        <Title level={5}>Phân bố đánh giá</Title>
        {[5, 4, 3, 2, 1].map(rating => (
          <Row key={rating} align="middle" style={{ marginBottom: 8 }}>
            <Col span={3}>
              <Space>
                <span>{rating}</span>
                <StarOutlined style={{ color: '#faad14' }} />
              </Space>
            </Col>
            <Col span={15}>
              <Progress
                percent={total > 0 ? (distribution[rating] / total) * 100 : 0}
                showInfo={false}
                strokeColor="#faad14"
              />
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Text type="secondary">({distribution[rating] || 0})</Text>
            </Col>
          </Row>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    if (!showStats || !stats) return null;

    return (
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#faad14' }}>
                {stats.averageRating?.toFixed(1) || '0.0'}
              </div>
              <Rate disabled value={stats.averageRating || 0} style={{ fontSize: 16 }} />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">{stats.totalReviews || 0} đánh giá</Text>
              </div>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            {renderRatingDistribution()}
          </Col>

          {type === 'barber' && (
            <Col xs={24} md={8}>
              <Title level={5}>Đánh giá chi tiết</Title>
              <div style={{ marginBottom: 8 }}>
                <Text>Chất lượng dịch vụ: </Text>
                <Rate disabled value={stats.averageServiceQuality || 0} style={{ fontSize: 12 }} />
                <Text type="secondary"> ({(stats.averageServiceQuality || 0).toFixed(1)})</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text>Tính chuyên nghiệp: </Text>
                <Rate disabled value={stats.averageBarberProfessionalism || 0} style={{ fontSize: 12 }} />
                <Text type="secondary"> ({(stats.averageBarberProfessionalism || 0).toFixed(1)})</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text>Vệ sinh sạch sẽ: </Text>
                <Rate disabled value={stats.averageCleanliness || 0} style={{ fontSize: 12 }} />
                <Text type="secondary"> ({(stats.averageCleanliness || 0).toFixed(1)})</Text>
              </div>
              <div>
                <Text>Giá trị tiền bỏ ra: </Text>
                <Rate disabled value={stats.averageValueForMoney || 0} style={{ fontSize: 12 }} />
                <Text type="secondary"> ({(stats.averageValueForMoney || 0).toFixed(1)})</Text>
              </div>
            </Col>
          )}
        </Row>
      </Card>
    );
  };

  const renderFeedbackItem = (item) => (
    <List.Item key={item._id}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              icon={<UserOutlined />} 
              style={{ marginRight: 12 }}
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>
                {item.isAnonymous ? 'Khách hàng ẩn danh' : item.customerId?.name || 'Khách hàng'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                <CalendarOutlined /> {dayjs(item.createdAt).format('DD/MM/YYYY')}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Rate disabled value={item.rating} style={{ fontSize: 14 }} />
            <div style={{ fontSize: 12, color: '#666' }}>
              {item.rating}/5 sao
            </div>
          </div>
        </div>

        {/* Service info for barber feedback */}
        {type === 'barber' && item.serviceId && (
          <div style={{ marginBottom: 12 }}>
            <Tag color="blue">{item.serviceId.name}</Tag>
            <Tag color="green">{item.serviceId.price?.toLocaleString()} đ</Tag>
          </div>
        )}

        {/* Detailed ratings */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chất lượng: <Rate disabled value={item.serviceQuality} style={{ fontSize: 10 }} />
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chuyên nghiệp: <Rate disabled value={item.barberProfessionalism} style={{ fontSize: 10 }} />
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Vệ sinh: <Rate disabled value={item.cleanliness} style={{ fontSize: 10 }} />
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Giá trị: <Rate disabled value={item.valueForMoney} style={{ fontSize: 10 }} />
            </Text>
          </Col>
        </Row>

        {/* Comment */}
        <Paragraph style={{ marginBottom: 12 }}>
          {item.comment}
        </Paragraph>

        {/* Images */}
        {item.images && item.images.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Image.PreviewGroup>
              {item.images.map((image, index) => (
                <Image
                  key={index}
                  width={60}
                  height={60}
                  src={image.url}
                  style={{ marginRight: 8, objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </Image.PreviewGroup>
          </div>
        )}

        {/* Business response */}
        {item.businessResponse && (
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 12, 
            borderRadius: 4, 
            marginBottom: 12 
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
              Phản hồi từ cửa hàng:
            </div>
            <div>{item.businessResponse.message}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {dayjs(item.businessResponse.respondedAt).format('DD/MM/YYYY HH:mm')}
            </div>
          </div>
        )}

        {/* Helpful buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              size="small"
              icon={<LikeOutlined />}
              onClick={() => handleHelpfulClick(item._id, true)}
            >
              Hữu ích ({item.helpfulVotes || 0})
            </Button>
            <Button
              size="small"
              icon={<DislikeOutlined />}
              onClick={() => handleHelpfulClick(item._id, false)}
            >
              Không hữu ích ({item.unhelpfulVotes || 0})
            </Button>
          </Space>
          
          {item.wouldRecommend >= 4 && (
            <Tag color="green">Sẽ giới thiệu</Tag>
          )}
        </div>
      </div>
    </List.Item>
  );

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div>
      {renderStats()}
      
      <Card title={`Đánh giá (${pagination.total || 0})`}>
        {feedback.length === 0 ? (
          <Empty 
            description="Chưa có đánh giá nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={feedback}
            renderItem={renderFeedbackItem}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: loadFeedback,
              showSizeChanger: false,
              showQuickJumper: false
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default FeedbackDisplay;
