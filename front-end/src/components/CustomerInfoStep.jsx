import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Checkbox,
  Button,
  Alert,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Tag
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;
const { TextArea } = Input;

const notificationOptions = [
  { label: 'Email Notification', value: 'email' },
  { label: 'SMS Notification', value: 'sms' },
  { label: 'Push Notification', value: 'push' },
];

const CustomerInfoStep = ({
  service,
  timeSlot,
  barber,
  isAutoAssign,
  onCustomerInfoSubmit,
  customerInfo
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Auto-fill form with user data and existing customer info
  useEffect(() => {
    const initialValues = {
      customerName: customerInfo?.customerName || user?.name || '',
      customerEmail: customerInfo?.customerEmail || user?.email || '',
      customerPhone: customerInfo?.customerPhone || user?.phone || '',
      note: customerInfo?.note || '',
      notificationMethods: customerInfo?.notificationMethods || ['email']
    };

    form.setFieldsValue(initialValues);

    // Trigger validation after auto-fill to enable button if data is sufficient
    setTimeout(() => {
      handleFormChange();
    }, 100);
  }, [user, customerInfo, form]);

  // Handle form submission (when user clicks Review Booking)
  const handleFinish = async (values) => {
    setLoading(true);

    try {
      // Add default notification method if none selected
      if (!values.notificationMethods || values.notificationMethods.length === 0) {
        values.notificationMethods = ['email'];
      }


      onCustomerInfoSubmit(values);
    } catch (error) {
      console.error('Error submitting customer info:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes (auto-save without navigation)
  const handleFormChange = () => {
    // Only validate required fields: Full Name and Phone Number
    form.validateFields(['customerName', 'customerPhone'])
      .then((values) => {
        // Check if both required fields have values
        const hasName = values.customerName && values.customerName.trim();
        const hasPhone = values.customerPhone && values.customerPhone.trim();

        if (hasName && hasPhone) {
          setFormData(values);
          setIsFormValid(true);
        } else {
          setIsFormValid(false);
        }

        // DO NOT call onCustomerInfoSubmit here - only save locally
      })
      .catch(() => {
        // Form has errors in required fields
        setIsFormValid(false);
      });
  };

  // Handle manual submit (Review Booking button)
  const handleReviewBooking = () => {
    // Validate all required fields when submitting
    form.validateFields(['customerName', 'customerEmail', 'customerPhone', 'notificationMethods'])
      .then((values) => {
        // Get all form values including optional fields (including notes)
        const allValues = form.getFieldsValue();
        handleFinish(allValues);
      })
      .catch((errorInfo) => {
        // Show specific error message
        const missingFields = errorInfo.errorFields.map(field => field.name[0]).join(', ');
        toast.error(`Please fill in required fields: ${missingFields}`);
      });
  };

  return (
    <div className="customer-info-step">
      {/* Booking Summary */}
      <Card 
        size="small" 
        style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            Booking Summary
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" size="small">
              <div>
                <Text strong>Service:</Text>
                <div>{service?.name}</div>
                <Space size="small" wrap style={{ marginTop: '4px' }}>
                  <Tag icon={<ClockCircleOutlined />} color="blue">
                    {service?.durationMinutes || 30} min
                  </Tag>
                  <Tag color="green">
                    {service?.price?.toLocaleString()} VND
                  </Tag>
                </Space>
              </div>
            </Space>
          </Col>
          
          <Col xs={24} sm={12}>
            <Space direction="vertical" size="small">
              <div>
                <Text strong>Appointment:</Text>
                <div>{timeSlot?.label}</div>
                <Space size="small" wrap style={{ marginTop: '4px' }}>
                  <Tag icon={<CalendarOutlined />} color="blue">
                    {timeSlot?.date}
                  </Tag>
                  <Tag icon={<ClockCircleOutlined />} color="green">
                    {timeSlot?.time}
                  </Tag>
                </Space>
              </div>
            </Space>
          </Col>
        </Row>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div>
          <Text strong>Barber:</Text>
          <div>
            {isAutoAssign ? (
              <Space>
                <Text>Auto-assigned: {barber?.name || 'Best available barber'}</Text>
                <Tag color="gold">Recommended</Tag>
              </Space>
            ) : (
              <Space>
                <Text>{barber?.name || 'Not selected'}</Text>
                {barber?.averageRating && (
                  <Tag color="gold">★ {barber.averageRating.toFixed(1)}</Tag>
                )}
              </Space>
            )}
          </div>
        </div>
      </Card>

      {/* User Info Alert */}
      {user && (
        <Alert
          message="Your information has been auto-filled"
          description="You can edit the information below if needed."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Customer Information Form */}
      <Card 
        title={
          <Space>
            <EditOutlined style={{ color: '#1890ff' }} />
            Your Contact Information
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Full Name"
                name="customerName"
                rules={[
                  { required: true, message: 'Please enter your full name!' },
                  { min: 2, message: 'Name must be at least 2 characters!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Enter your full name" 
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email Address"
                name="customerEmail"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />}
                  placeholder="example@email.com" 
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Phone Number"
                name="customerPhone"
                rules={[
                  { required: true, message: 'Please enter your phone number!' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Phone number must be 10-11 digits!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />}
                  placeholder="0123456789" 
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                label="Notification Preferences"
                name="notificationMethods"
                rules={[
                  { required: true, message: 'Please select at least one notification method!' }
                ]}
              >
                <Checkbox.Group 
                  options={notificationOptions}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={
              <span>
                Special Requests / Notes
                <Tag color="default" style={{ marginLeft: '8px', fontSize: '10px' }}>
                  Optional
                </Tag>
              </span>
            }
            name="note"
          >
            <TextArea
              rows={4}
              placeholder="Any special requests or notes for your barber? (e.g., preferred hair length, styling preferences, etc.) - This field is optional."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Review Booking Button */}
          <Form.Item style={{ marginTop: '24px', textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleReviewBooking}
              loading={loading}
              disabled={!isFormValid}
              style={{
                minWidth: '200px',
                height: '50px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Review Booking
            </Button>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              {isFormValid
                ? 'Click to review your booking details'
                : 'Please fill in Full Name and Phone Number to continue'
              }
            </div>
          </Form.Item>
        </Form>
      </Card>

      {/* Instructions */}
      <Card 
        size="small" 
        style={{ marginTop: '16px', backgroundColor: '#f0f8ff' }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            Important Information
          </Space>
        }
      >
        <Space direction="vertical" size="small">
          <Text>
            • Please ensure your contact information is accurate for booking confirmations
          </Text>
          <Text>
            • You will receive notifications about your appointment status via your selected methods
          </Text>
          <Text>
            • Special requests will be shared with your barber before the appointment
          </Text>
          <Text type="secondary">
            • All information is kept confidential and used only for appointment management
          </Text>
        </Space>
      </Card>

      {/* Current Form Status */}
      {customerInfo && (
        <Alert
          message="Information Saved"
          description="Your contact information has been saved and will be used for the booking."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginTop: '16px' }}
        />
      )}
    </div>
  );
};

export default CustomerInfoStep;
