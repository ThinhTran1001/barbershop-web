import React, { useState } from 'react';
import { Form, Input, Button } from 'antd';
import {register} from "../../services/api.js";
import { toast } from "react-toastify";

export default function RegisterForm({ onOtpStage }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      await register(values);
      toast.success('Registration successful! 🎉 Please check your email for the OTP code.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onOtpStage(values.email);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="text-center mb-4">Đăng ký tài khoản</h3>
      <Form form={form} layout="vertical" onFinish={handleRegister}>
        <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[
          { required: true, message: 'Vui lòng nhập email' },
          { type: 'email', message: 'Email không hợp lệ' },
        ]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Số điện thoại" rules={[
          { required: true, message: 'Vui lòng nhập số điện thoại' },
          { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' },
        ]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button className="bg-warning" htmlType="submit" loading={loading} block>
            Đăng ký
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
