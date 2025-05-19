import React from 'react';
import { Button, Typography, Layout, Space } from 'antd';
import Navbar from '../Navbar/Navbar';
import './Header.css';

const { Header: AntHeader } = Layout;
const { Text, Title } = Typography;

const Header = () => {
  return (
    <AntHeader className="main-header">
      <div className="header-overlay">
        <div className="top-nav">
          <div className="container-fluid">
            <div className="top-navbar d-flex justify-content-end">
              <Navbar />
            </div>
          </div>
        </div>
        
        <div className="header-content">
          <div className="container text-center">
            <div className="logo-wrapper">
              <div className="berger-logo">
                <img 
                  src="./image/berger-logo.png" 
                  alt="BERGER BARBERSHOP"
                  width={300}
                />
              </div>
              
              <Button className="book-now-btn mt-4">ĐẶT LỊCH NGAY</Button>
            </div>
          </div>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;