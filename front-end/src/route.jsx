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
import BarberManagement from "./components/BarberManagement.jsx";
import UserManagement from "./components/UserManagement.jsx";
import Register from "./pages/auth/RegisterPage.jsx";
import ProductDetail from "./components/product/ProductDetail.jsx";
import ProductList from "./pages/home/prodductList.jsx";
import ManagingService from './pages/ManagingService/ManagingService.jsx'
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm.jsx";
import ResetPasswordForm from "./components/auth/ResetPasswordForm.jsx";
import ServiceBooking from "./pages/ServiceBooking/ServiceBooking.jsx";
import CustomerProfile from './components/profile/customerProfile.jsx';
import Cart from './components/cart/Cart.jsx';
import ManageFeedbackProduct from "./pages/ManageFeedbackProduct/ManageFeedbackProduct.jsx";
import ManageFeedbackBarber from "./pages/ManageFeedbackBarber/ManageFeedbackBarber.jsx";
import ManageDiscountProduct from "./pages/ManageDiscountProduct/ManageDiscountProduct.jsx";

const publicRoutes = {
  element: <CommonLayout />,
  children: [
    { path: "/", element: <Landing /> },
    { path: "/products/:id", element: <ProductDetail/> },
    { path: "/login", element: <Login /> },
    {path: "/register", element: <Register/>},
    {path: "/products", element: <ProductList/>},
    {path: "/forget", element: <ProductList/>},
    {path: "/services", element: <ServiceBooking/>},
    { path: "/forgot-password", element: <ForgotPasswordForm /> },
    { path: "/reset-password", element: <ResetPasswordForm /> },
    { path: "/profile", element: <CustomerProfile /> },
    { path: "/cart", element: <Cart /> },
  ],
};

const adminRoutes = {
  // element: <RequireRole allowedRoles={["admin"]} />,
  children: [
    {
      path: "/admin",
      element: <AdminLayout />,
      children: [
        { index: true, element: <ProductManagement /> },
        { path: "product", element: <ProductManagement /> },
        { path: "brand", element: <BrandManagement /> },
        { path: "category", element: <CategoryManagement /> },
        { path: "service", element: <ManagingService /> },
        { path: "barber", element: <BarberManagement /> },
        { path: "user", element: <UserManagement /> },
        {path: "feedback-product", element:  <ManageFeedbackProduct/>},
        {path: "feedback-barber", element: <ManageFeedbackBarber/>}, 
        {path: "discount-product", element: <ManageDiscountProduct/>},
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
