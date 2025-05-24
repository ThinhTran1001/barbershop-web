import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import './App.css';
import ServiceBooking from './pages/ServiceBooking/ServiceBooking';
import AdminDashboard from './pages/AdminDashboard';
import Landing from "./pages/home/Landing.jsx";

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
          <Router>
            <Routes>
              <Route path="/" element={<Landing/>}/>
              <Route path="/services" element={<ServiceBooking />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Router>
        </div>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
