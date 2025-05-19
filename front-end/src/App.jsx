import React from 'react';
import { ConfigProvider } from 'antd';
import './App.css';
import Header from './components/Header/Header';
import ServiceBooking from './components/ServiceBooking/ServiceBooking';
import Footer from './components/Footer/Footer';
import ManagingService from './components/ManagingService/ManagingService';

const theme = {
  token: {
    colorPrimary: '#d4af37',
    colorBgContainer: '#333',
    colorText: '#fff',
    colorBorder: '#444',
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <div className="app">
        <Header />
        <ServiceBooking />
        <ManagingService />
        <Footer />
      </div>
    </ConfigProvider>
  );
}

export default App;