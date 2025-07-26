import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Alert, Descriptions, Tag } from 'antd';
import { ExclamationCircleOutlined, UserDeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

/**
 * NoShowConfirmationModal - Barber component for marking bookings as no-show
 * Includes time validation and customer details confirmation
 */
const NoShowConfirmationModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  booking, 
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await onConfirm({
        note: values.note || null
      });

      toast.success('👤 Đã đánh dấu khách hàng không đến', {
        position: "top-right",
        autoClose: 3000,
      });

      form.resetFields();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        toast.error('❌ Vui lòng kiểm tra thông tin đã nhập', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        // API error
        toast.error(`❌ Lỗi đánh dấu không đến: ${error.message || 'Vui lòng thử lại sau'}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!booking) return null;

  // Calculate time information
  const now = dayjs();
  const bookingTime = dayjs(booking.bookingDate);
  const bookingEnd = bookingTime.add(booking.durationMinutes || booking.serviceId?.durationMinutes || 60, 'minute');
  const isBookingStarted = now.isAfter(bookingTime);
  const isBookingEnded = now.isAfter(bookingEnd);
  const minutesFromStart = now.diff(bookingTime, 'minute');

  // Time status for display
  const getTimeStatus = () => {
    if (isBookingEnded) {
      return {
        type: 'error',
        text: `Đã quá ${Math.abs(minutesFromStart - (booking.durationMinutes || 60))} phút`,
        color: '#ff4d4f'
      };
    } else if (isBookingStarted) {
      return {
        type: 'warning',
        text: `Đã bắt đầu ${minutesFromStart} phút`,
        color: '#faad14'
      };
    } else {
      return {
        type: 'info',
        text: `Còn ${Math.abs(minutesFromStart)} phút nữa`,
        color: '#1890ff'
      };
    }
  };

  const timeStatus = getTimeStatus();

  return (
    <Modal
      title={
        <Space>
          <UserDeleteOutlined style={{ color: '#ff4d4f' }} />
          <span>Đánh dấu không đến</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ marginBottom: 24 }}>
        <Alert
          message="Xác nhận khách hàng không đến"
          description="Việc đánh dấu không đến sẽ được ghi nhận vào hồ sơ khách hàng và không thể hoàn tác."
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Time Status Alert */}
        <Alert
          message={
            <Space>
              <ClockCircleOutlined />
              <span>Trạng thái thời gian: {timeStatus.text}</span>
            </Space>
          }
          type={timeStatus.type}
          style={{ marginBottom: 16 }}
        />

        <Title level={5}>Thông tin lịch hẹn</Title>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Khách hàng">
            <Space>
              <Text strong>{booking.customerName || booking.customerId?.name}</Text>
              <Tag color="blue">ID: {booking.customerId?._id || booking.customerId}</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            <Text copyable>
              {booking.customerPhone || booking.customerId?.phone || 'Không có'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <Text copyable>
              {booking.customerEmail || booking.customerId?.email || 'Không có'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Dịch vụ">
            <Space>
              <Text strong>{booking.serviceId?.name}</Text>
              <Tag color="green">
                {booking.serviceId?.price?.toLocaleString('vi-VN')}đ
              </Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian đặt">
            <Space direction="vertical" size={0}>
              <Text strong>
                {bookingTime.format('dddd, DD/MM/YYYY')}
              </Text>
              <Text strong style={{ color: timeStatus.color }}>
                {bookingTime.format('HH:mm')} - {bookingEnd.format('HH:mm')}
              </Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Thời lượng">
            {booking.durationMinutes || booking.serviceId?.durationMinutes} phút
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian hiện tại">
            <Text type="secondary">
              {now.format('HH:mm DD/MM/YYYY')}
            </Text>
          </Descriptions.Item>
          {booking.note && (
            <Descriptions.Item label="Ghi chú booking">
              <Text italic>{booking.note}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="note"
          label="Ghi chú về việc không đến (tùy chọn)"
          extra="Thông tin này sẽ được lưu vào hồ sơ khách hàng"
        >
          <TextArea
            rows={3}
            placeholder="Ví dụ: Khách hàng không đến và không thông báo trước..."
            maxLength={300}
            showCount
          />
        </Form.Item>

        <div style={{ 
          background: '#fff2e8', 
          border: '1px solid #ffbb96', 
          borderRadius: 6, 
          padding: 12, 
          marginBottom: 16 
        }}>
          <Text strong style={{ color: '#d46b08' }}>
            ⚠️ Lưu ý: Sau khi xác nhận, lịch hẹn sẽ được đánh dấu là "Không đến" và thời gian này sẽ được giải phóng cho khách hàng khác đặt lịch.
          </Text>
        </div>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleCancel}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button 
              type="primary" 
              danger
              htmlType="submit"
              loading={submitting || loading}
              icon={<UserDeleteOutlined />}
            >
              Xác nhận không đến
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NoShowConfirmationModal;
