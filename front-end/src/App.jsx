import React from 'react';
import {RouterProvider} from 'react-router-dom';
import router from "./route.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import {CartProvider} from "./context/CartContext.jsx";
import {UserCartProvider} from "./context/UserCartContext.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <UserCartProvider>
          <RouterProvider router={router} />
          <ToastContainer position="top-right" autoClose={3000} />
        </UserCartProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;