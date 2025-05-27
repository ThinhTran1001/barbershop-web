import {Typography} from "antd";
import LoginForm from "../../components/auth/LoginForm.jsx";
import {useAuth} from "../../context/AuthContext.jsx";
import {Navigate, useNavigate} from "react-router-dom";
import React from "react";

const {Title} = Typography;

const LoginPage = () => {
  const {user, loading} = useAuth();
  const navigate = useNavigate();
  if (loading) return null;

  if (user?.role === "admin") return <Navigate to="/admin" replace/>;
  if (user?.role === "barber") return <Navigate to="/barber" replace/>;
  if (user) return <Navigate to="/" replace/>;

  return (
    <div className="bg-white p-4 rounded shadow mt-5" style={{minWidth: 500}}>
      <Title level={3} className="text-center mb-4">
        Login
      </Title>
      <LoginForm/>
      <a onClick={() => navigate("/forgot-password")}>Forgot password?</a>

    </div>
  );
};

export default LoginPage;
