// src/pages/feedback/FeedbackBarber.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById, getFeedbacksByBarber, createBarberFeedback, uploadImage, updateFeedbackBooking } from '../../services/api';
import {
  Spin, Alert, Button, Typography, Tag, List, Avatar, Form, Rate, Input, Upload,
  Card, Divider
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import './FeedbackBarber.css';

// Bootstrap Toast
import 'bootstrap/dist/css/bootstrap.min.css';

const { Title, Text, Paragraph } = Typography;

const getStatusTag = (status) => {
  switch (status) {
    case 'pending': return <Tag color="gold">Chờ xác nhận</Tag>;
    case 'confirmed': return <Tag color="blue">Đã xác nhận</Tag>;
    case 'cancelled': return <Tag color="red">Đã hủy</Tag>;
    case 'completed': return <Tag color="green">Hoàn thành</Tag>;
    case 'no_show': return <Tag color="orange">Không đến</Tag>;
    default: return <Tag>{status}</Tag>;
  }
};

const FeedbackBarber = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingReviews, setExistingReviews] = useState([]);
  const [form] = Form.useForm();
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const showToast = (variant, message) => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await getBookingById(bookingId);
      const { booking: bookingData } = response.data.data;
      setBooking(bookingData);

      const reviewPromises = [getFeedbacksByBarber(bookingData.barberId).then(res => ({
        barberId: bookingData.barberId,
        reviews: res.data.data
      }))];
      const reviewsData = await Promise.all(reviewPromises);
      setExistingReviews(reviewsData);
    } catch (err) {
      setError('Không thể tải chi tiết booking. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const handleSubmitFeedback = async (values) => {
    try {
      const barberId = booking.barberId;
      const fieldPrefix = `feedback_${barberId}`;
      const rating = values[`${fieldPrefix}_rating`];
      const comment = values[`${fieldPrefix}_comment`];
      const images = values[`${fieldPrefix}_images`] || [];

      if (!rating || existingReviews.find(r => r.barberId === barberId)?.reviews.some(r => r.customerId === booking.customerId)) {
        return null;
      }

      let uploadedImages = [];
      if (images.length > 0) {
        const uploadPromises = images.map(async (file) => {
          if (file.originFileObj) {
            const response = await uploadImage(file.originFileObj);
            return response.data.url;
          }
          return null;
        });
        uploadedImages = await Promise.all(uploadPromises);
        uploadedImages = uploadedImages.filter(url => url !== null);
      }

      const feedbackData = {
        bookingId: booking._id,
        barberId,
        customerId: booking.customerId,
        rating,
        comment: comment || '',
        images: uploadedImages
      };

      const response = await createBarberFeedback(feedbackData);
      await updateFeedbackBooking(bookingId, { status: true });

      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('success', 'Đánh giá đã được gửi thành công!');
      setTimeout(() => navigate('/my-bookings'), 2000);
    } catch (err) {
      console.error('Lỗi gửi đánh giá:', err);
      showToast('danger', 'Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại!');
    }
  };

  if (loading) {
    return <div className="spinner-container"><Spin size="large" /></div>;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  if (!booking) {
    return <Alert message="Không tìm thấy booking." type="warning" showIcon />;
  }

  return (
    <div className="order-success-container">
      <div className="order-success-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/my-bookings')}
          className="back-button"
        >
          Quay lại danh sách booking
        </Button>
      </div>

      <div className="order-success-content">
        <Card className="success-card">
          <Title level={3} style={{ color: '#52c41a', marginBottom: 0 }}>Đánh giá barber</Title>
          <Paragraph style={{ marginBottom: 0 }}>Vui lòng đánh giá barber của bạn!</Paragraph>
        </Card>

        <Card title="Thông tin booking" className="order-info-card">
          <div className="order-info-content">
            <div className="order-id-section">
              <div className="order-id-display">
                <Text strong>Mã booking:</Text>
                <div className="order-id-container">
                  <Text code className="order-id">{booking._id}</Text>
                </div>
              </div>
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-item">
                <Text>Trạng thái booking:</Text>
                {getStatusTag(booking.status)}
              </div>
              <div className="summary-item">
                <Text>Barber:</Text>
                <Text>{booking.barberId?.name || 'Chưa xác định'}</Text>
              </div>
              <div className="summary-item">
                <Text>Dịch vụ:</Text>
                <Text>{booking.serviceId?.name || 'Chưa xác định'}</Text>
              </div>
              <div className="summary-item">
                <Text>Ngày đặt:</Text>
                <Text>{new Date(booking.bookingDate).toLocaleString('vi-VN')}</Text>
              </div>
              <div className="summary-item">
                <Text>Thời lượng:</Text>
                <Text>{booking.durationMinutes} phút</Text>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Đánh giá barber" className="order-info-card">
          <Form
            form={form}
            onFinish={handleSubmitFeedback}
            layout="vertical"
            className="feedback-form"
          >
            <List
              itemLayout="horizontal"
              dataSource={[{ barberId: booking.barberId }]}
              renderItem={(item) => {
                const hasReview = existingReviews.find(r => r.barberId === item.barberId)?.reviews.some(r => r.customerId === booking.customerId);
                const fieldPrefix = `feedback_${item.barberId}`;

                return (
                  <List.Item className="feedback-item">
                    <div className="product-info-row">
                      <List.Item.Meta
                        avatar={<Avatar src={booking.barberId?.avatar || '/default-avatar.png'} />}
                        title={<span className="item-name">{booking.barberId?.name || 'Barber chưa xác định'}</span>}
                      />
                    </div>
                    {!hasReview && (
                      <div className="feedback-fields">
                        <Form.Item
                          name={`${fieldPrefix}_rating`}
                          label="Đánh giá"
                          rules={[{ required: true, message: 'Vui lòng chọn số sao!' }]}
                        >
                          <Rate className="custom-rate" />
                        </Form.Item>
                        <Form.Item
                          name={`${fieldPrefix}_comment`}
                          label="Bình luận"
                        >
                          <Input.TextArea rows={4} placeholder="Nhập bình luận của bạn" />
                        </Form.Item>
                        <Form.Item
                          name={`${fieldPrefix}_images`}
                          label="Hình ảnh"
                          valuePropName="fileList"
                          getValueFromEvent={(e) => {
                            if (Array.isArray(e)) {
                              return e;
                            }
                            return e && e.fileList;
                          }}
                        >
                          <Upload
                            listType="picture"
                            beforeUpload={() => false}
                            maxCount={3}
                          >
                            <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
                          </Upload>
                        </Form.Item>
                      </div>
                    )}
                    {hasReview && <Text style={{ color: '#52c41a', marginTop: 10 }}>Đã đánh giá</Text>}
                  </List.Item>
                );
              }}
            />
            <Form.Item>
              <Button type="primary" htmlType="submit" className="submit-feedback-btn">
                Gửi đánh giá
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Toast Notification */}
        <div
          className="position-fixed"
          style={{ top: '4rem', right: '1rem', zIndex: 1060 }}
        >
          {toast.show && (
            <div className={`toast align-items-center text-bg-${toast.variant} border-0 show`}>
              <div className="d-flex">
                <div className="toast-body">{toast.message}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  aria-label="Close"
                  onClick={() => setToast(t => ({ ...t, show: false }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackBarber;