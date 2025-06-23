import { Routes, Route } from "react-router-dom";
import Landing from "./pages/home/Landing.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import AdminLayout from "./pages/layout/AdminLayout.jsx";
import BarberLayout from "./pages/layout/BarberLayout.jsx";
import CommonLayout from "./pages/layout/CommonLayout.jsx";
import ProductManagement from "./components/ProductManagement.jsx";
import BrandManagement from "./components/BrandManagement.jsx";
import CategoryManagement from "./components/CategoryManagement.jsx";
import UserManagement from "./components/UserManagement.jsx";
import BarberManagement from "./components/BarberManagement.jsx";
import VoucherManagement from "./components/VoucherManagemet.jsx";
import OrderManagement from "./components/OrderManagement.jsx";
import ProductDetail from './components/product/ProductDetail';
import ServiceBooking from './pages/ServiceBooking/ServiceBooking';
import ManagingService from './pages/ManagingService/ManagingService';
import RequireAuth from './middleware/RequireAuth';
import ListOfOrder from './pages/order/ListOfOrder';
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm.jsx";
import ResetPasswordForm from "./components/auth/ResetPasswordForm.jsx";
import OrderDetail from "./pages/order/OrderDetail";
import ProdductList from "./pages/home/prodductList";
import UserVoucherManagement from "./components/UserVoucherManagement";

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public and Common Routes */}
            <Route element={<CommonLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/service-booking" element={<ServiceBooking />} />

                {/* Protected Customer Routes */}
                <Route element={<RequireAuth allowedRoles={['customer']} />}>
                    <Route path="/my-orders" element={<ListOfOrder />} />
                    <Route path="/my-orders/:id" element={<OrderDetail />} />
                </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<RequireAuth allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<ProductManagement />} />
                    <Route path="product" element={<ProductManagement />} />
                    <Route path="brand" element={<BrandManagement />} />
                    <Route path="category" element={<CategoryManagement />} />
                    <Route path="service" element={<ManagingService />} />
                    <Route path="barber" element={<BarberManagement />} />
                    <Route path="user" element={<UserManagement />} />
                    <Route path="voucher" element={<VoucherManagement />} />
                    <Route path="user-vouchers" element={<UserVoucherManagement />} />
                    <Route path="order" element={<OrderManagement />} />
                </Route>
            </Route>

            {/* Protected Barber Routes */}
            <Route element={<RequireAuth allowedRoles={['barber']} />}>
                <Route path="/barber" element={<BarberLayout />}>
                    <Route index element={<ManagingService />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default AppRoutes;
