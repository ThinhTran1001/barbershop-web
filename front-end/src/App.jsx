import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';

import './App.css';
import Landing from "./pages/home/Landing";
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/reset.css"; 
import ProductDetail from './components/product/ProductDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;