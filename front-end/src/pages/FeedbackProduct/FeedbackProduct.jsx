// FeedbackProduct.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, getFeedbacksByProduct, createFeedback, uploadImage, updateFeedbackOrder } from '../../services/api';
import {
  Spin, Alert, Button, Typography, Tag, List, Avatar, Form, Rate, Input, Upload,
  Card, Divider
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import './FeedbackProduct.css';

// Bootstrap Toast
import 'bootstrap/dist/css/bootstrap.min.css';

const { Title, Text, Paragraph } = Typography;

const getStatusTag = (status) => {
  switch (status) {
    case 'pending': return <Tag color="gold">Chờ xác nhận</Tag>;
    case 'processing': return <Tag color="blue">Đang xử lý</Tag>;
    case 'shipped': return <Tag color="cyan">Đang giao</Tag>;
    case 'delivered': return <Tag color="green">Đã giao</Tag>;
    case 'cancelled': return <Tag color="red">Đã hủy</Tag>;
    default: return <Tag>{status}</Tag>;
  }
};

const FeedbackProduct = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingReviews, setExistingReviews] = useState([]);
  const [form] = Form.useForm();
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const showToast = (variant, message) => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(orderId);
      const { order: orderData, items, payment } = response.data.data;
      setOrder({ ...orderData, items, payment });

      const reviewPromises = items.map(item =>
        getFeedbacksByProduct(item.productId).then(res => ({
          productId: item.productId,
          reviews: res.data.data
        }))
      );
      const reviewsData = await Promise.all(reviewPromises);
      setExistingReviews(reviewsData);
    } catch (err) {
      setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleSubmitFeedback = async (values) => {
    try {
      const feedbackPromises = order.items.map(async (item) => {
        const productId = item.productId;
        const fieldPrefix = `feedback_${productId}`;
        const rating = values[`${fieldPrefix}_rating`];
        const comment = values[`${fieldPrefix}_comment`];
        const images = values[`${fieldPrefix}_images`] || [];

        if (!rating || existingReviews.find(r => r.productId === productId)?.reviews.some(r => r.userId === order.userId)) {
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
          userId: order.userId,
          productId,
          rating,
          comment: comment || '',
          images: uploadedImages
        };

        const response = await createFeedback(feedbackData);
        return response.data.data;
      });

      const results = await Promise.all(feedbackPromises);
      const successfulFeedbacks = results.filter(result => result !== null);

      if (successfulFeedbacks.length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('success', 'Đánh giá đã được gửi thành công!');
        await updateFeedbackOrder(orderId, { status: true }); // Cập nhật status sau khi gửi feedback
        setTimeout(() => navigate('/my-orders'), 2000);
      } else {
        throw new Error('Không có đánh giá nào được gửi.');
      }
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

  if (!order) {
    return <Alert message="Không tìm thấy đơn hàng." type="warning" showIcon />;
  }

  return (
    <div className="order-success-container">
      <div className="order-success-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/orders/${orderId}`)}
          className="back-button"
        >
          Quay lại chi tiết đơn hàng
        </Button>
      </div>

      <div className="order-success-content">
        <Card className="success-card">
          <Title level={3} style={{ color: '#52c41a', marginBottom: 0 }}>Đánh giá sản phẩm</Title>
          <Paragraph style={{ marginBottom: 0 }}>Vui lòng đánh giá các sản phẩm trong đơn hàng của bạn!</Paragraph>
        </Card>

        <Card title="Thông tin đơn hàng" className="order-info-card">
          <div className="order-info-content">
            <div className="order-id-section">
              <div className="order-id-display">
                <Text strong>Mã đơn hàng:</Text>
                <div className="order-id-container">
                  <Text code className="order-id">{order.orderCode}</Text>
                </div>
              </div>
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-item">
                <Text>Trạng thái đơn hàng:</Text>
                {getStatusTag(order.status)}
              </div>
              <div className="summary-item">
                <Text>Phương thức thanh toán:</Text>
                <Text>{order.payment?.method?.toUpperCase() === 'CASH' ? 'Thanh toán khi nhận hàng' : (order.payment?.method?.toUpperCase() || 'N/A')}</Text>
              </div>
              <div className="summary-item">
                <Text>Trạng thái thanh toán:</Text>
                <Tag>{order.payment?.status?.toUpperCase() || 'N/A'}</Tag>
              </div>
              <div className="summary-item">
                <Text>Tên người nhận:</Text>
                <Text>{order.customerName}</Text>
              </div>
              <div className="summary-item">
                <Text>Số điện thoại:</Text>
                <Text>{order.customerPhone}</Text>
              </div>
              <div className="summary-item">
                <Text>Địa chỉ giao hàng:</Text>
                <Text>{order.shippingAddress}</Text>
              </div>
              <div className="summary-item">
                <Text>Ngày đặt:</Text>
                <Text>{new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Đánh giá sản phẩm" className="order-info-card">
          <Form
            form={form}
            onFinish={handleSubmitFeedback}
            layout="vertical"
            className="feedback-form"
          >
            <List
              itemLayout="horizontal"
              dataSource={order.items}
              renderItem={(item) => {
                const hasReview = existingReviews.find(r => r.productId === item.productId)?.reviews.some(r => r.userId === order.userId);
                const fieldPrefix = `feedback_${item.productId}`;

                return (
                  <List.Item className="feedback-item">
                    <div className="product-info-row">
                      <List.Item.Meta
                        avatar={item.productImage && <Avatar src={item.productImage} />}
                        title={<span className="item-name">{item.productName}</span>}
                        description={<span>Số lượng: {item.quantity}</span>}
                      />
                      <div className="price-details">
                        <Text>Đơn giá: {item.unitPrice.toLocaleString('vi-VN')} VND</Text>
                        <br />
                        <Text strong>Tổng: {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} VND</Text>
                      </div>
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

export default FeedbackProduct;