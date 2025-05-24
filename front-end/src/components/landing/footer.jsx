import React from "react";
import "../../css/landing/footer.css";


export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-logo">
          <div className="logo-container">
            <div className="men-only">
              <span>MEN</span>
              {/* <img src={scissorsIcon} alt="Scissors" className="scissors-icon" /> */}
              <span>ONLY</span>
            </div>
            
            <h1 className="logo-title">BERGER</h1>
            
            <div className="barbershop-text">
              <span className="since">SINCE</span>
              <span className="shop-text">BARBERSHOP</span>
              <span className="year">MMXVI</span>
            </div>
          </div>
        </div>
        
        <div className="footer-contact">
          <div className="contact-item">
            <i className="fas fa-phone-alt"></i>
            <span>Điện thoại: 0886 055 166</span>
          </div>
          
          <div className="contact-item">
            <i className="fas fa-map-marker-alt"></i>
            <span>Địa chỉ: Đại lộ Lê Nin, thành phố Vinh, Nghệ An</span>
          </div>
          
          <div className="contact-item">
            <i className="fas fa-envelope"></i>
            <span>Email: bergerbarbershop@gmail.com</span>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="social-icons">
          <a href="tel:0886055166" className="social-icon phone-icon">
            <i className="fas fa-phone-alt"></i>
          </a>
          <a href="https://zalo.me/0886055166" className="social-icon zalo-icon">
            <span>Zalo</span>
          </a>
        </div>
      </div>
    </footer>
  );
}