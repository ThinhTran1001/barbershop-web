import React, { useState } from "react";
import "../../css/landing/booking.css";

export default function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    time: "",
    notes: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log("Form submitted:", formData);
    
    alert("Đặt lịch thành công! Chúng tôi sẽ liên hệ sớm với bạn.");
    setFormData({
      name: "",
      phone: "",
      time: "",
      notes: ""
    });
  };

  return (
    <section className="booking-section">
      <div className="booking-overlay"></div>
      
      <div className="booking-container">
        <h2 className="booking-title">ĐẶT LỊCH HẸN</h2>
        <div className="booking-divider"></div>
        
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Tên của bạn"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="tel"
                name="phone"
                placeholder="Số điện thoại"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="time"
                placeholder="Thời gian hẹn"
                className="form-input"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="text"
                name="notes"
                placeholder="Ghi chú"
                className="form-input"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-submit">
            <button type="submit" className="booking-button">ĐẶT LỊCH</button>
          </div>
        </form>
      </div>
    </section>
  );
}