import { Typography } from "antd";
import LoginForm from "../../components/auth/LoginForm.jsx";
import {useAuth} from "../../context/AuthContext.jsx";
import {Navigate} from "react-router-dom";
import React from "react";

const { Title } = Typography;

const LoginPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "barber") return <Navigate to="/barber" replace />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
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
