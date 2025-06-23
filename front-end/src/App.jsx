import React from 'react';
import AppRoutes from "./route.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
