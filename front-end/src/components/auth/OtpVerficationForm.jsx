import React, { useState } from 'react';
import { Form, Input, Button, message, Space } from 'antd';
import {resend, verify} from "../../services/api.js";
import {useNavigate} from "react-router-dom";

export default function OtpVerificationForm({ email }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const verifyOtp = async () => {
    try {
      setLoading(true);
      await verify({email, otp});
      message.success('Xác minh email thành công!');
      navigate('/login');
    } catch (err) {
      message.error(err.response?.data?.message || 'Xác minh thất bại');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setResendLoading(true);
      await resend({email});
      message.success('OTP đã được gửi lại');

    } catch (err) {
      message.error(err.response?.data?.message || 'Không gửi lại được OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <h4 className="text-center mb-4">Xác minh OTP</h4>
      <p>Vui lòng nhập mã OTP đã gửi đến email <strong>{email}</strong></p>
      <Form layout="vertical" onFinish={verifyOtp}>
        <Form.Item label="Mã OTP">
          <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Space direction="vertical" className="w-100">
            <Button type="primary" htmlType="submit" loading={loading} block>
              Xác minh
            </Button>
            <Button onClick={resendOtp} loading={resendLoading} block>
              Gửi lại mã OTP
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}
