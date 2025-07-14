import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import img1 from "../../assets/images/about1.jpg";
import img2 from "../../assets/images/about2.jpg";
import "../../css/landing/aboutsection.css";

export default function AboutSection() {
  const navigate = useNavigate();

  return (
    <section className="about-section">
      <div className="container">
        <div className="about-grid">
   
          <div className="about-images">
            <div className="images-container">
              <div className="images-wrapper">
                <img src={img1} alt="Berger Barbershop" className="about-img about-img-top" />
                <img src={img2} alt="Barbershop services" className="about-img about-img-bottom" />
              </div>
            </div>
          </div>
          
      
          <div className="about-content">
            <h2 className="about-title">VỀ CHÚNG TÔI</h2>
            <div className="title-underline"></div>
            
            <p className="about-text">
              Tiệm cắt tóc của chúng tôi là lãnh thổ được tạo ra hoàn toàn dành cho những người đàn ông đánh giá cao chất lượng cao cấp, thời gian và vẻ ngoài hoàn mỹ.
            </p>
            
            <p className="about-text">
              Dịch vụ của chúng tôi bao gồm nhiều kỹ thuật và quy trình – từ cạo râu thẳng và tạo mẫu tóc đến chăm sóc râu và chải lông mày. Đến với chúng tôi, bạn có cơ hội được chăm sóc mái tóc quý giá của mình, nhâm nhi rượu whisky hảo hạng và nghe những bản nhạc hay.
            </p>
            
            <Button className="about-button" onClick={() => navigate('/about')}>
              ➝ Xem thêm
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}