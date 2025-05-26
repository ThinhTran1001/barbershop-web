import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/api";

export default function ResetPasswordForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const userId = searchParams.get("id");
  const token = searchParams.get("token");

  const onFinish = async (values) => {
    if (!userId || !token) {
      return message.error("Invalid reset link");
    }

    try {
      setLoading(true);
      await resetPassword({
        userId,
        token,
        newPassword: values.newPassword,
      });
      message.success("Password reset successfully");
      navigate("/login");
    } catch (err) {
      message.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 500 }}>
      <h4 className="mb-3">Reset Your Password</h4>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[{ required: true, message: "Please enter a new password" }]}
        >
          <Input.Password placeholder="Enter new password" />
        </Form.Item>
        <Form.Item>
          <Button
            htmlType="submit"
            type="primary"
            block
            loading={loading}
            className="bg-warning"
          >
            Reset Password
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
