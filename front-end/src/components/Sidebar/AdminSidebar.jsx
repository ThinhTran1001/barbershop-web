import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  AppstoreOutlined,
  ScissorOutlined,
  TeamOutlined,
  UserOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  PercentageOutlined,
  CommentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ProductOutlined,
  CrownOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { SubMenu } = Menu;

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Get current selected key based on pathname
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/product')) return 'product';
    if (path.includes('/admin/brand')) return 'brand';
    if (path.includes('/admin/category')) return 'category';
    if (path.includes('/admin/service')) return 'service';
    if (path.includes('/admin/barber-schedule')) return 'barber-schedule';
    if (path.includes('/admin/absence-management')) return 'absence-management';
    if (path.includes('/admin/barber')) return 'barber';
    if (path.includes('/admin/user-vouchers')) return 'user-vouchers';
    if (path.includes('/admin/user')) return 'user';
    if (path.includes('/admin/voucher')) return 'voucher';
    if (path.includes('/admin/order')) return 'order';
    if (path.includes('/admin/discount-product')) return 'discount-product';
    if (path.includes('/admin/feedback-product')) return 'feedback-product';
    if (path.includes('/admin/feedback-barber')) return 'feedback-barber';
    if (path.includes('/admin/appointment')) return 'appointment';
    if (path.includes('/admin/booking-confirmation')) return 'booking-confirmation';
    if (path.includes('/admin/noshow-management')) return 'noshow-management';
    if (path.includes('/admin/statistics')) return 'statistics';
    if (path.includes('/admin/manage-blog')) return 'manage-blog';
    return 'dashboard';
  };

  // Get open keys for submenus
  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys = [];
    
    if (path.includes('/admin/product') || path.includes('/admin/brand') || path.includes('/admin/category')) {
      openKeys.push('products');
    }
    if (path.includes('/admin/service') || path.includes('/admin/barber') || path.includes('/admin/barber-schedule') || path.includes('/admin/absence-management')) {
      openKeys.push('services');
    }
    if (path.includes('/admin/appointment') || path.includes('/admin/booking-confirmation') || path.includes('/admin/noshow-management')) {
      openKeys.push('bookings');
    }
    if (path.includes('/admin/order') || path.includes('/admin/voucher') || path.includes('/admin/user-vouchers') || path.includes('/admin/discount-product')) {
      openKeys.push('sales');
    }
    if (path.includes('/admin/feedback-product') || path.includes('/admin/feedback-barber')) {
      openKeys.push('feedback');
    }
    
    return openKeys;
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/admin/statistics')
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: 'Quản lý sản phẩm',
      children: [
        {
          key: 'product',
          icon: <ProductOutlined />,
          label: 'Sản phẩm',
          onClick: () => navigate('/admin/product')
        },
        {
          key: 'brand',
          icon: <CrownOutlined />,
          label: 'Thương hiệu',
          onClick: () => navigate('/admin/brand')
        },
        {
          key: 'category',
          icon: <AppstoreOutlined />,
          label: 'Danh mục',
          onClick: () => navigate('/admin/category')
        }
      ]
    },
    {
      key: 'services',
      icon: <ScissorOutlined />,
      label: 'Quản lý dịch vụ',
      children: [
        {
          key: 'service',
          icon: <ScissorOutlined />,
          label: 'Dịch vụ',
          onClick: () => navigate('/admin/service')
        },
        {
          key: 'barber',
          icon: <TeamOutlined />,
          label: 'Thợ cắt tóc',
          onClick: () => navigate('/admin/barber')
        },
        {
          key: 'barber-schedule',
          icon: <CalendarOutlined />,
          label: 'Lịch làm việc',
          onClick: () => navigate('/admin/barber-schedule')
        },
        {
          key: 'absence-management',
          icon: <ExclamationCircleOutlined />,
          label: 'Quản lý nghỉ phép',
          onClick: () => navigate('/admin/absence-management')
        }
      ]
    },
    {
      key: 'bookings',
      icon: <CalendarOutlined />,
      label: 'Quản lý đặt lịch',
      children: [
        {
          key: 'appointment',
          icon: <CalendarOutlined />,
          label: 'Lịch hẹn',
          onClick: () => navigate('/admin/appointment')
        },
        {
          key: 'booking-confirmation',
          icon: <CheckCircleOutlined />,
          label: 'Xác nhận booking',
          onClick: () => navigate('/admin/booking-confirmation')
        },
        {
          key: 'noshow-management',
          icon: <ExclamationCircleOutlined />,
          label: 'Quản lý no-show',
          onClick: () => navigate('/admin/noshow-management')
        }
      ]
    },
    {
      key: 'sales',
      icon: <ShoppingCartOutlined />,
      label: 'Quản lý bán hàng',
      children: [
        {
          key: 'order',
          icon: <ShoppingCartOutlined />,
          label: 'Đơn hàng',
          onClick: () => navigate('/admin/order')
        },
        {
          key: 'voucher',
          icon: <GiftOutlined />,
          label: 'Voucher',
          onClick: () => navigate('/admin/voucher')
        },
        {
          key: 'user-vouchers',
          icon: <TagsOutlined />,
          label: 'Voucher người dùng',
          onClick: () => navigate('/admin/user-vouchers')
        },
        {
          key: 'discount-product',
          icon: <PercentageOutlined />,
          label: 'Giảm giá sản phẩm',
          onClick: () => navigate('/admin/discount-product')
        }
      ]
    },
    {
      key: 'feedback',
      icon: <CommentOutlined />,
      label: 'Quản lý phản hồi',
      children: [
        {
          key: 'feedback-product',
          icon: <CommentOutlined />,
          label: 'Phản hồi sản phẩm',
          onClick: () => navigate('/admin/feedback-product')
        },
        {
          key: 'feedback-barber',
          icon: <CommentOutlined />,
          label: 'Phản hồi thợ cắt',
          onClick: () => navigate('/admin/feedback-barber')
        }
      ]
    },
    {
      key: 'user',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng',
      onClick: () => navigate('/admin/user')
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: 'Thống kê',
      onClick: () => navigate('/admin/statistics')
    },
    {
      key: 'manage-blog',
      icon: <FileTextOutlined />,
      label: 'Quản lý blog',
      onClick: () => navigate('/admin/manage-blog')
    }
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={280}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)'
      }}
      theme="light"
    >
      {/* Logo */}
      <div 
        style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/admin')}
      >
        <span style={{ 
          fontSize: collapsed ? '20px' : '18px', 
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          {collapsed ? '🧔‍♂️' : '🧔‍♂️ Barber Admin'}
        </span>
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        style={{ borderRight: 0, marginTop: 8 }}
        items={menuItems}
      />
    </Sider>
  );
};

export default AdminSidebar;
