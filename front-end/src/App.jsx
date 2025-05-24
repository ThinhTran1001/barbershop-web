import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import AdminDashboard from './pages/AdminDashboard';
import Landing from "./pages/home/Landing.jsx";
import ServiceBooking from "./pages/ServiceBooking/ServiceBooking.jsx";

function App() {
  return (
    <ConfigProvider>
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