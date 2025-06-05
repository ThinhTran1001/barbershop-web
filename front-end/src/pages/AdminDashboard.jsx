import React from 'react';
import { Tabs } from 'antd';
import ProductManagement from '../components/ProductManagement';
import CategoryManagement from '../components/CategoryManagement';
// import BrandManagement from '../components/BrandManagement';
import BarberManagement from '../components/BarberManagement';
import UserManagement from '../components/UserManagement';

const { TabPane } = Tabs;

const AdminDashboard = () => {
  return (
    <div className="container mt-4">
      <h1>Admin Dashboard</h1>
      <Tabs defaultActiveKey="1" tabPosition='left'>
        <TabPane tab="Product Management" key="1">
          <ProductManagement />
        </TabPane>
        <TabPane tab="Category Management" key="2">
          <CategoryManagement />
        </TabPane>
        <TabPane tab="Barber Management" key="4">
          <BarberManagement />
        </TabPane>
        <TabPane tab="User Management" key="5">
          <UserManagement />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;