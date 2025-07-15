import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  List,
  Rate,
  Tag,
  Button,
  Space,
  Avatar,
  Descriptions,
  Modal,
  message,
  Empty,
  Spin,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { getCustomerFeedback, updateBookingFeedback } from '../../services/bookingFeedbackApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MyFeedbackPage = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getCustomerFeedback({
        page,
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      setFeedback(response.feedback || []);
      setPagination(response.pagination || pagination);

    } catch (error) {
      console.error('Error loading feedback:', error);
      message.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setDetailModalVisible(true);
  };

  const canEditFeedback = (feedbackItem) => {
    const daysSinceSubmission = dayjs().diff(dayjs(feedbackItem.createdAt), 'day');
    return daysSinceSubmission <= 7 && feedbackItem.status === 'pending';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'approved': 'green',
      'rejected': 'red',
      'hidden': 'gray'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Đang chờ duyệt',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối',
      'hidden': 'Đã ẩn'
    };
    return texts[status] || status;
  };

  const renderFeedbackItem = (item) => (
    <List.Item
      key={item._id}
      actions={[
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(item)}
        >
          Chi tiết
        </Button>,
        canEditFeedback(item) && (
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              // Navigate to edit feedback page
              // This would need to be implemented
              message.info('Tính năng chỉnh sửa đang được phát triển');
            }}
          >
            Chỉnh sửa
          </Button>
        )
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>
                  {item.serviceId?.name || 'Dịch vụ'}
                </span>
                <Rate disabled value={item.rating} style={{ marginLeft: 8, fontSize: 14 }} />
              </div>
              <Tag color={getStatusColor(item.status)}>
                {getStatusText(item.status)}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              <CalendarOutlined /> {dayjs(item.bookingId?.bookingDate || item.createdAt).format('DD/MM/YYYY')}
              {' • '}Thợ: {item.barberId?.userId?.name || 'N/A'}
            </div>
          </div>
        }
        description={
          <div>
            <div style={{ marginBottom: 8 }}>
              {item.comment.length > 100 
                ? `${item.comment.substring(0, 100)}...` 
                : item.comment
              }
            </div>
            <Row gutter={[8, 4]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Chất lượng: <Rate disabled value={item.serviceQuality} style={{ fontSize: 10 }} />
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Chuyên nghiệp: <Rate disabled value={item.barberProfessionalism} style={{ fontSize: 10 }} />
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Vệ sinh: <Rate disabled value={item.cleanliness} style={{ fontSize: 10 }} />
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Giá trị: <Rate disabled value={item.valueForMoney} style={{ fontSize: 10 }} />
                </Text>
              </Col>
            </Row>
            {item.wouldRecommend >= 4 && (
              <Tag color="green" size="small" style={{ marginTop: 8 }}>
                Sẽ giới thiệu
              </Tag>
            )}
          </div>
        }
      />
    </List.Item>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Title level={2}>
        <StarOutlined /> Đánh giá của tôi
      </Title>

      <Card>
        {feedback.length === 0 ? (
          <Empty 
            description="Bạn chưa có đánh giá nào"
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
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} đánh giá`
            }}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết đánh giá"
        visible={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedFeedback(null);
        }}
        footer={[
          <Button 
            key="close" 
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedFeedback(null);
            }}
          >
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedFeedback && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Dịch vụ">
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedFeedback.serviceId?.name}
                  </div>
                  <div>Giá: {selectedFeedback.serviceId?.price?.toLocaleString()} đ</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Thợ cắt tóc">
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedFeedback.barberId?.userId?.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {selectedFeedback.barberId?.specialties?.join(', ')}
                  </div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian đặt lịch">
                {dayjs(selectedFeedback.bookingId?.bookingDate).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Đánh giá tổng thể">
                <Rate disabled value={selectedFeedback.rating} />
                <span style={{ marginLeft: 8 }}>{selectedFeedback.rating}/5 sao</span>
              </Descriptions.Item>
              <Descriptions.Item label="Đánh giá chi tiết">
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <div>Chất lượng dịch vụ:</div>
                    <Rate disabled value={selectedFeedback.serviceQuality} style={{ fontSize: 14 }} />
                  </Col>
                  <Col span={12}>
                    <div>Tính chuyên nghiệp:</div>
                    <Rate disabled value={selectedFeedback.barberProfessionalism} style={{ fontSize: 14 }} />
                  </Col>
                  <Col span={12}>
                    <div>Vệ sinh sạch sẽ:</div>
                    <Rate disabled value={selectedFeedback.cleanliness} style={{ fontSize: 14 }} />
                  </Col>
                  <Col span={12}>
                    <div>Giá trị tiền bỏ ra:</div>
                    <Rate disabled value={selectedFeedback.valueForMoney} style={{ fontSize: 14 }} />
                  </Col>
                </Row>
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ giới thiệu">
                <Rate disabled value={selectedFeedback.wouldRecommend} />
                {selectedFeedback.wouldRecommend >= 4 && (
                  <Tag color="green" style={{ marginLeft: 8 }}>Sẽ giới thiệu</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Nhận xét">
                {selectedFeedback.comment}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(selectedFeedback.status)}>
                  {getStatusText(selectedFeedback.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đánh giá">
                {dayjs(selectedFeedback.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {selectedFeedback.helpfulVotes > 0 && (
                <Descriptions.Item label="Phản hồi">
                  {selectedFeedback.helpfulVotes} người thấy hữu ích
                  {selectedFeedback.unhelpfulVotes > 0 && 
                    `, ${selectedFeedback.unhelpfulVotes} người thấy không hữu ích`
                  }
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedFeedback.businessResponse && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Phản hồi từ cửa hàng:</Title>
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4 
                }}>
                  <div>{selectedFeedback.businessResponse.message}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                    {dayjs(selectedFeedback.businessResponse.respondedAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyFeedbackPage;
