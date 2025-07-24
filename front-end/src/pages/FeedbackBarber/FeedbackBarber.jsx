import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Rate,
  Input,
  Button,
  Upload,
  message,
  Row,
  Col,
  Descriptions,
  Tag,
  Space,
  Avatar,
  Divider,
  Alert
} from 'antd';
import {
  StarOutlined,
  CameraOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyBookings } from '../../services/serviceApi.js';
import { createBarberFeedback, getBarberFeedbackById } from '../../services/api.js';
import { uploadImage } from '../../services/api.js';
import dayjs from 'dayjs';
import './FeedbackBarber.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FeedbackBarber = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const showToast = (variant, message) => {
  setToast({ show: true, message, variant });
  setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
};

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      // Check if feedback already exists
      try {
        const response = await getBarberFeedbackById(bookingId);
        if (response.data) {
          message.info('Bạn đã đánh giá cho lịch hẹn này rồi');
          navigate('/my-booking');
          return;
        }
      } catch (error) {
        // Feedback doesn't exist, continue with loading booking
      }

      // Load booking details from my bookings
      const response = await getMyBookings();
      const bookings = response.bookings || response;
      const currentBooking = bookings.find(b => b._id === bookingId);

      if (!currentBooking) {
        message.error('Không tìm thấy thông tin đặt lịch');
        navigate('/my-booking');
        return;
      }

      if (currentBooking.status !== 'completed') {
        message.error('Chỉ có thể đánh giá những lịch hẹn đã hoàn thành');
        navigate('/my-booking');
        return;
      }

      setBooking(currentBooking);
    } catch (error) {
      message.error('Không thể tải thông tin đặt lịch');
      console.error('Error loading booking:', error);
      navigate('/my-booking');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
  console.log('🔥 Form submitted values:', values);
  console.log('👤 user:', user);

  setSubmitting(true);

  const resolvedBarberId = booking?.barberId?._id || booking?.barberId;
  const customerId = user?.id || user?._id;

  if (!bookingId || !resolvedBarberId || !customerId) {
    console.warn('bookingId:', bookingId);
    console.warn('barberId:', resolvedBarberId);
    console.warn('customerId:', customerId);
    showToast('danger', 'Thiếu thông tin booking, barber hoặc người dùng');
    setSubmitting(false);
    return;
  }

  try {
    // Upload ảnh
    let uploadedImages = [];
    if (fileList.length > 0) {
      const uploadPromises = fileList.map(async (file) => {
        if (file.originFileObj) {
          try {
            const response = await uploadImage(file.originFileObj);
            return response.data.url;
          } catch (err) {
            console.error('Upload image error:', err);
            showToast('danger', 'Không thể tải ảnh lên. Vui lòng thử lại.');
            return null;
          }
        }
        return file.url;
      });

      uploadedImages = await Promise.all(uploadPromises);
      uploadedImages = uploadedImages.filter(url => url !== null);
    }

    const feedbackData = {
      bookingId,
      barberId: resolvedBarberId,
      customerId,
      rating: values.rating,
      comment: values.comment.trim(),
      images: uploadedImages
    };

    console.log('📤 Sending feedback data:', feedbackData);

    const response = await createBarberFeedback(feedbackData);

    console.log('✅ Feedback API response:', response);

    showToast('success', 'Cảm ơn bạn đã đánh giá!');
    setTimeout(() => navigate('/my-booking'), 2000);
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại.';
    console.error('❌ Submit feedback error:', error);
    showToast('danger', errorMessage);
  } finally {
    setSubmitting(false);
  }
};

  const handleImageUpload = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Title level={3}>Đang tải...</Title>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Title level={3}>Không tìm thấy thông tin đặt lịch</Title>
        <Button type="primary" onClick={() => navigate('/my-booking')}>
          Quay lại danh sách đặt lịch
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <CheckCircleOutlined 
            style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} 
          />
          <Title level={2}>Đánh giá thợ cắt tóc</Title>
          <Text type="secondary">
            Chia sẻ trải nghiệm của bạn để giúp chúng tôi cải thiện dịch vụ
          </Text>
        </div>

        {/* Booking Information */}
        <Card 
          title="Thông tin đặt lịch" 
          style={{ marginBottom: 24 }}
          size="small"
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Dịch vụ">
              <div>
                <div style={{ fontWeight: 'bold' }}>{booking.serviceId.name}</div>
                <div style={{ color: '#666' }}>{booking.serviceId.description}</div>
                <Tag color="blue">{booking.serviceId.price.toLocaleString()} đ</Tag>
                <Tag color="green">{booking.serviceId.durationMinutes} phút</Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Thợ cắt tóc">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{booking.barberId.userId.name}</div>
                  <Rate disabled defaultValue={booking.barberId.averageRating} style={{ fontSize: 12 }} />
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {booking.barberId.specialties.join(', ')}
                  </div>
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              <div>
                <CalendarOutlined /> {dayjs(booking.bookingDate).format('DD/MM/YYYY HH:mm')}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color="green">Hoàn thành</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Feedback Form */}
        <Form
  form={form}
  layout="vertical"
  onFinish={(values) => {
    console.log('🔥 Form submitted:', values);
    handleSubmit(values); // Gọi xử lý submit chính
  }}
  initialValues={{ rating: 5, comment: '' }}
>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="rating"
                label="Đánh giá tổng thể"
                rules={[{ required: true, message: 'Vui lòng chọn số sao!' }]}
              >
                <Rate 
                  style={{ fontSize: 32 }}
                  character={<StarOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="comment"
                label="Nhận xét chi tiết"
                rules={[{ required: true, message: 'Vui lòng để lại nhận xét' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Chia sẻ trải nghiệm của bạn về thợ cắt tóc, chất lượng dịch vụ..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Hình ảnh (tùy chọn)"
              >
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleImageUpload}
                  beforeUpload={() => false} // Prevent auto upload
                  maxCount={5}
                >
                  {fileList.length >= 5 ? null : uploadButton}
                </Upload>
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Bạn có thể tải lên tối đa 5 hình ảnh để minh họa cho đánh giá
              </Text>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button 
                onClick={() => navigate('/my-booking')}
                size="large"
              >
                Hủy bỏ
              </Button>
              <Button 
  type="primary"
  onClick={() => form.submit()} // <-- dùng submit thủ công
  loading={submitting}
  size="large"
  icon={<StarOutlined />}
>
  Gửi đánh giá
</Button>

            </Space>
          </div>
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

      <Alert
        message="Lưu ý"
        description="Đánh giá của bạn sẽ được hiển thị công khai sau khi được phê duyệt và giúp khách hàng khác có thêm thông tin khi lựa chọn thợ cắt tóc."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  );
};


export default FeedbackBarber;