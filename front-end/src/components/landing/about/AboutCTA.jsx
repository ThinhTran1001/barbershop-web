import React from 'react';
import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const AboutCTA = () => {
  const navigate = useNavigate();

  return (
    <div
      className="about-cta"
      style={{
        background: '#f1c40f',
        padding: '60px 20px',
        textAlign: 'center',
        color: '#fff',
      }}
    >
      <Title level={2} style={{ color: '#fff', fontWeight: 600 }}>
        Liên hệ với chúng tôi để được tư vấn và biết thêm thông tin chi tiết
      </Title>
      <Button type="default" size="large" onClick={() => navigate('/contact')}>
        Liên hệ ngay
      </Button>
    </div>
  );
};

export default AboutCTA;
