import React from 'react';
import { Tag } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';

/**
 * Reusable component for displaying absence request status
 * @param {Object} props
 * @param {boolean} props.isApproved - Approval status of the absence request
 * @param {string} props.size - Size of the badge ('small', 'default', 'large')
 * @param {boolean} props.showIcon - Whether to show status icon
 * @returns {JSX.Element}
 */
const AbsenceStatusBadge = ({ 
  isApproved, 
  size = 'default', 
  showIcon = true 
}) => {
  const getStatusConfig = () => {
    if (isApproved === true) {
      return {
        color: 'success',
        text: 'Approved',
        icon: <CheckCircleOutlined />
      };
    } else if (isApproved === false) {
      return {
        color: 'error',
        text: 'Rejected',
        icon: <CloseCircleOutlined />
      };
    } else {
      // isApproved is null or undefined - pending status
      return {
        color: 'processing',
        text: 'Pending',
        icon: <ClockCircleOutlined />
      };
    }
  };

  const config = getStatusConfig();

  return (
    <Tag 
      color={config.color} 
      icon={showIcon ? config.icon : null}
      style={{ 
        fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
        padding: size === 'small' ? '2px 6px' : size === 'large' ? '6px 12px' : '4px 8px',
        borderRadius: '4px',
        fontWeight: '500'
      }}
    >
      {config.text}
    </Tag>
  );
};

export default AbsenceStatusBadge;
