import React from "react";
import { Breadcrumb } from "antd";
import { useNavigate } from "react-router-dom";
import img3 from "../../../assets/images/about3.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "./About.css";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="berger-about container">
      {/* Breadcrumb Section */}
      <div className="berger-about__breadcrumb mb-4">
        <Breadcrumb>
          <Breadcrumb.Item>
            <span className="berger-about__breadcrumb-link" onClick={() => navigate("/")} style={{color: "blue"}}>
              Trang chủ
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
          <span className="berger-about__breadcrumb-link" onClick={() => navigate("/about")}>
             Giới thiệu
            </span>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* About Content */}
      <div className="berger-about__content">
        <div className="berger-about__header">
          <h1 className="berger-about__title">BERGER - Điểm Tựa Cho Việc Lớn</h1>
          <div className="berger-about__quote">
            <p className="berger-about__quote-text">
              “Hãy cho tôi một điểm tựa, tôi sẽ nâng cả thế giới.” - Archimedes
            </p>
            <p className="berger-about__description">
              Mỗi người đàn ông đều có một hành trình riêng, một thế giới muốn chinh phục. Có người đang tiến về đích, có người vẫn đang tìm hướng đi. Dù anh ở đâu – <strong>BERGER</strong> là điểm tựa giúp anh thể hiện phong thái và khí chất.
            </p>
          </div>
        </div>
        <div className="berger-about__image-section text-center mb-4">
          <img src={img3} alt="BERGER Barbershop" className="berger-about__main-image" />
        </div>
        <div className="berger-about__section">
          <h2 className="berger-about__section-title">Kiểu Tóc Đẹp – Điểm Khởi Đầu</h2>
          <p className="berger-about__text">
            Một kiểu tóc đẹp không chỉ để ngắm – mà để cảm nhận sự tự tin và thoải mái. Với gần 150 salon trên toàn quốc, công nghệ hiện đại và đội ngũ thợ tận tâm, <strong>BERGER</strong> mang đến diện mạo mới, sẵn sàng cho mọi thử thách phía trước.
          </p>
        </div>
        <div className="berger-about__section">
          <h2 className="berger-about__section-title">WILLS – Tinh Thần Dẫn Lối</h2>
          <div className="berger-about__wills-grid">
            <div className="berger-about__wills-card">
              <div className="ant-card-body">
                <div className="berger-about__wills-letter">W</div>
                <h3 className="berger-about__wills-title">Warrior</h3>
                <p className="berger-about__wills-description">Kiên cường, không lùi bước.</p>
              </div>
            </div>
            <div className="berger-about__wills-card">
              <div className="ant-card-body">
                <div className="berger-about__wills-letter">I</div>
                <h3 className="berger-about__wills-title">Intervention</h3>
                <p className="berger-about__wills-description">Tạo ra thời điểm hoàn hảo.</p>
              </div>
            </div>
            <div className="berger-about__wills-card">
              <div className="ant-card-body">
                <div className="berger-about__wills-letter">L</div>
                <h3 className="berger-about__wills-title">Learning</h3>
                <p className="berger-about__wills-description">Phát triển không giới hạn.</p>
              </div>
            </div>
            <div className="berger-about__wills-card">
              <div className="ant-card-body">
                <div className="berger-about__wills-letter">L</div>
                <h3 className="berger-about__wills-title">Leadership</h3>
                <p className="berger-about__wills-description">Sáng tạo, dẫn đầu thay đổi.</p>
              </div>
            </div>
            <div className="berger-about__wills-card">
              <div className="ant-card-body">
                <div className="berger-about__wills-letter">S</div>
                <h3 className="berger-about__wills-title">Sincerity</h3>
                <p className="berger-about__wills-description">Chân thành, đáng tin cậy.</p>
              </div>
            </div>
          </div>
          <p className="berger-about__text">
            Ở <strong>BERGER</strong>, chúng tôi giúp anh tìm phiên bản tốt nhất của mình.
          </p>
        </div>
        <div className="berger-about__section">
          <h2 className="berger-about__section-title">Sứ Mệnh – Nâng Tầm Thợ Việt</h2>
          <p className="berger-about__text">
            <strong>BERGER</strong> tôn vinh đôi bàn tay tài hoa người thợ Việt, vươn xa trên bản đồ thế giới với chất lượng dịch vụ vượt trội.
          </p>
        </div>
        <div className="berger-about__final">
          <h2 className="berger-about__section-title">Ai Cũng Có Việc Lớn – Chỉ Cần Điểm Tựa</h2>
          <p className="berger-about__final-text">
            Không có lộ trình nào giống nhau. <strong>BERGER</strong> – Điểm tựa cho hành trình của anh.
          </p>
        </div>
      
      </div>
    </div>
  );
};

export default About;