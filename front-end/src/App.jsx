import React from 'react';
import { RouterProvider } from "react-router-dom";
import router from "./route.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import {CartProvider} from "./context/CartContext.jsx";
import {CartLoggedInProvider} from "./context/CartLoggedInContext.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CartLoggedInProvider>
          <RouterProvider router={router} />
          <ToastContainer position="top-right" autoClose={3000} />
        </CartLoggedInProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
