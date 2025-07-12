import React from 'react';
import { Breadcrumb } from 'antd';
import { useNavigate } from 'react-router-dom';

import AboutHeader from './AboutHeader';
import AboutTimeline from './AboutTimeline';
import AboutStats from './AboutStats';
import AboutVision from './AboutVision';
import AboutCTA from './AboutCTA';
import './About.css';
const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
  <div className="about-breadcrumb">
    <Breadcrumb>
      <Breadcrumb.Item>
        <span onClick={() => navigate('/')} className="ant-breadcrumb-link">
          Trang chủ
        </span>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <span className="ant-breadcrumb-link">Giới thiệu</span>
      </Breadcrumb.Item>
    </Breadcrumb>
  </div>

  <AboutHeader />
  <AboutTimeline />
  <AboutStats />
  <AboutVision />
  <AboutCTA />
</div>

  );
};

export default AboutPage;
