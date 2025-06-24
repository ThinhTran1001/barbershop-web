import React from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductManagement from '../../components/ProductManagement.jsx';
import CategoryManagement from '../../components/CategoryManagement.jsx';
import BrandManagement from '../../components/BrandManagement.jsx';
import ManagingService from '../pages/ManagingService/ManagingService.jsx';
import BarberManagement from '../../components/BarberManagement.jsx';
import UserManagement from '../../components/UserManagement.jsx';
import ManageFeedbackProduct from '../ManageFeedbackProduct/ManageFeedbackProduct.jsx';
import ManageFeedbackBarber from '../ManageFeedbackBarber/ManageFeedbackBarber.jsx';
import ManageDiscountProduct from '../ManageDiscountProduct/ManageDiscountProduct.jsx';

const { TabPane } = Tabs;

// Map giữa key và path
const tabKeyToPath = {
  '1': 'product',
  '2': 'category',
  '3': 'brand',
  '4': 'service',
  '5': 'barber',
  '6': 'user',
  '7': 'feedback-product',
  '8': 'feedback-barber',
  '9': 'discount-product', 
};

const pathToTabKey = {
  'product': '1',
  'category': '2',
  'brand': '3',
  'service': '4',
  'barber': '5',
  'user': '6',
  'feedback-product': '7',
  'feedback-barber': '8',
  'discount-product': '9', 
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
        <TabPane tab="Barber Management" key="5">
          <BarberManagement />
          </TabPane>
        <TabPane tab="User Management" key="6">
          <UserManagement />
          </TabPane>
        <TabPane tab= "Feedback Product Management" key="7">
          <ManageFeedbackProduct/>
          </TabPane>
        <TabPane tab="Feedback Barber Management" key="8">
          <ManageFeedbackBarber/>
          </TabPane>
        <TabPane tab="Discount Product Management" key="9">
          <ManageDiscountProduct/>
          </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;