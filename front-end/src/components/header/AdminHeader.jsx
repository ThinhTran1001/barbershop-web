import { Layout, Button, Breadcrumb, Space } from "antd";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoutOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";

const { Header } = Layout;

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Generate breadcrumb based on current path
  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items = [{ title: 'Admin' }];

    if (pathSegments.length > 1) {
      const currentPage = pathSegments[1];
      const pageNames = {
        'product': 'Sản phẩm',
        'brand': 'Thương hiệu',
        'category': 'Danh mục',
        'service': 'Dịch vụ',
        'barber': 'Thợ cắt tóc',
        'barber-schedule': 'Lịch làm việc',
        'absence-management': 'Quản lý nghỉ phép',
        'user': 'Người dùng',
        'voucher': 'Voucher',
        'user-vouchers': 'Voucher người dùng',
        'order': 'Đơn hàng',
        'appointment': 'Lịch hẹn',
        'booking-confirmation': 'Xác nhận booking',
        'noshow-management': 'Quản lý no-show',
        'feedback-product': 'Phản hồi sản phẩm',
        'feedback-barber': 'Phản hồi thợ cắt',
        'discount-product': 'Giảm giá sản phẩm',
        'statistics': 'Thống kê',
        'manage-blog': 'Quản lý blog'
      };

      items.push({ title: pageNames[currentPage] || currentPage });
    }

    return items;
  };

  return (
    <Header
      style={{
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 99,
        marginLeft: 280, // Account for sidebar width
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Breadcrumb */}
      <Breadcrumb items={getBreadcrumbItems()} />

      {/* User info + actions */}
      <Space size="middle">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ color: '#666' }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#666'
        }}>
          <UserOutlined />
          <span>{user?.name}</span>
          <span style={{ color: '#999' }}>({user?.role})</span>
        </div>
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Đăng xuất
        </Button>
      </Space>
    </Header>
  );
};

export default AdminHeader;
