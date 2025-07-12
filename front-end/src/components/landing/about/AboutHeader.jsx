import React from 'react';
import { Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const AboutHeader = () => {
  return (
    <div className="about-header" style={{ textAlign: 'center', padding: '50px 20px', background: '#f0f2f5' }}>
      <Title level={1} style={{ color: '#f1c40f' }}>BERGER</Title>
      <Paragraph className="lead">
        Giải pháp chuyển đổi số cho ngành dịch vụ làm đẹp.
      </Paragraph>
      <Divider />
      <Title level={2}>Sứ mệnh</Title>
      <Paragraph>
      BERGER ra đời với sứ mệnh số hóa ngành dịch vụ làm đẹp, đặc biệt đẩy mạnh phát triển và chuyên nghiệp hóa ngành làm đẹp tại Việt Nam và Đông Nam Á.
      </Paragraph>
    </div>
  );
};

export default AboutHeader;
