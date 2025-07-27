import React, { useState } from 'react';
import { Button, Tooltip, Alert, Space, Typography, Tag, Modal } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import useBookingCompletion from '../hooks/useBookingCompletion';
import { updateBookingStatus } from '../services/serviceApi';

const { Text } = Typography;

/**
 * BookingCompletionButton component with time-based validation
 * Shows completion button only when within the allowed time window
 */
const BookingCompletionButton = ({ 
  booking, 
  onStatusUpdate, 
  size = 'small',
  showTimeInfo = true,
  showStatusMessage = true,
  refreshInterval = 30000 
}) => {
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const {
    canComplete,
    reason,
    timeInfo,
    loading,
    error,
    autoRefresh,
    refresh,
    toggleAutoRefresh,
    getButtonProps,
    getStatusMessage,
    getFormattedTimeInfo,
    getCountdownInfo,
    isStartingSoon
  } = useBookingCompletion(booking._id, refreshInterval);

  const handleComplete = async () => {
    if (!canComplete) {
      return;
    }

    setUpdating(true);
    try {
      await updateBookingStatus(booking._id, 'completed');
      
      if (onStatusUpdate) {
        onStatusUpdate(booking._id, 'completed');
      }

      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error completing booking:', error);
    } finally {
      setUpdating(false);
    }
  };

  const buttonProps = getButtonProps();
  const statusMessage = getStatusMessage();
  const formattedTimeInfo = getFormattedTimeInfo();
  const countdownInfo = getCountdownInfo();

  // Don't render if booking is not confirmed
  if (booking.status !== 'confirmed') {
    return null;
  }

  const renderTimeInfo = () => {
    if (!showTimeInfo || !formattedTimeInfo) return null;

    return (
      <div style={{ marginTop: 8, fontSize: '12px' }}>
        <Space direction="vertical" size={2}>
          <Text type="secondary">
            <ClockCircleOutlined /> Hiện tại: {formattedTimeInfo.currentTime}
          </Text>
          <Text type="secondary">
            Booking: {formattedTimeInfo.bookingWindow}
          </Text>
          {formattedTimeInfo.isInGracePeriod && (
            <Text type="warning">
              Gia hạn đến: {formattedTimeInfo.graceWindow}
            </Text>
          )}
        </Space>
      </div>
    );
  };

  const renderCountdown = () => {
    if (!countdownInfo || countdownInfo.hasStarted) return null;

    return (
      <Alert
        message={countdownInfo.message}
        type={countdownInfo.isStartingSoon ? "warning" : "info"}
        size="small"
        showIcon
        style={{ marginTop: 8 }}
      />
    );
  };

  const renderStatusMessage = () => {
    if (!showStatusMessage || !statusMessage) return null;

    return (
      <Alert
        message={statusMessage.message}
        type={statusMessage.type}
        size="small"
        showIcon
        style={{ marginTop: 8 }}
      />
    );
  };

  const renderAutoRefreshIndicator = () => {
    return (
      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <Space>
          <Tag 
            color={autoRefresh ? 'green' : 'default'} 
            style={{ cursor: 'pointer' }}
            onClick={toggleAutoRefresh}
          >
            {autoRefresh ? 'Tự động cập nhật' : 'Cập nhật thủ công'}
          </Tag>
          <Button 
            type="link" 
            size="small" 
            onClick={refresh}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <div>
      <Tooltip title={buttonProps.title}>
        <Button
          {...buttonProps}
          size={size}
          icon={<CheckCircleOutlined />}
          loading={updating || loading}
          onClick={() => {
            if (canComplete) {
              setShowConfirmModal(true);
            }
          }}
        />
      </Tooltip>

      {renderCountdown()}
      {renderStatusMessage()}
      {renderTimeInfo()}
      {renderAutoRefreshIndicator()}

      {/* Confirmation Modal */}
      <Modal
        title="Xác nhận hoàn thành booking"
        open={showConfirmModal}
        onOk={handleComplete}
        onCancel={() => setShowConfirmModal(false)}
        confirmLoading={updating}
        okText="Hoàn thành"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Khách hàng:</Text> {booking.customerName}
          </div>
          <div>
            <Text strong>Dịch vụ:</Text> {booking.serviceId?.name}
          </div>
          <div>
            <Text strong>Thời gian:</Text> {new Date(booking.bookingDate).toLocaleString('vi-VN')}
          </div>
          
          {formattedTimeInfo && (
            <Alert
              message={`Hoàn thành ${formattedTimeInfo.windowStatus || 'trong thời gian cho phép'}`}
              type="success"
              showIcon
            />
          )}
          
          <Text type="secondary">
            Bạn có chắc chắn muốn đánh dấu booking này là đã hoàn thành?
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default BookingCompletionButton;
