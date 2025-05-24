import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ServiceBooking from "./pages/ServiceBooking/ServiceBooking.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/services" element={<ServiceBooking/>} />
      </Routes>
    </Router>
  );
}

export default App;