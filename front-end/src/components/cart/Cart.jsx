import React from 'react';
import { useCart } from '../../context/CartContext';
import { Button, InputNumber, Empty, notification } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../css/cart/cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const calculateDiscountPrice = (price, discount) => {
    const priceNumber = parseFloat(price.toString().replace(/[^\d]/g, ""));
    const result = priceNumber - (priceNumber * discount) / 100;
    return formatPrice(result);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      notification.warning({
        message: "Số lượng không hợp lệ",
        description: "Số lượng phải lớn hơn 0",
        placement: "topRight",
      });
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId, productName) => {
    removeFromCart(productId);
    notification.success({
      message: "Đã xóa sản phẩm",
      description: `Đã xóa ${productName} khỏi giỏ hàng`,
      placement: "topRight",
    });
  };

  const handleClearCart = () => {
    clearCart();
    notification.success({
      message: "Đã xóa giỏ hàng",
      description: "Tất cả sản phẩm đã được xóa khỏi giỏ hàng",
      placement: "topRight",
    });
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      notification.warning({
        message: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán",
        placement: "topRight",
      });
      return;
    }
    // Navigate to checkout page
    navigate("/checkout-guest");
    notification.info({
      message: "Chuyển đến trang thanh toán",
      description: "Tính năng đang được phát triển",
      placement: "topRight",
    });
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-empty-container">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Giỏ hàng của bạn đang trống"
        >
          <Button type="primary" onClick={() => window.history.back()}>
            Tiếp tục mua sắm
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Giỏ hàng ({getCartCount()} sản phẩm)</h1>
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={handleClearCart}
        >
          Xóa tất cả
        </Button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="item-image">
                <img 
                  src={item.image} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
              </div>
              
              <div className="item-info">
                <h3 className="item-name">{item.name}</h3>
                <div className="item-price">
                  {item.discount > 0 ? (
                    <>
                      <span className="original-price">{formatPrice(item.price)}</span>
                      <span className="discounted-price">
                        {calculateDiscountPrice(item.price, item.discount)}
                      </span>
                    </>
                  ) : (
                    <span className="current-price">{formatPrice(item.price)}</span>
                  )}
                </div>
              </div>

              <div className="item-quantity">
                <span className="quantity-label">Số lượng:</span>
                <InputNumber
                  min={1}
                  max={item.stock}
                  value={item.quantity}
                  onChange={(value) => handleQuantityChange(item.id, value)}
                />
              </div>

              <div className="item-total">
                <span className="total-label">Tổng:</span>
                <span className="total-price">
                  {item.discount > 0 
                    ? calculateDiscountPrice(item.price * item.quantity, item.discount)
                    : formatPrice(item.price * item.quantity)
                  }
                </span>
              </div>

              <div className="item-actions">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(item.id, item.name)}
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
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
            >
              Tiến hành thanh toán
            </Button>
            <Button 
              type="default" 
              size="large" 
              block
              onClick={() => window.history.back()}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 