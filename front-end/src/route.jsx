import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./middleware/RequireAuth";
import CommonLayout from "./pages/layout/CommonLayout.jsx";
import AdminLayout from "./pages/layout/AdminLayout.jsx";
import BarberLayout from "./pages/layout/BarberLayout.jsx";
import RoleBasedLayout from "./pages/layout/RoleBasedLayout.jsx";

import Landing from "./pages/home/Landing.jsx";
import Login from "./pages/auth/LoginPage.jsx";
import Register from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm.jsx";
import ResetPasswordForm from "./components/auth/ResetPasswordForm.jsx";
import ProductList from "./pages/home/prodductList.jsx";
import ProductDetail from "./components/product/ProductDetail.jsx";
import Checkout from "./pages/checkout/Checkout.jsx";
import CheckoutGuest from "./pages/checkout/CheckoutGuest.jsx";
import OrderSuccess from "./pages/checkout/OrderSuccess.jsx";
import OrderFail from "./pages/checkout/OrderFail.jsx";
import OrderSuccessPayOS from "./pages/checkout/OrderSuccessPayOS.jsx";
import CustomerProfile from "./components/profile/customerProfile.jsx";
import Cart from "./components/cart/Cart";
import UserCart from "./components/cart/UserCart";
import ListOfOrder from "./pages/order/ListOfOrder.jsx";
import OrderDetail from "./pages/order/OrderDetail.jsx";
import ProductManagement from "./components/ProductManagement.jsx";
import BrandManagement from "./components/BrandManagement.jsx";
import CategoryManagement from "./components/CategoryManagement.jsx";
import BarberManagement from "./components/BarberManagement.jsx";
import UserManagement from "./components/UserManagement.jsx";
import VoucherManagement from "./components/VoucherManagemet.jsx";
import UserVoucherManagement from "./components/UserVoucherManagement.jsx";
import OrderManagement from "./components/OrderManagement.jsx";
import ManagingService from "./pages/ManagingService/ManagingService.jsx";
import ManageFeedbackProduct from "./pages/ManageFeedbackProduct/ManageFeedbackProduct.jsx";
import ManageFeedbackBarber from "./pages/ManageFeedbackBarber/ManageFeedbackBarber.jsx";
import ManageDiscountProduct from "./pages/ManageDiscountProduct/ManageDiscountProduct.jsx";
import Appointment from "./components/Appointment.jsx";
import FeedbackProduct from "./pages/FeedbackProduct/FeedbackProduct.jsx";
import OauthSuccess from "./pages/auth/OauthSuccess.jsx";
import BarberDashboard from "./pages/Barber/BarberDashboard.jsx";
import BarberCalendarPage from "./pages/Barber/BarberCalendarPage.jsx";
import BarberBookingManagement from "./pages/Barber/BarberBookingManagement.jsx";
import BarberScheduleManagement from "./pages/Admin/BarberScheduleManagement.jsx";
import AbsenceManagement from "./pages/Admin/AbsenceManagement.jsx";
import BookingConfirmationManagement from "./pages/Admin/BookingConfirmationManagement.jsx";
import BarberSetup from "./pages/Barber/BarberSetup.jsx";
import BookingFeedbackPage from "./pages/Feedback/BookingFeedbackPage.jsx";
import MyFeedbackPage from "./pages/Feedback/MyFeedbackPage.jsx";
import AboutPage from "./components/landing/about/About.jsx";
import BlogPage from "./components/landing/blog/BlogPage.jsx";
import BlogDetail from "./components/landing/blog/BlogDetail.jsx";
import ContactPage from "./components/landing/contact/ContactPage.jsx";
import Statistics from "./pages/dashboard/statistics.jsx";
import ServiceListPage from "./pages/ServiceBooking/ServiceListPage.jsx";
import BarberSelectionPage from "./pages/ServiceBooking/BarberSelectionPage.jsx";
import TimeSlotPickerPage from "./pages/ServiceBooking/TimeSlotPickerPage.jsx";
import BookingPage from "./pages/barber/BookingPage.jsx";
import BookingInfoPage from "./pages/ServiceBooking/BookingInfoPage.jsx";
import MyBookingsPage from "./pages/ServiceBooking/MyBookingsPage.jsx";
import SinglePageBooking from "./pages/ServiceBooking/SinglePageBooking.jsx";
import UserVouchers from "./pages/user/UserVouchers.jsx";
import ManageBlog from "./pages/ManageBlog/ManageBlog.jsx";
import BarberProfile from "./components/profile/baberProfile.jsx";
import FeedbackBarber from "./pages/FeedbackBarber/FeedbackBarber.jsx";
import NoShowManagement from "./pages/Admin/NoShowManagement.jsx";
import BarberAbsencePage from "./pages/barber/BarberAbsencePage.jsx";


const router = createBrowserRouter([
  {
    element: <CommonLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/forgot-password", element: <ForgotPasswordForm /> },
      { path: "/reset-password", element: <ResetPasswordForm /> },
      { path: "/oauth-success", element: <OauthSuccess /> },
      { path: "/products", element: <ProductList /> },
      { path: "/products/:id", element: <ProductDetail /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/checkout-guest", element: <CheckoutGuest /> },
      { path: "/order-success", element: <OrderSuccess /> },
      { path: "/order-fail", element: <OrderFail /> },
      { path: "/payos-success", element: <OrderSuccessPayOS /> },
      { path: "/cart-guest", element: <Cart /> },
      { path: "/cart", element: <UserCart /> },
      { path: "/profile", element: <CustomerProfile /> },
      { path: "/browse-services", element: <ServiceListPage /> },
      { path: "/book-service", element: <SinglePageBooking /> },

      // Legacy booking routes - maintained for backward compatibility
      { path: "/choose-barber", element: <BarberSelectionPage /> },
      { path: "/choose-time-slot", element: <TimeSlotPickerPage /> },
      { path: "/booking-info", element: <BookingInfoPage /> },

      // Redirect legacy booking entry points to new single-page flow
      { path: "/start-booking", element: <Navigate to="/book-service" replace /> },
      { path: "/new-booking", element: <Navigate to="/book-service" replace /> },
      { path: "/my-booking", element: <MyBookingsPage /> },
      { path: "/feedback/:bookingId", element: <BookingFeedbackPage /> },
      { path: "/my-feedback", element: <MyFeedbackPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/news", element: <BlogPage /> },
      { path: "/news/:id", element: <BlogDetail /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/feedback-order/:orderId", element: <FeedbackProduct /> },
      { path: "/feedback-barber/:bookingId", element: <FeedbackBarber/> },
      // Protected Customer Routes
      {
        element: <RequireAuth allowedRoles={["customer"]} />,
        children: [
          
          { path: "/my-orders", element: <ListOfOrder /> },
          { path: "/my-orders/:id", element: <OrderDetail /> },
          { path: "/feedback/:orderId", element: <FeedbackProduct /> },
          { path: "/my-vouchers", element: <UserVouchers /> },
        ],
      },
    ],
  },

  // Admin Routes
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
          { path: "appointment", element: <Appointment /> },
          { path: "barber-schedule", element: <BarberScheduleManagement /> },
          { path: "absence-management", element: <AbsenceManagement /> },
          { path: "booking-confirmation", element: <BookingConfirmationManagement /> },
          { path: "noshow-management", element: <NoShowManagement /> },
          { path: "statistics", element: <Statistics /> },
          { path: "manage-blog", element: <ManageBlog /> },
        ],
      },
    ],
  },

  // Barber Routes
  {
    element: <RequireAuth allowedRoles={["barber"]} />,
    children: [
      {
        path: "/barber",
        element: <BarberLayout />,
        children: [
          { index: true, element: <BarberCalendarPage /> },
          { path: "setup", element: <BarberSetup /> },
          { path: "calendar", element: <BarberCalendarPage /> },
          { path: "bookings", element: <BarberBookingManagement /> },
          { path: "absence", element: <BarberAbsencePage /> },
          { path: "customers", element: <BarberBookingManagement /> },
          { path: "feedback", element: <BarberBookingManagement /> },
          { path: "performance", element: <BarberBookingManagement /> },
          { path: "profile", element: <BarberProfile /> },
        ],
      },
    ],
  },

  // Role-based fallback
  {
    path: "/dashboard",
    element: <RoleBasedLayout />,
  },
]);

export default router;
