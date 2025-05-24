import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ServiceBooking from './pages/ServiceBooking/ServiceBooking';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/services' element={<ServiceBooking/>} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;