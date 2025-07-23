import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, message, Tooltip, Spin, Empty } from 'antd';
import { CopyOutlined, GiftOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getVoucherByUser } from '../../services/api';

const { Title, Text } = Typography;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('vi-VN');
}

function getDiscountText(voucher) {
  if (voucher.type === 'percent') {
    return `Giảm ${voucher.value || voucher.discount || ''}%`;
  }
  if (voucher.type === 'fixed') {
    return `Giảm ${(voucher.value || voucher.discount || 0).toLocaleString()}đ`;
  }
  if (voucher.type === 'freeship') {
    return 'Freeship';
  }
  // fallback
  return voucher.discount || voucher.amount || voucher.value || '';
}

function getMinOrderText(voucher) {
    const min =
      voucher.minOrderAmount ??
      voucher.minOrderAmout ??
      voucher.minOrder ??
      voucher.minimumOrder ??
      voucher.minValue;
  
    // Chỉ bỏ qua nếu min là null hoặc undefined
    if (min !== null && min !== undefined) {
      return `Đơn từ ${Number(min).toLocaleString()}đ`;
    }
  
    return '';
  }
  

const UserVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const res = await getVoucherByUser();
        setVouchers(res.data.data || []);
      } catch (err) {
        message.error('Không thể lấy danh sách voucher.');
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    message.success('Đã sao chép mã: ' + code);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <GiftOutlined style={{ color: '#faad14', marginRight: 8 }} />
        Voucher khả dụng của bạn
      </Title>
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : vouchers.length === 0 ? (
        <Empty description="Bạn chưa có voucher khả dụng" style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {vouchers.map((voucher) => (
            <Col xs={24} sm={12} md={8} key={voucher.id || voucher._id}>
              <Card
                bordered={false}
                style={{ borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2', minHeight: 170, cursor: 'pointer', marginBottom: 8 }}
                bodyStyle={{ padding: 20 }}
              >
                <Title level={4} style={{ margin: 0, color: '#1890ff', fontWeight: 700, lineHeight: 1.2 }}>
                  {voucher.name}
                </Title>
                <div style={{ margin: '10px 0 6px 0' }}>
                  <Tag color="blue" style={{ fontSize: 15, padding: '2px 10px' }}>
                     {voucher.code}
                  </Tag>
                  <Tooltip title="Sao chép mã">
                    <Button
                      icon={<CopyOutlined />}
                      size="small"
                      onClick={() => handleCopy(voucher.code)}
                      style={{ marginLeft: 8 }}
                    />
                  </Tooltip>
                </div>
                <div style={{ margin: '8px 0' }}>
  <Tag color="green" style={{ fontSize: 16, padding: '4px 16px', fontWeight: 600 }}>
    {getDiscountText(voucher)}
  </Tag>
  {getMinOrderText(voucher) && (
    <div style={{ marginTop: 6 }}>
      <Tag color="orange" style={{ fontSize: 14 }}>
        {getMinOrderText(voucher)}
      </Tag>
    </div>
  )}
</div>
                <div style={{ margin: '8px 0', color: '#888', fontSize: 15 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Hạn sử dụng: {formatDate(voucher.expiry || voucher.expiryDate || voucher.endDate)}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default UserVouchers; 