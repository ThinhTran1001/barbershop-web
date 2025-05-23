import React from 'react';
<<<<<<< HEAD
import { ConfigProvider, App as AntApp } from 'antd';
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
      <AntApp>
        <div className="app">
          <ServiceBooking />
          <ManagingService />
        </div>
      </AntApp>
    </ConfigProvider>
=======
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
>>>>>>> origin/master
  );
}

export default App;