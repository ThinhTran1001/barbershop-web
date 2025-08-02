// OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrder, createFeedbackOrder, getFeedbackOrderByOrderId, getUserAddresses, createAddress } from '../../services/api';
import {
  Spin, Alert, Button, Typography, Tag, List, Avatar, Popconfirm, message, Descriptions, Form, Input, Card, Steps, Divider, notification, Modal, Radio
} from 'antd';
import {
  ArrowLeftOutlined, CopyOutlined, CheckCircleFilled, ShoppingOutlined, CarOutlined, HomeOutlined
} from '@ant-design/icons';
import './OrderDetail.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import NewAddressForm from '../../components/checkout/NewAddressForm';

const { Title, Text, Paragraph } = Typography;

const getStatusStep = (status) => {
  switch (status) {
    case 'pending': return 0;
    case 'processing': return 1;
    case 'shipped': return 2;
    case 'delivered': return 3;
    case 'cancelled': return -1;
    default: return 0;
  }
};

const getDynamicSteps = (currentStatus) => {
  const currentStep = getStatusStep(currentStatus);
  const isDelivered = currentStatus === 'delivered';
  const icons = [
    <CheckCircleFilled style={{ color: '#52c41a' }} />, // Thành công
    <ShoppingOutlined />, // Đang xử lý
    <CarOutlined />,      // Đang giao hàng
    <HomeOutlined />,     // Giao hàng thành công
  ];
  const stepsData = [
    {
      title: 'Đặt hàng thành công',
      description: 'Đơn hàng đã được xác nhận',
    },
    {
      title: 'Đang xử lý',
      description: 'Chúng tôi đang chuẩn bị đơn hàng',
    },
    {
      title: 'Đang giao hàng',
      description: 'Đơn hàng đang được vận chuyển',
    },
    {
      title: 'Giao hàng thành công',
      description: 'Đơn hàng đã được giao',
    },
  ];
  return stepsData.map((step, idx) => ({
    ...step,
    icon:
      isDelivered
        ? <CheckCircleFilled style={{ color: '#52c41a' }} />
        : idx < currentStep
          ? <CheckCircleFilled style={{ color: '#52c41a' }} />
          : icons[idx],
  }));
};

const getStatusTag = (status) => {
  switch (status) {
    case 'pending': return <Tag color="gold">Chờ xác nhận</Tag>;
    case 'processing': return <Tag color="blue">Đang xử lý</Tag>;
    case 'shipped': return <Tag color="cyan">Đang giao</Tag>;
    case 'delivered': return <Tag color="green">Đã giao</Tag>;
    case 'cancelled': return <Tag color="red">Đã hủy</Tag>;
    default: return <Tag>{status}</Tag>;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const showToast = (variant, message) => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [provinces, setProvinces] = useState([]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      console.log('Fetching order with id:', id); // Debug orderId
      const response = await getOrderById(id);
      const { order: orderData, items, payment } = response.data.data;
      setOrder({ ...orderData, items, payment });

      // Kiểm tra status feedback
      try {
        const feedbackResponse = await getFeedbackOrderByOrderId(id);
        console.log('Feedback response:', feedbackResponse.data); // Debug response
        setFeedbackStatus(feedbackResponse.data.status);
      } catch (feedbackError) {
        console.error('Error fetching feedback status:', feedbackError);
        setFeedbackStatus(null); // Đặt null nếu không tìm thấy
      }
    } catch (err) {
      setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    fetchUserAddresses();
    fetchProvinces();
  }, [id]);

  const fetchProvinces = async () => {
    try {
      const response = await fetch('https://provinces.open-api.vn/api/p');
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const response = await getUserAddresses();
      setUserAddresses(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching user addresses:', error);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await updateOrder(id, { status: 'cancelled' });
      message.success('Đã hủy đơn hàng thành công!');
      fetchOrderDetail();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  const handleChangeAddress = async () => {
    if (!selectedAddressId) {
      message.error('Vui lòng chọn địa chỉ giao hàng!');
      return;
    }

    try {
      const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId);
      if (!selectedAddress) {
        message.error('Không tìm thấy địa chỉ đã chọn!');
        return;
      }

      const fullAddress = `${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`;
      
      // Kiểm tra xem địa chỉ có thay đổi không
      if (fullAddress === order.shippingAddress) {
        message.info('Địa chỉ này đã được sử dụng cho đơn hàng này!');
        setShowAddressModal(false);
        setSelectedAddressId(null);
        return;
      }

      await updateOrder(id, { shippingAddress: fullAddress });
      message.success('Đã cập nhật địa chỉ giao hàng!');
      setShowAddressModal(false);
      setSelectedAddressId(null);
      fetchOrderDetail();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể cập nhật địa chỉ.');
    }
  };

  const handleCreateNewAddress = async (values) => {
    try {
      const addressesResponse = await getUserAddresses();
      const existingAddresses = addressesResponse.data?.data || [];
      const isFirstAddress = existingAddresses.length === 0;

      const addressData = { ...values, isDefault: isFirstAddress };
      const response = await createAddress(addressData);
      const newAddress = response.data?.data;
      
      message.success('Đã thêm địa chỉ mới thành công!');
      setShowNewAddressForm(false);
      
      // Refresh danh sách địa chỉ
      await fetchUserAddresses();
      
      // Nếu là địa chỉ đầu tiên, tự động chọn
      if (isFirstAddress && newAddress) {
        setSelectedAddressId(newAddress._id);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể thêm địa chỉ mới');
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderCode);
    showToast('success', 'Đã copy thành công mã đơn hàng!');
  };

  const handleStartFeedback = async () => {
    try {
      const existing = await getFeedbackOrderByOrderId(id);
      if (existing?.data) {
        navigate(`/feedback-order/${id}`);
        return;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await createFeedbackOrder({ orderId: id, userId: order.userId });
          navigate(`/feedback-order/${id}`);
          return;
        } catch (createError) {
          console.error('Lỗi tạo mới feedback:', createError);
          message.error('Không thể tạo feedback mới.');
          return;
        }
      } else {
        console.error('Lỗi kiểm tra feedback:', err);
        message.error('Không thể kiểm tra trạng thái feedback.');
      }
    }
  };

  if (loading) {
    return <div className="spinner-container"><Spin size="large" /></div>;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  if (!order) {
    return <Alert message="Không tìm thấy đơn hàng." type="warning" showIcon />;
  }

  const subtotal = order.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const discount = subtotal - order.totalAmount;

  return (
    <div className="order-detail-container">
      {/* Toast */}
      <div className="position-fixed" style={{ top: '4rem', right: '1rem', zIndex: 1060 }}>
        {toast.show && (
          <div className={`toast align-items-center text-bg-${toast.variant} border-0 show`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => setToast(t => ({ ...t, show: false }))} />
            </div>
          </div>
        )}
      </div>

      <div className="order-success-content">
        {/* Đưa nút back-button lên sát Card tiêu đề */}
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/my-orders')}
          className="back-button"
          style={{ marginBottom: 12 }}
        >
          Quay lại danh sách đơn hàng
        </Button>
        <Card className="success-card">
          <Title level={3} style={{ color: '#52c41a', marginBottom: 0 }}>Chi tiết đơn hàng</Title>
          <Paragraph style={{ marginBottom: 0 }}>Cảm ơn bạn đã mua hàng tại Barbershop!</Paragraph>
        </Card>

        <Card title="Thông tin đơn hàng" className="order-info-card">
          <div className="order-info-content">
            <div className="order-id-section">
              <div className="order-id-display">
                <Text strong>Mã đơn hàng:</Text>
                <div className="order-id-container" style={{ position: 'relative', display: 'inline-block' }}>
                  <Text code className="order-id">{order.orderCode}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    onClick={handleCopyOrderId}
                    className="copy-button"
                    title="Sao chép mã đơn hàng"
                  />
                </div>
              </div>
              <Paragraph className="order-id-note">
                Vui lòng lưu lại mã đơn hàng để tra cứu trạng thái đơn hàng
              </Paragraph>
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-item">
                <Text>Trạng thái đơn hàng:</Text>
                {getStatusTag(order.status)}
              </div>
              <div className="summary-item">
                <Text>Phương thức thanh toán:</Text>
                <Text>{order.payment?.method?.toUpperCase() === 'CASH' ? 'Thanh toán khi nhận hàng' : (order.payment?.method?.toUpperCase() || 'N/A')}</Text>
              </div>
              <div className="summary-item">
                <Text>Trạng thái thanh toán:</Text>
                {order.status === 'delivered' && order.payment?.status === 'paid' ? (
                  <Tag color="green">Đã thanh toán</Tag>
                ) : (
                  <Tag color="orange">Chưa thanh toán</Tag>
                )}
              </div>
              <div className="summary-item">
                <Text>Tên người nhận:</Text>
                <Text>{order.customerName}</Text>
              </div>
              <div className="summary-item">
                <Text>Số điện thoại:</Text>
                <Text>{order.customerPhone}</Text>
              </div>
              <div className="summary-item">
                <Text>Địa chỉ giao hàng:</Text>
                <Text>{order.shippingAddress}</Text>
              </div>
              <div className="summary-item">
                <Text>Ngày đặt hàng:</Text>
                <Text>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Text>
              </div>
              {/* <div className="summary-item">
                <Text>Ngày nhận hàng:</Text>
                <Text>{new Date(order.updatedAt).toLocaleDateString('vi-VN')}</Text>
              </div> */}
            </div>

            {order.status === 'pending' && !order.addressChanged && (
              <div style={{ margin: '16px 0', padding: '16px', border: '1px solid #e8e8e8', borderRadius: '8px', background: '#fafafa' }}>
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>Đổi địa chỉ giao hàng</Text>
                <Button 
                  type="primary" 
                  onClick={() => {
                    // Tự động chọn địa chỉ hiện tại của đơn hàng
                    if (order.shippingAddress && userAddresses.length > 0) {
                      // Tìm địa chỉ trong userAddresses khớp với shippingAddress của đơn hàng
                      const matchingAddress = userAddresses.find(address => {
                        const addressString = `${address.street}, ${address.ward}, ${address.district}, ${address.province}`;
                        return addressString === order.shippingAddress;
                      });
                      
                      if (matchingAddress) {
                        setSelectedAddressId(matchingAddress._id);
                      }
                    }
                    setShowAddressModal(true);
                  }}
                  style={{ marginRight: '8px' }}
                >
                  Chọn địa chỉ có sẵn
                {/* </Button>
                                 <Button 
                   onClick={() => setShowNewAddressForm(true)}
                 > */}
                   {/* Thêm địa chỉ mới */}
                 </Button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Trạng thái đơn hàng" className="order-status-card">
          {order.status !== 'cancelled' ? (
            <Steps
              current={getStatusStep(order.status)}
              items={getDynamicSteps(order.status)}
              className="order-steps"
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>
              Đơn hàng đã bị hủy
            </div>
          )}
          <div className="status-description">
            <Paragraph>
              <Text strong>Trạng thái :</Text> {order.status === 'pending' && 'Chúng tôi sẽ xác nhận đơn hàng và liên hệ với bạn.'}
              {order.status === 'processing' && 'Đơn hàng đang được chuẩn bị.'}
              {order.status === 'shipped' && 'Đơn hàng đang trên đường giao.'}
              {order.status === 'delivered' && 'Đơn hàng đã giao thành công.'}
              {order.status === 'cancelled' && 'Đơn hàng đã bị hủy.'}
            </Paragraph>
          </div>
        </Card>

        <Card title="Sản phẩm trong đơn" className="order-info-card">
          <List
            itemLayout="horizontal"
            dataSource={order.items}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={item.productImage && (
                    <Link to={`/products/${item.productId}`}>
                      <Avatar src={item.productImage} style={{ cursor: 'pointer' }} />
                    </Link>
                  )}
                  title={
                    <Link to={`/products/${item.productId}`} className="item-name" style={{ color: '#222', textDecoration: 'underline', cursor: 'pointer' }}>
                      {item.productName}
                    </Link>
                  }
                  description={<span>Số lượng: {item.quantity}</span>}
                />
                <div className="item-price-details">
                  <Text>Đơn giá: {item.unitPrice.toLocaleString('vi-VN')} VND</Text>
                  <br />
                  <Text strong>Tổng: {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} VND</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card title="Tổng kết đơn hàng" className="order-info-card">
          <div className="order-summary">
            <div className="summary-item">
              <Text>Tổng tiền hàng:</Text>
              <Text>{subtotal.toLocaleString('vi-VN')} VND</Text>
            </div>
            <div className="summary-item">
              <Text>Giảm giá:</Text>
              <Text style={{ marginLeft: 8, color: '#e74c3c' }}>- {discount > 0 ? discount.toLocaleString('vi-VN') : '0'} VND</Text>
            </div>
            {order.voucherId && order.voucherId.code && order.discountAmount <= 0 && (
              <div className="summary-item">
                <Text>Voucher đã sử dụng:</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>{order.voucherId.code}</Tag>
              </div>
            )}
            <div className="summary-item">
              <Text>Phí vận chuyển:</Text>
              <Text>Miễn phí</Text>
            </div>
            <div className="summary-item total-amount">
              <Text strong>Thành tiền:</Text>
              <Text strong style={{ color: '#e74c3c', fontSize: 18 }}>{order.totalAmount.toLocaleString('vi-VN')} VND</Text>
            </div>
          </div>
        </Card>

        <div className="order-actions">
          {order.status === 'pending' && (
            <Popconfirm
              title="Bạn có chắc muốn hủy đơn hàng này?"
              onConfirm={handleCancelOrder}
              okText="Đồng ý"
              cancelText="Không"
            >
              <Button type="primary" danger>Hủy đơn hàng</Button>
            </Popconfirm>
          )}
          {order.status === 'delivered' && order.payment?.status === 'paid' && !feedbackStatus && (
          // {order.status === 'delivered' && !feedbackStatus && (
            <Button 
              type="primary" 
              onClick={handleStartFeedback}
              style={{ marginLeft: 10 }}
            >
              Đánh giá sản phẩm
            </Button>
          )}
        </div>
      </div>

             {/* Modal chọn địa chỉ */}
       <Modal
         title={showNewAddressForm ? "Thêm địa chỉ mới" : "Chọn địa chỉ giao hàng"}
         open={showAddressModal}
         onCancel={() => {
           setShowAddressModal(false);
           setSelectedAddressId(null);
           setShowNewAddressForm(false);
         }}
         footer={showNewAddressForm ? null : [
           <Button key="cancel" onClick={() => {
             setShowAddressModal(false);
             setSelectedAddressId(null);
           }}>
             Huỷ
           </Button>,
           <Button 
             key="submit" 
             type="primary" 
             onClick={handleChangeAddress}
             disabled={!selectedAddressId}
           >
             Xác nhận
           </Button>
         ]}
         width={700}
         maskClosable={false}
         closable={false}
       >
         {showNewAddressForm ? (
           <NewAddressForm
             provinces={provinces}
             onSubmit={handleCreateNewAddress}
             onBack={() => setShowNewAddressForm(false)}
             loading={false}
           />
         ) : (
           <>
             {userAddresses.length > 0 ? (
               <Radio.Group 
                 value={selectedAddressId} 
                 onChange={(e) => setSelectedAddressId(e.target.value)}
                 style={{ width: '100%' }}
               >
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {userAddresses.map((address) => (
                     <div 
                       key={address._id}
                       style={{
                         border: selectedAddressId === address._id ? '2px solid #52c41a' : '1px solid #e8e8e8',
                         borderRadius: '8px',
                         padding: '16px',
                         cursor: 'pointer',
                         background: selectedAddressId === address._id ? '#f6ffed' : '#fff',
                         transition: 'all 0.2s ease'
                       }}
                       onClick={() => setSelectedAddressId(address._id)}
                     >
                       <Radio value={address._id} style={{ marginRight: '12px' }}>
                         <div>
                           <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                             {address.recipientName} - {address.phone}
                           </div>
                           <div style={{ color: '#666', fontSize: '14px' }}>
                             {address.street}, {address.ward}, {address.district}, {address.province}
                           </div>
                           {address.isDefault && (
                             <Tag color="green" style={{ marginTop: '4px' }}>Mặc định</Tag>
                           )}
                         </div>
                       </Radio>
                     </div>
                   ))}
                 </div>
               </Radio.Group>
             ) : (
               <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                 <Text type="secondary">Bạn chưa có địa chỉ nào được lưu.</Text>
                 <br />
                 <Button 
                   type="primary" 
                   onClick={() => setShowNewAddressForm(true)}
                   style={{ marginTop: '16px' }}
                 >
                   Thêm địa chỉ mới
                 </Button>
               </div>
             )}
             
             {userAddresses.length > 0 && (
               <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e8e8e8' }}>
                 <Button 
                   type="dashed" 
                   block
                   onClick={() => setShowNewAddressForm(true)}
                   style={{ height: '40px' }}
                 >
                   + Thêm địa chỉ mới
                 </Button>
               </div>
             )}
           </>
         )}
       </Modal>
     </div>
   );
 };

export default OrderDetail;