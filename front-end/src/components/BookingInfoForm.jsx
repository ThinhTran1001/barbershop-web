import React from 'react';
import { Form, Input, Checkbox } from 'antd';

const notificationOptions = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Push', value: 'push' },
];

const BookingInfoForm = ({ onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Form
      id="booking-info-form"
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      style={{ marginTop: 16 }}
    >
      <Form.Item label="Tên khách hàng" name="customerName" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Email" name="customerEmail" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Số điện thoại" name="customerPhone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Ghi chú/Yêu cầu thêm" name="note">
        <Input.TextArea rows={2} />
      </Form.Item>
    
    </Form>
  );
};

export default BookingInfoForm;
