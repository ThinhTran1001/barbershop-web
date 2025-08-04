import React, { useState } from 'react';
import {
  Card,
  Form,
  DatePicker,
  Select,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  Row,
  Col,
  Divider
} from 'antd';
import { toast } from 'react-toastify';
import {
  CalendarOutlined,
  PlusOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createBarberAbsence } from '../../services/barberAbsenceApi';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const BarberAbsenceRequest = ({ onRequestSubmitted }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState([]);

  const reasonOptions = [
    { value: 'sick_leave', label: 'Sick Leave' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'training', label: 'Training' },
    { value: 'personal', label: 'Personal' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (values) => {
    setLoading(true);

    // Show loading toast
    const loadingToastId = toast.loading('📝 Submitting your absence request...', {
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
    });

    try {
      const requestData = {
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        reason: values.reason,
        description: values.description
      };

      const response = await createBarberAbsence(requestData);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: `🎉 Absence request submitted successfully!\n📅 Period: ${values.dateRange[0].format('DD/MM/YYYY')} - ${values.dateRange[1].format('DD/MM/YYYY')}\n⏳ Status: Awaiting admin approval`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Show affected bookings if any
      if (response.affectedBookingsCount > 0) {
        setAffectedBookings(response.affectedBookings);
        toast.warn(
          `⚠️ ${response.affectedBookingsCount} existing booking(s) may be affected by this absence.\nThese bookings will need to be reassigned by admin upon approval.`,
          {
            position: "top-right",
            autoClose: 7000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }

      form.resetFields();

      // Notify parent component
      if (onRequestSubmitted) {
        onRequestSubmitted(response.absence);
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit absence request';

      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to submit absence request\n${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const validateDateRange = (_, value) => {
    if (!value || value.length !== 2) {
      return Promise.reject(new Error('Please select start and end dates'));
    }

    const [startDate, endDate] = value;
    const today = dayjs().startOf('day');

    if (startDate.isBefore(today)) {
      return Promise.reject(new Error('Start date cannot be in the past'));
    }

    if (endDate.isBefore(startDate)) {
      return Promise.reject(new Error('End date must be after start date'));
    }

    const daysDiff = endDate.diff(startDate, 'day') + 1;
    if (daysDiff > 30) {
      return Promise.reject(new Error('Absence period cannot exceed 30 days'));
    }

    return Promise.resolve();
  };

  const disabledDate = (current) => {
    // Disable past dates
    return current && current < dayjs().startOf('day');
  };

  const calculateDuration = (dateRange) => {
    if (!dateRange || dateRange.length !== 2) return 0;
    return dateRange[1].diff(dateRange[0], 'day') + 1;
  };

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <PlusOutlined style={{ marginRight: 8 }} />
          Request Absence
        </Title>
        <Text type="secondary">
          Submit a request for time off. All requests require admin approval.
        </Text>
      </div>

      <Alert
        message="Important Notice"
        description="Absence requests must be submitted in advance. If you have existing bookings during the requested period, they will need to be rescheduled or reassigned upon approval."
        type="info"
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 24 }}
        showIcon
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Form.Item
              name="dateRange"
              label="Absence Period"
              rules={[
                { required: true, message: 'Please select absence dates' },
                { validator: validateDateRange }
              ]}
            >
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['Start Date', 'End Date']}
                disabledDate={disabledDate}
                format="MMMM DD, YYYY"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: 'Please select a reason' }]}
            >
              <Select
                placeholder="Select reason for absence"
                size="large"
              >
                {reasonOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Additional Details (Optional)"
        >
          <TextArea
            rows={4}
            placeholder="Provide any additional information about your absence request..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Duration Display */}
        <Form.Item shouldUpdate={(prevValues, currentValues) => 
          prevValues.dateRange !== currentValues.dateRange
        }>
          {({ getFieldValue }) => {
            const dateRange = getFieldValue('dateRange');
            const duration = calculateDuration(dateRange);
            
            return duration > 0 ? (
              <Alert
                message={`Duration: ${duration} day${duration > 1 ? 's' : ''}`}
                type="success"
                style={{ marginBottom: 16 }}
              />
            ) : null;
          }}
        </Form.Item>

        <Divider />

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CalendarOutlined />}
              size="large"
            >
              Submit Request
            </Button>
            <Button
              onClick={() => form.resetFields()}
              disabled={loading}
              size="large"
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Affected Bookings Alert */}
      {affectedBookings.length > 0 && (
        <Alert
          message="Affected Bookings"
          description={
            <div>
              <p>The following bookings may be affected by your absence request:</p>
              <ul>
                {affectedBookings.map((booking, index) => (
                  <li key={index}>
                    {booking.customerName} - {booking.serviceName} on{' '}
                    {dayjs(booking.originalDate).format('MMMM DD, YYYY')}
                  </li>
                ))}
              </ul>
              <p>These bookings will be handled by the admin upon approval of your request.</p>
            </div>
          }
          type="warning"
          style={{ marginTop: 16 }}
          showIcon
        />
      )}
    </Card>
  );
};

export default BarberAbsenceRequest;
