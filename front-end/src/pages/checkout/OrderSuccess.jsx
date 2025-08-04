import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Result, 
  Steps, 
  Divider,
  Typography,
  Space
} from 'antd';
import { 
  CheckCircleFilled, 
  ShoppingOutlined, 
  CarOutlined, 
  HomeOutlined,
  ArrowLeftOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { notification } from 'antd';
import { useAuth } from '../../context/AuthContext';
import '../../css/checkout/order-success.css';

const { Title, Text, Paragraph } = Typography;

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCartLoggedIn();
  const { user } = useAuth();
  const { orderId, totalAmount } = location.state || {};

  useEffect(() => {
    // Kiểm tra nếu không có thông tin đơn hàng thì chuyển về trang chủ
    if (!orderId || !totalAmount) {
      notification.warning({
        message: 'Không tìm thấy thông tin đơn hàng',
        description: 'Vui lòng thử lại',
        placement: 'topRight',
      });
      navigate('/');
      return;
    }

    // Clear cart khi checkout thành công
    const clearCartOnSuccess = async () => {
      try {
        await clearCart();
        console.log('Cart cleared successfully after checkout');
      } catch (error) {
        console.error('Error clearing cart after checkout:', error);
      }
    };

    clearCartOnSuccess();

    // Xóa localStorage selectedAddress khi đặt hàng thành công
    const clearSelectedAddress = () => {
      try {
        if (user && user.id) {
          localStorage.removeItem(`selectedAddress_${user.id}`);
          console.log('🧹 Cleared selectedAddress from localStorage after successful order (OrderSuccess page)');
        }
      } catch (error) {
        console.error('Error clearing selectedAddress from localStorage:', error);
      }
    };

    clearSelectedAddress();

    // Scroll to top
    window.scrollTo(0, 0);
  }, [orderId, totalAmount, navigate, clearCart]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    notification.success({
      message: 'Đã sao chép mã đơn hàng',
      placement: 'topRight',
    });
  };

  const currentStep = 0; // Đơn hàng vừa được đặt

  const steps = [
    {
      title: 'Đặt hàng thành công',
      description: 'Đơn hàng đã được xác nhận',
      icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
    },
    {
      title: 'Đang xử lý',
      description: 'Chúng tôi đang chuẩn bị đơn hàng',
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Đang giao hàng',
      description: 'Đơn hàng đang được vận chuyển',
      icon: <CarOutlined />,
    },
    {
      title: 'Giao hàng thành công',
      description: 'Đơn hàng đã được giao',
      icon: <HomeOutlined />,
    },
  ];

  if (!orderId || !totalAmount) {
    return null;
  }

  return (
    <div className="order-success-container">
      <div className="order-success-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          className="back-button"
        >
          Về trang chủ
        </Button>
      </div>

      <div className="order-success-content">
        <Card className="success-card">
          <Result
            status="success"
            icon={<CheckCircleFilled style={{ fontSize: 72, color: '#52c41a' }} />}
            title="Đặt hàng thành công!"
            subTitle="Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm nhất!"
            extra={[
              <Button 
                type="primary" 
                size="large" 
                onClick={() => navigate('/my-orders')}
                key="view-orders"
              >
                Xem đơn hàng của tôi
              </Button>,
              <Button 
                size="large" 
                onClick={() => navigate('/products')}
                key="continue-shopping"
              >
                Tiếp tục mua sắm
              </Button>,
            ]}
          />
        </Card>

        <Card title="Thông tin đơn hàng" className="order-info-card">
          <div className="order-info-content">
            <div className="order-id-section">
              <div className="order-id-display">
                <Text strong>Mã đơn hàng:</Text>
                <div className="order-id-container">
                  <Text code className="order-id">{orderId}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    onClick={copyOrderId}
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
                <Text strong type="success">Đã đặt hàng thành công</Text>
              </div>
              <div className="summary-item">
                <Text>Tổng tiền:</Text>
                <Text strong className="total-amount">{formatPrice(totalAmount)}</Text>
              </div>
              <div className="summary-item">
                <Text>Phương thức thanh toán:</Text>
                <Text>Thanh toán khi nhận hàng (COD)</Text>
              </div>
              <div className="summary-item">
                <Text>Thời gian đặt hàng:</Text>
                <Text>{new Date().toLocaleString('vi-VN')}</Text>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Trạng thái đơn hàng" className="order-status-card">
          <Steps
            current={currentStep}
            items={steps}
            className="order-steps"
          />
          <div className="status-description">
            <Paragraph>
              <Text strong>Bước tiếp theo:</Text> Chúng tôi sẽ xác nhận đơn hàng và liên hệ với bạn trong thời gian sớm nhất.
            </Paragraph>
            <Paragraph>
              <Text strong>Thời gian giao hàng dự kiến:</Text> 2-5 ngày làm việc (tùy thuộc vào địa chỉ giao hàng)
            </Paragraph>
          </div>
        </Card>

        <Card title="Hỗ trợ khách hàng" className="support-card">
          <div className="support-content">
            <div className="support-item">
              <Title level={5}>📞 Hotline hỗ trợ</Title>
              <Text>1900-xxxx (Miễn phí)</Text>
              <Paragraph className="support-note">
                Thời gian làm việc: 8:00 - 22:00 (Thứ 2 - Chủ nhật)
              </Paragraph>
            </div>
            
            <Divider />
            
            <div className="support-item">
              <Title level={5}>📧 Email hỗ trợ</Title>
              <Text>support@barbershop.com</Text>
              <Paragraph className="support-note">
                Phản hồi trong vòng 24 giờ
              </Paragraph>
            </div>
            
            <Divider />
            
            <div className="support-item">
              <Title level={5}>💬 Chat trực tuyến</Title>
              <Text>Hỗ trợ trực tuyến 24/7</Text>
              <Paragraph className="support-note">
                Chat với nhân viên hỗ trợ ngay bây giờ
              </Paragraph>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrderSuccess; 