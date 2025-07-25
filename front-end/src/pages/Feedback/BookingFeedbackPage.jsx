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
import { createBookingFeedback, getBookingFeedback } from '../../services/bookingFeedbackApi.js';
import { uploadImage } from '../../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BookingFeedbackPage = () => {
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

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      // Check if feedback already exists
      try {
        const existingFeedback = await getBookingFeedback(bookingId);
        if (existingFeedback.feedback) {
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
  setSubmitting(true);
  try {
    // ✅ Upload ảnh
    let uploadedImages = [];
    if (fileList.length > 0) {
      const uploadPromises = fileList.map(async (file) => {
        if (file.originFileObj) {
          try {
            const response = await uploadImage(file.originFileObj);
            return response.data.url;
          } catch (err) {
            console.error('Upload image error:', err);
            message.error('Không thể tải ảnh lên. Vui lòng thử lại.');
            return null;
          }
        }
        return file.url;
      });

      uploadedImages = (await Promise.all(uploadPromises))
        .filter(url => url !== null)
        .map(url => ({
          url,
          caption: '',
          uploadedAt: new Date()
        }));
    }

    const feedbackData = {
      bookingId,
      rating: values.rating,
      serviceQuality: values.serviceQuality,
      barberProfessionalism: values.barberProfessionalism,
      cleanliness: values.cleanliness,
      valueForMoney: values.valueForMoney,
      wouldRecommend: values.wouldRecommend,
      comment: values.comment,
      images: uploadedImages, // ✅ Đây là định dạng đúng
      isAnonymous: values.isAnonymous || false
    };

    await createBookingFeedback(feedbackData);

    message.success('Cảm ơn bạn đã đánh giá!');
    setTimeout(() => navigate('/my-booking'), 2000);
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
    message.error(errorMessage);
    console.error('Error submitting feedback:', error);
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
          <Title level={2}>Đánh giá dịch vụ</Title>
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
          onFinish={handleSubmit}
          initialValues={{
            rating: 5,
            serviceQuality: 5,
            barberProfessionalism: 5,
            cleanliness: 5,
            valueForMoney: 5,
            wouldRecommend: 5
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="rating"
                label="Đánh giá tổng thể"
                rules={[{ required: true, message: 'Vui lòng đánh giá' }]}
              >
                <Rate 
                  style={{ fontSize: 32 }}
                  character={<StarOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="serviceQuality"
                label="Chất lượng dịch vụ"
                rules={[{ required: true, message: 'Vui lòng đánh giá chất lượng dịch vụ' }]}
              >
                <Rate />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="barberProfessionalism"
                label="Tính chuyên nghiệp của thợ"
                rules={[{ required: true, message: 'Vui lòng đánh giá tính chuyên nghiệp' }]}
              >
                <Rate />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="cleanliness"
                label="Vệ sinh sạch sẽ"
                rules={[{ required: true, message: 'Vui lòng đánh giá vệ sinh' }]}
              >
                <Rate />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="valueForMoney"
                label="Giá trị so với tiền bỏ ra"
                rules={[{ required: true, message: 'Vui lòng đánh giá giá trị' }]}
              >
                <Rate />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="wouldRecommend"
                label="Bạn có giới thiệu cho bạn bè không?"
              >
                <Rate />
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
                  placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ, thợ cắt tóc, không gian..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="images"
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
                htmlType="submit" 
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

      <Alert
        message="Lưu ý"
        description="Đánh giá của bạn sẽ được hiển thị công khai và giúp khách hàng khác có thêm thông tin khi lựa chọn dịch vụ."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  );
};

export default BookingFeedbackPage;
