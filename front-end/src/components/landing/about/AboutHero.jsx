import React from 'react';
import './About.css';

const AboutHero = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">Sứ mệnh BERGER theo đuổi</h1>
          <div className="hero-quote">
            <p>
              "Thông qua dịch vụ cắt tóc nam & đào tạo nghề Barber BERGER mong muốn
              truyền tải thông điệp 'Sống CHẤT' cho 1 triệu bạn trẻ Việt Nam có phong
              cách sống riêng, tự tin thể hiện phong cách, sống có ước mơ & dám theo
              đuổi đam mê của mình."
            </p>
          </div>
        </div>
        <div className="hero-image">
          <img 
            src="/src/assets/images/banner2.png" 
            alt="BERGER" 
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x600/1a1a1a/f1c40f?text=BERGER';
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default AboutHero;