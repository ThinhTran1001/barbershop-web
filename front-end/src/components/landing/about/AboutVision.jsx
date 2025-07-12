import React from 'react';
import { Row, Col, Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const AboutVision = () => {
  return (
    <div className="about-vision" style={{ padding: '60px 20px', background: '#fff' }}>
      <Row gutter={32}>
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <Title level={4} style={{ color: '#f1c40f' }}>Tầm nhìn</Title>
            <Paragraph>
            BERGER là nền tảng hỗ trợ doanh nghiệp làm đẹp phát triển bền vững, nâng tầm ngành làm đẹp tại Việt Nam và vươn ra Đông Nam Á.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <Title level={4} style={{ color: '#f1c40f' }}>Giá trị cốt lõi</Title>
            <Paragraph>
              Hiệu quả – Chất lượng – Tận tâm. Tạo ra giá trị thiết thực và bền vững cho khách hàng và đối tác.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AboutVision;
