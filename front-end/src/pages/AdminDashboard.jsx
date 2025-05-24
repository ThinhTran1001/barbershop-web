import React from 'react';
import { Tabs } from 'antd';
import ProductManagement from '../components/ProductManagement';
import CategoryManagement from '../components/CategoryManagement';
import BrandManagement from '../components/BrandManagement';

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
        <TabPane tab="Brand Management" key="3">
          <BrandManagement />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;