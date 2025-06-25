import { createBrowserRouter } from "react-router-dom";

// Layouts
import CommonLayout from "./pages/layout/CommonLayout.jsx";
import AdminLayout from "./pages/layout/AdminLayout.jsx";
import BarberLayout from "./pages/layout/BarberLayout.jsx";
import RequireAuth from "./middleware/RequireAuth";

// Public pages
import Landing from "./pages/home/Landing.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm.jsx";
import ResetPasswordForm from "./components/auth/ResetPasswordForm.jsx";
import ProductList from "./pages/home/prodductList.jsx";
import ProductDetail from "./components/product/ProductDetail.jsx";
import ServiceBooking from "./pages/ServiceBooking/ServiceBooking.jsx";
import Checkout from "./pages/checkout/Checkout.jsx";
import OrderSuccess from "./pages/checkout/OrderSuccess.jsx";
import CheckoutGuest from "./pages/checkout/CheckoutGuest.jsx";

// Customer pages
import ListOfOrder from "./pages/order/ListOfOrder.jsx";
import OrderDetail from "./pages/order/OrderDetail.jsx";

// Admin pages
import ProductManagement from "./components/ProductManagement.jsx";
import BrandManagement from "./components/BrandManagement.jsx";
import CategoryManagement from "./components/CategoryManagement.jsx";
import UserManagement from "./components/UserManagement.jsx";
import BarberManagement from "./components/BarberManagement.jsx";
import VoucherManagement from "./components/VoucherManagemet.jsx";
import UserVoucherManagement from "./components/UserVoucherManagement.jsx";
import OrderManagement from "./components/OrderManagement.jsx";
import ManagingService from "./pages/ManagingService/ManagingService.jsx";
import ManageFeedbackProduct from "./pages/ManageFeedbackProduct/ManageFeedbackProduct.jsx";
import ManageFeedbackBarber from "./pages/ManageFeedbackBarber/ManageFeedbackBarber.jsx";
import ManageDiscountProduct from "./pages/ManageDiscountProduct/ManageDiscountProduct.jsx";

// Routing
const router = createBrowserRouter([
  {
    element: <CommonLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordForm /> },
      { path: "/reset-password/:token", element: <ResetPasswordForm /> },
      { path: "/products", element: <ProductList /> },
      { path: "/products/:id", element: <ProductDetail /> },
      { path: "/services", element: <ServiceBooking /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/order-success", element: <OrderSuccess /> },
      { path: "/checkout-guest", element: <CheckoutGuest /> },

      // Customer protected routes
      {
        element: <RequireAuth allowedRoles={["customer"]} />,
        children: [
          { path: "/my-orders", element: <ListOfOrder /> },
          { path: "/my-orders/:id", element: <OrderDetail /> },
        ],
      },
    ],
  },

  // Admin protected routes
  {
    element: <RequireAuth allowedRoles={["admin"]} />,
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
          { path: "voucher", element: <VoucherManagement /> },
          { path: "user-vouchers", element: <UserVoucherManagement /> },
          { path: "order", element: <OrderManagement /> },
          { path: "feedback-product", element: <ManageFeedbackProduct /> },
          { path: "feedback-barber", element: <ManageFeedbackBarber /> },
          { path: "discount-product", element: <ManageDiscountProduct /> },
        ],
      },
    ],
  },

  // Barber protected routes
  {
    element: <RequireAuth allowedRoles={["barber"]} />,
    children: [
      {
        path: "/barber",
        element: <BarberLayout />,
        children: [
          { index: true, element: <ManagingService /> },
          // bạn có thể thêm các route barber khác ở đây nếu cần
        ],
      },
    ],
  },

  // Optional: Role-based layout page (nếu bạn có)
]);

export default router;
