import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="container text-center">
          <div className="footer-logo">
          <div className="berger-logo">
                <img 
                  src="./image/berger-logo.png" 
                  alt="BERGER BARBERSHOP"
                  width={300}
                />
              </div>
            
            <div className="brand-name">BERGER</div>
            
            <div className="barber-tag">
              <span className="dash">—</span>
              <span className="barber-text">BARBERSHOP</span>
              <span className="dash">—</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container text-center">
          <h4>Berger Barbershop</h4>
          <p>123 Đường Cắt Tóc, TP.HCM | 0909 123 456 | info@bergerbarbershop.com</p>
          <div className="copyright">
            <p>© 2025 Berger Barbershop. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;