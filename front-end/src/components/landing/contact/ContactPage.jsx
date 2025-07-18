import React from 'react';
import ContactForm from '../contact/ContactForm';
import ContactInfo from '../contact/ContactInfo';
import MapEmbed from '../contact/MapEmbed';
import { Row, Col, Container, Breadcrumb } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; 

const ContactPage = () => {
  const navigate = useNavigate(); 

  return (
    <Container className="my-5">
      {/* <div className="berger-about__breadcrumb mb-4" style={{ marginTop: 100 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <span
              className="berger-contact__breadcrumb-link"
              onClick={() => navigate("/")}
              style={{  cursor: "pointer" }}
            >
              Trang chủ
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span
              className="berger-contact__breadcrumb-link"
              onClick={() => navigate("/contact")}
              style={{ color: "black", cursor: "pointer" }}
            >
              Liên hệ
            </span>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div> */}
      <h2 className="fw-bold" style={{ marginTop: 100, marginBottom: 32 }}>Liên hệ</h2>
      <MapEmbed />
      <Row className="mt-4">
        <Col md={6}><ContactInfo /></Col>
        <Col md={6}><ContactForm /></Col>
      </Row>
    </Container>
  );
};

export default ContactPage;
