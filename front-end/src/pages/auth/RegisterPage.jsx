import React, {useState} from 'react';
import RegisterForm from '../../components/auth/RegisterForm.jsx';
import OtpVerificationForm from '../../components/auth/OtpVerficationForm.jsx';
import {useAuth} from "../../context/AuthContext.jsx";
import {Navigate} from "react-router-dom";

export default function RegisterPage() {
  const [email, setEmail] = useState(null);
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "barber") return <Navigate to="/barber" replace />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="container mt-5" style={{maxWidth: 500}}>
      {email ? (
        <OtpVerificationForm email={email}/>
      ) : (
        <RegisterForm onOtpStage={setEmail}/>
      )}
    </div>
  );
}
