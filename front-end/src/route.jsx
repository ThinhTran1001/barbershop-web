import { createBrowserRouter } from "react-router-dom";
import RequireRole from "./middleware/RequireAuth.jsx";
import CommonLayout from "./pages/layout/CommonLayout.jsx";
import AdminLayout from "./pages/layout/AdminLayout.jsx";
import BarberLayout from "./pages/layout/BarberLayout.jsx";
import RoleBasedLayout from "./pages/layout/RoleBasedLayout.jsx";
import Landing from "./pages/home/Landing.jsx";
import Login from "./pages/auth/LoginPage.jsx";
import ProductManagement from "./components/ProductManagement.jsx";
import BrandManagement from "./components/BrandManagement.jsx";
import CategoryManagement from "./components/CategoryManagement.jsx";

const publicRoutes = {
  element: <CommonLayout />,
  children: [
    { path: "/", element: <Landing /> },
    { path: "/login", element: <Login /> }
  ],
};

const adminRoutes = {
  element: <RequireRole allowedRoles={["admin"]} />,
  children: [
    {
      path: "/admin",
      element: <AdminLayout />,
      children: [
        { index: true, element: <ProductManagement /> },
        { path: "product", element: <ProductManagement /> },
        { path: "brand", element: <BrandManagement /> },
        { path: "category", element: <CategoryManagement /> },
      ],
    },
  ],
};

const barberRoutes = {
  element: <RequireRole allowedRoles={["barber"]} />,
  children: [
    {
      path: "/barber",
      element: <BarberLayout />,
      children: [],
    },
  ],
};

const router = createBrowserRouter([
  { path: "/dashboard", element: <RoleBasedLayout /> },
  adminRoutes,
  barberRoutes,
  publicRoutes,
]);

export default router;
