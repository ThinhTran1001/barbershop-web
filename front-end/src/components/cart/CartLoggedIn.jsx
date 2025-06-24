import React from 'react';
import { Button, InputNumber, Empty, notification, Spin, Modal } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCartLoggedIn } from '../../context/CartLoggedInContext';
import '../../css/cart/cart-logged-in.css';

const { confirm } = Modal;

const CartLoggedIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    cart, 
    loading, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getCartTotal, 
    getCartCount, 
    fetchCart 
  } = useCartLoggedIn();

  const formatPrice = (price) => {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const calculateDiscountPrice = (price, discount) => {
    if (!price || !discount) return formatPrice(price);
    const priceNumber = parseFloat(price.toString().replace(/[^\d]/g, ""));
    const result = priceNumber - (priceNumber * discount / 100);
    return formatPrice(result);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!cart.items || cart.items.length === 0) {
      notification.warning({
        message: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán",
        placement: "topRight",
      });
      return;
    }
    navigate("/checkout");
  };

  if (!user) {
    return (
      <div className="cart-logged-in-container">
        <div className="cart-logged-in-empty">
          <Empty
            image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description="Vui lòng đăng nhập để xem giỏ hàng"
          >
            <Button type="primary" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-logged-in-container">
        <div className="cart-loading">
          <Spin size="large" />
          <p>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-logged-in-container">
        <div className="cart-logged-in-empty">
          <Empty
            image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description="Giỏ hàng của bạn đang trống"
          >
            <Button type="primary" onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-logged-in-container">
      <div className="cart-logged-in-header">
        <h1>Giỏ hàng của tôi ({getCartCount()} sản phẩm)</h1>
        <div className="header-actions">
          <Button 
            type="text" 
            icon={<ReloadOutlined />}
            onClick={fetchCart}
            loading={loading}
            style={{ marginRight: 8 }}
          >
            Làm mới
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => {
              confirm({
                title: 'Xác nhận xóa',
                icon: <ExclamationCircleOutlined />,
                content: 'Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?',
                okText: 'Xóa tất cả',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: clearCart,
              });
            }}
            loading={loading}
          >
            Xóa tất cả
          </Button>
        </div>
      </div>

      <div className="cart-logged-in-content">
        <div className="cart-logged-in-items">
          {cart.items.map((item) => (
            <div key={item.productId?._id || item._id} className="cart-logged-in-item">
              <div className="item-image">
                <img 
                  src={item.productId?.image || item.image} 
                  alt={item.productId?.name || item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/120x120?text=No+Image";
                  }}
                />
              </div>
              
              <div className="item-info">
                <h3 className="item-name">{item.productId?.name || item.name}</h3>
                <div className="item-price">
                  {item.productId?.discount > 0 ? (
                    <>
                      <span className="original-price">{formatPrice(item.productId.price)}</span>
                      <span className="discounted-price">
                        {calculateDiscountPrice(item.productId.price, item.productId.discount)}
                      </span>
                    </>
                  ) : (
                    <span className="current-price">{formatPrice(item.productId?.price || item.price)}</span>
                  )}
                </div>
              </div>

              <div className="item-quantity">
                <span className="quantity-label">Số lượng:</span>
                <InputNumber
                  min={1}
                  max={item.productId?.stock || 999}
                  value={item.quantity}
                  onChange={(value) => updateQuantity(item.productId?._id || item.productId, value)}
                  disabled={loading}
                />
              </div>

              <div className="item-total">
                <span className="total-label">Tổng:</span>
                <span className="total-price">
                  {item.productId?.discount > 0 
                    ? calculateDiscountPrice((item.productId.price * item.quantity), item.productId.discount)
                    : formatPrice((item.productId?.price || item.price) * item.quantity)
                  }
                </span>
              </div>

              <div className="item-actions">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const productId = item.productId?._id || item.productId;
                    const productName = item.productId?.name || item.name;
                    console.log('Click nút Xóa:', productId, productName);
                    console.log('Item data:', item);
                    
                    confirm({
                      title: 'Xác nhận xóa',
                      icon: <ExclamationCircleOutlined />,
                      content: `Bạn có chắc chắn muốn xóa "${productName}" khỏi giỏ hàng?`,
                      okText: 'Xóa',
                      okType: 'danger',
                      cancelText: 'Hủy',
                      onOk: () => removeItem(productId),
                    });
                  }}
                  loading={loading}
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-logged-in-summary">
          <div className="summary-header">
            <h3>Tổng đơn hàng</h3>
          </div>
          
          <div className="summary-details">
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>Miễn phí</span>
            </div>
            <div className="summary-row total">
              <span>Tổng cộng:</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
          </div>

          <div className="summary-actions">
            <Button 
              type="primary" 
              size="large" 
              block
              onClick={handleCheckout}
              loading={loading}
            >
              Tiến hành thanh toán
            </Button>
            <Button 
              type="default" 
              size="large" 
              block
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartLoggedIn; 