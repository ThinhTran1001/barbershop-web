import React, { useState } from 'react';
import { Modal, Form, Select, Input, Button, Space, Typography, Alert, Descriptions } from 'antd';
import { ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

/**
 * BookingRejectionModal - Admin component for rejecting bookings
 * Provides reason selection and confirmation for booking rejection
 */
const BookingRejectionModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  booking, 
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const rejectionReasons = [
    { value: 'barber_unavailable', label: 'Thợ cắt tóc không có sẵn' },
    { value: 'service_not_available', label: 'Dịch vụ không khả dụng' },
    { value: 'customer_request', label: 'Yêu cầu của khách hàng' },
    { value: 'other', label: 'Lý do khác' }
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await onConfirm({
        reason: values.reason,
        note: values.note || null
      });

      toast.success('🚫 Đã từ chối lịch hẹn thành công', {
        position: "top-right",
        autoClose: 3000,
      });

      form.resetFields();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        toast.error('❌ Vui lòng điền đầy đủ thông tin bắt buộc', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        // API error
        toast.error(`❌ Lỗi từ chối lịch hẹn: ${error.message || 'Vui lòng thử lại sau'}`, {
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

  return (
    <Modal
      title={
        <Space>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>Từ chối lịch hẹn</span>
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
          message="Cảnh báo"
          description="Việc từ chối lịch hẹn sẽ không thể hoàn tác. Khách hàng sẽ nhận được thông báo về việc từ chối này."
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Title level={5}>Thông tin lịch hẹn</Title>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Khách hàng">
            <Text strong>{booking.customerName || booking.customerId?.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {booking.customerPhone || booking.customerId?.phone || 'Không có'}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {booking.customerEmail || booking.customerId?.email || 'Không có'}
          </Descriptions.Item>
          <Descriptions.Item label="Dịch vụ">
            <Text strong>{booking.serviceId?.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            <Text strong>
              {new Date(booking.bookingDate).toLocaleString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Thời lượng">
            {booking.durationMinutes || booking.serviceId?.durationMinutes} phút
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái hiện tại">
            <Text type={booking.status === 'pending' ? 'warning' : 'success'}>
              {booking.status === 'pending' ? 'Chờ xác nhận' : 'Đã xác nhận'}
            </Text>
          </Descriptions.Item>
          {booking.note && (
            <Descriptions.Item label="Ghi chú">
              {booking.note}
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
          name="reason"
          label="Lý do từ chối"
          rules={[
            { required: true, message: 'Vui lòng chọn lý do từ chối' }
          ]}
        >
          <Select
            placeholder="Chọn lý do từ chối lịch hẹn"
            size="large"
          >
            {rejectionReasons.map(reason => (
              <Option key={reason.value} value={reason.value}>
                {reason.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="note"
          label="Ghi chú thêm (tùy chọn)"
          extra="Thông tin này sẽ được gửi đến khách hàng"
        >
          <TextArea
            rows={3}
            placeholder="Nhập ghi chú thêm về lý do từ chối..."
            maxLength={500}
            showCount
          />
        </Form.Item>

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
              icon={<CloseCircleOutlined />}
            >
              Xác nhận từ chối
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingRejectionModal;
