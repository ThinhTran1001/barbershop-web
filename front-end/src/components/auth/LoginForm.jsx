import { Form, Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { initiateGoogleLogin } from "../../services/api.js";
import { toast } from "react-toastify";

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async ({ email, password }) => {
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name || email}! 🎉`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      if (user.role === "admin") navigate("/admin");
      else if (user.role === "barber") navigate("/barber");
      else navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please check your credentials.", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  return (
    <Form layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Email"
        name="email"
        rules={[{ required: true, message: "Please input your email" }]}
      >
        <Input placeholder="Enter your email" />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password" }]}
      >
        <Input.Password placeholder="Enter your password" />
      </Form.Item>
      <Form.Item className="mt-3">
        <Button className="bg-warning" htmlType="submit" block>
          Log In
        </Button>
      </Form.Item>
      <Form.Item>
        <Button type="default" block onClick={handleGoogleLogin}>
          Log In with Google
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;