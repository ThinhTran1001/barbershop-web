import React, { useEffect } from 'react';
import { Form, Input, Checkbox, Alert } from 'antd';
import { useAuth } from '../context/AuthContext';

const notificationOptions = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Push', value: 'push' },
];

const BookingInfoForm = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();

  // Auto-fill form with user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        customerName: user.name || '',
        customerEmail: user.email || '',
        customerPhone: user.phone || '',
      });
    }
  }, [user, form]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <div>
      {user && (
        <Alert
          message="Thông tin của bạn đã được tự động điền"
          description="Bạn có thể chỉnh sửa thông tin nếu cần thiết."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        id="booking-info-form"
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="Tên khách hàng"
          name="customerName"
          rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
        >
          <Input placeholder="Nhập tên đầy đủ của bạn" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="customerEmail"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Vui lòng nhập email hợp lệ!' }
          ]}
        >
          <Input placeholder="example@email.com" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="customerPhone"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại!' },
            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số!' }
          ]}
        >
          <Input placeholder="0123456789" />
        </Form.Item>

        <Form.Item label="Ghi chú/Yêu cầu thêm" name="note">
          <Input.TextArea
            rows={3}
            placeholder="Ví dụ: Tôi muốn cắt tóc ngắn, tỉa râu nhẹ..."
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default BookingInfoForm;
