import React from 'react';
import { RouterProvider } from "react-router-dom";
import router from "./route.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
        <ToastContainer position="top-right" autoClose={3000} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
