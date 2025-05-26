import { Row, Col, Typography, Space } from "antd";
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const Footer = () => {
  return (
    <footer className="bg-dark text-white position-relative pt-5">
      <div className="container position-relative z-1">

        {/* Logo và slogan */}
        <Row justify="center" className="text-center mb-4">
          <Col>
            <div className="d-flex justify-content-center align-items-center gap-2 mb-2 text-warning fw-semibold text-uppercase" style={{ letterSpacing: 2 }}>
              <span>MEN</span>
              {/* <img src={scissorsIcon} alt="Scissors" className="mx-2" style={{ width: 20 }} /> */}
              <span>ONLY</span>
            </div>
            <Title level={1} className="text-warning fw-bold m-0" style={{ letterSpacing: 5, fontSize: '4rem', lineHeight: 1 }}>
              BERGER
            </Title>
            <div className="d-flex justify-content-center align-items-center mt-2" style={{ letterSpacing: 2 }}>
              <Text className="me-2 opacity-75">SINCE</Text>
              <Text className="mx-2 fw-semibold text-warning">BARBERSHOP</Text>
              <Text className="ms-2 opacity-75">MMXVI</Text>
            </div>
          </Col>
        </Row>

        {/* Thông tin liên hệ */}
        <Row justify="center" className="text-center text-md-start mb-5">
          <Col xs={24} md={8} className="mb-3 d-flex flex-column align-items-center">
            <Space direction="horizontal" size="middle">
              <PhoneOutlined style={{ color: '#d4a449', fontSize: '1.1rem' }} />
              <Text className="text-white">Điện thoại: 0886 055 166</Text>
            </Space>
          </Col>
          <Col xs={24} md={8} className="mb-3 d-flex flex-column align-items-center">
            <Space direction="horizontal" size="middle">
              <EnvironmentOutlined style={{ color: '#d4a449', fontSize: '1.1rem' }} />
              <Text className="text-white">Địa chỉ: Đại lộ Lê Nin, Vinh, Nghệ An</Text>
            </Space>
          </Col>
          <Col xs={24} md={8} className="mb-3 d-flex flex-column align-items-center">
            <Space direction="horizontal" size="middle">
              <MailOutlined style={{ color: '#d4a449', fontSize: '1.1rem' }} />
              <Text className="text-white">Email: bergerbarbershop@gmail.com</Text>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Fixed Social Icons */}
      <div
        className="position-fixed d-flex flex-column gap-2"
        style={{ bottom: 20, left: 20, zIndex: 100 }}
      >
        <a
          href="tel:0886055166"
          className="d-flex align-items-center justify-content-center rounded-circle bg-danger text-white"
          style={{ width: 45, height: 45, transition: 'all 0.3s' }}
        >
          <PhoneOutlined />
        </a>
        <a
          href="https://zalo.me/0886055166"
          className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
          style={{ width: 45, height: 45, fontSize: '0.9rem', transition: 'all 0.3s' }}
        >
          Zalo
        </a>
      </div>

      {/* Footer Bottom */}
      <div className="text-center text-secondary py-3 border-top border-secondary-subtle mt-4">
        © {new Date().getFullYear()} BERGER Barbershop. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
