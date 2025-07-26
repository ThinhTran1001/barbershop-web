import {Form, Input, Button} from "antd";
import { forgotPassword } from "../../services/api";
import { toast } from "react-toastify";

export default function ForgotPasswordForm() {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      await forgotPassword({ email: values.email });
      toast.success('Password reset link sent! 📧 Please check your email inbox.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      form.resetFields();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
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
