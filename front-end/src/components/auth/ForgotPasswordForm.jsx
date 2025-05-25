import {Form, Input, Button, notification} from "antd";
import { forgotPassword } from "../../services/api";

export default function ForgotPasswordForm() {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      await forgotPassword({ email: values.email });
      notification.success({
        message: "Thành công",
        description: "Reset link has been sent to your email",
        placement: "topRight",
      });
      form.resetFields();
    } catch (err) {
      notification.success({
        message: "Thành công",
        description: err.response?.data?.message || "Failed to send reset link",
        placement: "topRight",
      });
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 500 }}>
      <h4 className="mb-3">Forgot Password</h4>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email" },
            { type: "email", message: "Invalid email format" },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary" block className="bg-warning">
            Send Reset Link
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
