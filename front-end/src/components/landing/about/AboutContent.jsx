import React from 'react';
import { Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import './About.css';

const AboutContent = () => {
  const galleryImages = [
    { src: '/src/assets/images/gallery1.png', alt: 'BERGER Style 1' },
    { src: '/src/assets/images/gallery2.png', alt: 'BERGER Style 2' },
    { src: '/src/assets/images/gallery3.png', alt: 'BERGER Style 3' },
    { src: '/src/assets/images/gallery4.png', alt: 'BERGER Style 4' },
  ];
  const navigate = useNavigate();

  const handleContactClick = () => {
    navigate('/contact');
  };

  return (
    <section className="about-content">
      <div className="about-content-wrapper">
        <div className="content-section">
          <h2>Giới thiệu về BERGER</h2>
          <div className="content-text">
            <Row gutter={24}>
              <Col span={8}>
                <div className="intro-image">
                  <img 
                    src="/src/assets/images/berger-intro.png" 
                    alt="BERGER Introduction" 
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300/1a1a1a/f1c40f?text=BERGER+Intro';
                    }}
                  />
                </div>
              </Col>
              <Col span={16}>
                <div className="intro-text">
                  <p>
                    BERGER là chủ tóc nam số 1 dành cho giới trẻ hiện nay. Sau 7 năm thành lập,
                    BERGER hiện có 74 cơ sở trên cả nước và phục vụ 2 triệu khách hàng. Ngoài ra,
                    chúng tôi vinh dự được Top 1 Streamer nhờ Ba Mẹ, Bố Bím, Nhiều, Tam Bao... và 1
                    số idol Tiktok như Long Thủ, Chiều Dũ... tin tưởng lựa chọn.
                  </p>
                  <p>
                    Lý do BERGER phát triển lên mạnh như hiện nay từ một đây tầm tao ra xu hướng
                    kết tóc hot như: Mohican năm 2018, Jayout vả Ziczac năm 2019. BERGER giúp các
                    bạn trẻ sáng động với cá tính và đam mê làm đẹp khác biệt qua những kiểu tóc có
                    CHẤT. Ngoài cái được 127 kiểu tóc thành hành, BERGER còn là nơi chuyên khắc
                    phục những khuyết điểm như: đầu lý tóm, tóc mỏng, chủa, xuần xo, trán thô 'd...
                    giúp bạn tự tin hơn cho các bạn trẻ.
                  </p>
                </div>
              </Col>
            </Row>
          </div>

          <div className="success-factors">
            <h3>Điều tạo nên thành công của BERGER</h3>
            <p>
              BERGER nhìn nhận gần đây trở thành thương hiệu tóc nam được nhiều bạn trẻ săn
              đón trong cả nước nhờ không ngần ngại đầu tư cơ sở phòng cách riêng công với đội
              ngũ Barber chất theo phong cách SWAG để chính BERGER đào tạo.
            </p>
            <p>
              Không ngừng cập nhật các kiểu tóc mới nhất theo xu hướng của thế giới mà BERGER
              còn tự sáng tạo ra các kiểu tóc phù hợp với người Việt Nam như Mohican, Sóng Ziczac.
              Biến với BERGER không chỉ là cắt tóc cho ngon, cho gọn mà bạn sẽ được tư vấn
              kiểu tóc phù hợp để có 1 vẻ đẹp trai theo phong cách riêng của mình.
            </p>
            <p>
              Swag - BERGER - Thành Già Đần Ưng. Biến về chúng tôi đơn giản là sự khác biệt!
            </p>
          </div>

          <div className="gallery-section">
            <div className="gallery-grid">
              {galleryImages.map((image, index) => (
                <div key={index} className="gallery-item">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/300x300/1a1a1a/f1c40f?text=Style+${index + 1}`;
                    }}
                  />
                  <div className="gallery-overlay">
                    <span>{image.alt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-section">
            <button className="contact-button" onClick={handleContactClick}>
              Liên hệ với chúng tôi
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default AboutContent;