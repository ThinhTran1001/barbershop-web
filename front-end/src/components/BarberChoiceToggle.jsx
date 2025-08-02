import React from 'react';
import {
  Card,
  Checkbox,
  Typography,
  Space,
  Alert,
  Divider
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import './BarberChoiceToggle.css';

const { Text } = Typography;

/**
 * BarberChoiceToggle Component
 * 
 * Hiển thị checkbox để người dùng chọn giữa auto-assignment và manual barber selection
 */
const BarberChoiceToggle = ({
  chooseBarberManually,
  onChoiceChange,
  disabled = false
}) => {
  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    onChoiceChange(isChecked);
  };

  return (
    <div className="barber-choice-toggle fade-in">
      <Card
        size="small"
        className={chooseBarberManually ? 'manual-mode' : 'auto-mode'}
        style={{
          marginBottom: '16px'
        }}
      >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Checkbox
          checked={chooseBarberManually}
          onChange={handleCheckboxChange}
          disabled={disabled}
          style={{ fontSize: '16px', fontWeight: '500' }}
        >
          <Space>
            <UserOutlined />
            Choose Barber
          </Space>
        </Checkbox>

        <Divider style={{ margin: '8px 0' }} />

        {chooseBarberManually ? (
          <Alert
            message="Manual Barber Selection"
            description={
              <Space direction="vertical" size="small">
                <Text>
                  • You will choose a specific barber from the available list
                </Text>
                <Text>
                  • Time slots will be filtered to show only that barber's availability
                </Text>
                <Text>
                  • You can see barber details, ratings, and specialties
                </Text>
              </Space>
            }
            type="success"
            showIcon
            icon={<UserOutlined />}
            style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
          />
        ) : (
          <Alert
            message="Auto-Assignment Mode"
            description={
              <Space direction="vertical" size="small">
                <Text>
                  • We'll automatically assign the best available barber for your selected time
                </Text>
                <Text>
                  • All available time slots across all barbers will be shown
                </Text>
                <Text>
                  • Assignment is based on barber ratings, experience, and availability
                </Text>
              </Space>
            }
            type="info"
            showIcon
            icon={<TeamOutlined />}
            style={{ backgroundColor: '#f0f8ff', border: '1px solid #91d5ff' }}
          />
        )}

        <div style={{ marginTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <InfoCircleOutlined style={{ marginRight: '4px' }} />
            You can change this option at any time before selecting a time slot
          </Text>
        </div>
      </Space>
      </Card>
    </div>
  );
};

export default BarberChoiceToggle;
