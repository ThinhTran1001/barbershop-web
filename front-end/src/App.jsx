import React from 'react';
import { ConfigProvider } from 'antd';
import './App.css';
import ServiceBooking from './pages/ServiceBooking/ServiceBooking';
import ManagingService from './pages/ManagingService/ManagingService';


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
        <ServiceBooking />
        <ManagingService />
      </div>
    </ConfigProvider>
  );
}

export default App;