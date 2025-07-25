import React, { useState } from 'react';
import { Layout, Tabs, Typography } from 'antd';
import { 
  CalendarOutlined, 
  HistoryOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import BarberAbsenceRequest from '../../components/absence/BarberAbsenceRequest';
import BarberAbsenceHistory from '../../components/absence/BarberAbsenceHistory';

const { Content } = Layout;
const { Title } = Typography;

const BarberAbsencePage = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleRequestSubmitted = (newAbsence) => {
    // Switch to history tab and refresh the list
    setActiveTab('history');
    setRefreshHistory(prev => prev + 1);
  };

  const tabItems = [
    {
      key: 'request',
      label: (
        <span>
          <PlusOutlined />
          Request Absence
        </span>
      ),
      children: (
        <BarberAbsenceRequest onRequestSubmitted={handleRequestSubmitted} />
      )
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          My Requests
        </span>
      ),
      children: (
        <BarberAbsenceHistory key={refreshHistory} />
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto',
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            padding: '24px 24px 0 24px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <CalendarOutlined style={{ marginRight: 12 }} />
              Absence Management
            </Title>
          </div>
          
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ padding: '0 24px' }}
            size="large"
          />
        </div>
      </Content>
    </Layout>
  );
};

export default BarberAbsencePage;
