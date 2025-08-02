import React, { useState } from "react";
import { Button } from "antd";
import heroBg from "../../assets/images/hero.jpg";
import "../../css/landing/herosection.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom"; 

export default function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });

  const showToast = (variant, message) => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const handleBooking = (e) => {
    if (!user) {
      showToast("danger", "Vui lòng đăng nhập để đặt lịch hẹn");
      navigate("/login");
    } else {
      navigate("/browse-services");
    }
  };

  return (
    <div className="hero-section">
    
      <img src={heroBg} alt="Berger Barbershop" className="hero-img" />
      
      
      <div className="hero-overlay"></div>
      
    
      <div className="hero-content">
        <div className="logo-container">
          <span className="men-only">MEN</span>
     
          <span className="men-only">ONLY</span>
        </div>
        
        <h1 className="hero-title">BERGER</h1>
        
        <div className="barbershop-container">
          <span className="since">SINCE</span>
          <span className="barbershop">BARBERSHOP</span>
          <span className="year">MMXVI</span>
        </div>
        <Button onClick={handleBooking} className="appointment-button">
          ĐẶT LỊCH HẸN
        </Button>
      </div>

      {/* Toast hiển thị nếu chưa đăng nhập */}
      <div
        className="position-fixed"
        style={{ top: "4rem", right: "1rem", zIndex: 1060 }}
      >
        {toast.show && (
          <div className={`toast align-items-center text-bg-${toast.variant} border-0 show`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Close"
                onClick={() => setToast((t) => ({ ...t, show: false }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}