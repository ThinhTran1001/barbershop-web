import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  message,
  Alert,
  Space,
  Divider
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const BarberSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    // Check if barber ID is already configured
    const storedBarberId = localStorage.getItem('barberId');
    if (storedBarberId) {
      setIsSetup(true);
      form.setFieldsValue({ barberId: storedBarberId });
    }
  }, [form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // In a real application, you would validate the barber ID with the backend
      // For now, we'll just store it in localStorage
      localStorage.setItem('barberId', values.barberId);
      
      message.success('Barber ID configured successfully!');
      setIsSetup(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/barber/dashboard');
      }, 2000);
      
    } catch (error) {
      message.error('Failed to configure Barber ID');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('barberId');
    setIsSetup(false);
    form.resetFields();
    message.info('Barber ID configuration reset');
  };

  if (isSetup) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        padding: 24 
      }}>
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircleOutlined 
              style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} 
            />
            <Title level={3}>Setup Complete!</Title>
            <Text type="secondary">
              Your barber profile is configured and ready to use.
            </Text>
          </div>

          <Alert
            message="Barber ID Configured"
            description={`Your Barber ID: ${localStorage.getItem('barberId')}`}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              block 
              onClick={() => navigate('/barber/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button 
              block 
              onClick={handleReset}
            >
              Reset Configuration
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      padding: 24 
    }}>
      <Card style={{ maxWidth: 500, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <UserOutlined 
            style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} 
          />
          <Title level={3}>Barber Profile Setup</Title>
          <Text type="secondary">
            Please configure your barber profile to access the dashboard.
          </Text>
        </div>

        <Alert
          message="Setup Required"
          description="You need to configure your Barber ID to access barber features. Please contact your administrator to get your Barber ID."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="barberId"
            label="Barber ID"
            rules={[
              { required: true, message: 'Please enter your Barber ID' },
              { min: 24, max: 24, message: 'Barber ID must be exactly 24 characters' }
            ]}
          >
            <Input
              placeholder="Enter your Barber ID (24 characters)"
              prefix={<UserOutlined />}
              maxLength={24}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              block
            >
              Save Configuration
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Don't have a Barber ID? Contact your administrator.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default BarberSetup;
