import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, message, Tooltip, Spin, Empty } from 'antd';
import { CopyOutlined, GiftOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getPersonalVouchers } from '../../services/api';

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

function getDaysLeft(endDate) {
  if (!endDate) return '';
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `Còn ${diff} ngày` : (diff === 0 ? 'Hết hạn hôm nay' : 'Đã hết hạn');
}
  

const UserVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const res = await getPersonalVouchers();
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24, textAlign: 'center' }}>
        <GiftOutlined style={{ color: '#faad14', marginRight: 8 }} />
        Voucher của tôi
      </Title>
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : vouchers.length === 0 ? (
        <Empty description="Bạn chưa có voucher khả dụng" style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[32, 32]} justify="center">
          {vouchers.map((voucher) => (
            <Col xs={24} sm={12} md={8} key={voucher.id || voucher._id} style={{ display: 'flex', justifyContent: 'center' }}>
                             <Card
                 bordered={false}
                 style={{
                   width: 200,
                   minHeight: 100,
                   borderRadius: 8,
                   boxShadow: voucher.isUsed ? '0 1px 3px #ccc' : '0 1px 3px #eee',
                   background: voucher.isUsed ? '#f5f5f5' : '#fff',
                   marginBottom: 12,
                   border: voucher.isUsed ? '1px solid #d9d9d9' : '1px solid #eee',
                   transition: 'box-shadow 0.2s, border 0.2s',
                   display: 'flex',
                   flexDirection: 'column',
                   justifyContent: 'center',
                   alignItems: 'flex-start',
                   padding: 0,
                   opacity: voucher.isUsed ? 0.6 : 1,
                   cursor: voucher.isUsed ? 'not-allowed' : 'default'
                 }}
                 bodyStyle={{ padding: 8 }}
               >
                 <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap' }}>
                   <Tag 
                     color={voucher.isUsed ? "default" : "blue"} 
                     style={{ 
                       fontSize: 13, 
                       fontWeight: 700, 
                       padding: '1px 8px', 
                       marginRight: 6,
                       marginBottom: 4,
                       opacity: voucher.isUsed ? 0.6 : 1
                     }}
                   >
                     {voucher.code}
                   </Tag>
                   {voucher.isUsed && (
                     <Tag color="red" style={{ fontSize: 11, marginBottom: 4 }}>
                       Đã sử dụng
                     </Tag>
                   )}
                 </div>
                 <div style={{ 
                   fontSize: 12, 
                   fontWeight: 600, 
                   color: voucher.isUsed ? '#999' : '#43a047', 
                   marginBottom: 2 
                 }}>
                   Giảm: {voucher.type === 'percent' ? `${voucher.value}%` : `${voucher.value?.toLocaleString('vi-VN')}đ`}
                 </div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: voucher.isUsed ? '#999' : '#43a047', 
                  marginBottom: 3 
                }}>
                  Giảm: {voucher.type === 'percent' ? `${voucher.value}%` : `${voucher.value?.toLocaleString('vi-VN')}đ`}
                </div>
                                 {voucher.type === 'percent' && voucher.maxDiscountAmount > 0 && (
                   <div style={{ 
                     color: voucher.isUsed ? '#ccc' : '#bfa43a', 
                     fontSize: 11, 
                     marginBottom: 1 
                   }}>
                     Giảm tối đa: {voucher.maxDiscountAmount.toLocaleString('vi-VN')}đ
                   </div>
                 )}
                 {voucher.minOrderAmount > 0 && (
                   <div style={{ 
                     color: voucher.isUsed ? '#ccc' : '#bfa43a', 
                     fontSize: 11, 
                     marginBottom: 1 
                   }}>
                     Đơn từ: {voucher.minOrderAmount.toLocaleString('vi-VN')}đ
                   </div>
                 )}
                 <div style={{ 
                   color: voucher.isUsed ? '#ccc' : '#d9534f', 
                   fontSize: 11, 
                   marginBottom: 0 
                 }}>
                   {getDaysLeft(voucher.endDate || voucher.expiry || voucher.expiryDate)}
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