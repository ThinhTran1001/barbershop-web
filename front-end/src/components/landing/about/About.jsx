import React from 'react';
import { Breadcrumb } from 'antd';
import { useNavigate } from 'react-router-dom';

import AboutHero from './AboutHero';
import AboutContent from './AboutContent';

import './About.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <> 
    {/* <div className="about-breadcrumb">
    <Breadcrumb>
      <Breadcrumb.Item className='about-breadcrumb_text' onClick={() => navigate('/')}>Trang chủ</Breadcrumb.Item>
      <Breadcrumb.Item>Giới thiệu</Breadcrumb.Item>
    </Breadcrumb>
  </div> */}
    <div className="about-page">
    <AboutHero />
    <AboutContent />
  </div>
  </>
  );
};

export default AboutPage;