import React, { useState } from 'react';
import { Form, Input, Button, Space } from 'antd';
import {resend, verify} from "../../services/api.js";
import {useNavigate} from "react-router-dom";
import { toast } from "react-toastify";

export default function OtpVerificationForm({ email }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const verifyOtp = async () => {
    try {
      setLoading(true);
      await verify({email, otp});
      toast.success('Email verification successful! 🎉 You can now login to your account.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email verification failed. Please check your OTP code.', {
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

  const resendOtp = async () => {
    try {
      setResendLoading(true);
      await resend({email});
      toast.success('OTP code resent! 📧 Please check your email for the new code.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
