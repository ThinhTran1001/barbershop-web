import { Typography } from "antd";
import LoginForm from "../../components/auth/LoginForm.jsx";

const { Title } = Typography;

const LoginPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="bg-white p-4 rounded shadow" style={{ minWidth: 500 }}>
        <Title level={3} className="text-center mb-4">
          Login
        </Title>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
