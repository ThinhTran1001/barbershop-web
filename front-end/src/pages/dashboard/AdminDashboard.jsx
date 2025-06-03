import React from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductManagement from '../../components/ProductManagement.jsx';
import CategoryManagement from '../../components/CategoryManagement.jsx';
import BrandManagement from '../../components/BrandManagement.jsx';
import ManagingService from '../pages/ManagingService/ManagingService.jsx';
import ManageFeedbackProduct from '../ManageFeedbackProduct/ManageFeedbackProduct.jsx';

const { TabPane } = Tabs;

// Map giữa key và path
const tabKeyToPath = {
  '1': 'product',
  '2': 'category',
  '3': 'brand',
  '4': 'service',
  '7': 'feedback-product',
};

const pathToTabKey = {
  'product': '1',
  'category': '2',
  'brand': '3',
  'service': '4',
  'feedback-product': '7',
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTabPath = location.pathname.split('/').pop();
  const activeKey = pathToTabKey[currentTabPath] || '1';

  const handleTabChange = (key) => {
    const path = tabKeyToPath[key] || 'product';
    navigate(`/admin/${path}`);
  };

  return (
    <div className="container mt-4">
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        tabPosition="left"
      >
        <TabPane tab="Product Management" key="1">
          <ProductManagement />
        </TabPane>
        <TabPane tab="Category Management" key="2">
          <CategoryManagement />
        </TabPane>
        <TabPane tab="Brand Management" key="3">
          <BrandManagement />
        </TabPane>
        <TabPane tab="Service Management" key="4">
          <ManagingService />
        </TabPane>
        <TabPane tab= "Feedback Product Management" key="7">
          <ManageFeedbackProduct/>
          </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;