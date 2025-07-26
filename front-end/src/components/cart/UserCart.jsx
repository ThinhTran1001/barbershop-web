import React, { useState } from 'react';
import { useUserCart } from '../../context/UserCartContext';
import { useAuth } from '../../context/AuthContext';
import { Button, InputNumber, Empty, notification } from 'antd';
import ToastService from '../../services/toastService';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../css/cart/user-cart.css';





const UserCart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useUserCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updatingQuantity, setUpdatingQuantity] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Thêm log kiểm tra dữ liệu cart
  console.log('Cart items:', cart.items);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const calculateDiscountPrice = (price, discount) => {
    const priceNumber = parseFloat(price.toString().replace(/[^\d]/g, ''));
    const result = priceNumber * (1 - Number(discount) / 100);
    return formatPrice(result);
  };

  const handleQuantityChange = async (productId, newQuantity, productName) => {
    if (newQuantity < 1) return; // Không xử lý value 0 ở đây nữa
    
    // Tìm item trong cart để kiểm tra stock
    const item = cart.items.find(item => item.id === productId);
    if (item && newQuantity > item.stock) {
      ToastService.showQuantityLimitExceeded(item.stock);
      return;
    }
    
    setUpdatingQuantity((prev) => ({ ...prev, [productId]: true }));
    try {
      await updateQuantity(productId, newQuantity);
      notification.success({
        message: 'Cập nhật số lượng thành công',
        placement: 'topRight',
      });
    } catch (err) {
      notification.error({
        message: 'Cập nhật số lượng thất bại',
        description: err?.message || 'Vui lòng thử lại!',
        placement: 'topRight',
      });
    } finally {
      setUpdatingQuantity((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = (productId, productName) => {
    console.log('🔍 handleRemoveItem called with:', { productId, productName });
    
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa sản phẩm',
      message: `Bạn có muốn xóa sản phẩm "${productName}" khỏi giỏ hàng không?`,
      onConfirm: () => {
        console.log('✅ User confirmed delete for:', productName);
        removeFromCart(productId);
        notification.success({
          message: 'Đã xóa sản phẩm',
          description: `Đã xóa ${productName} khỏi giỏ hàng`,
          placement: 'topRight',
        });
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleClearCart = () => {
    console.log('🔍 handleClearCart called');
    
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa giỏ hàng',
      message: 'Bạn có muốn xóa tất cả sản phẩm khỏi giỏ hàng không?',
      onConfirm: () => {
        console.log('✅ User confirmed clear cart');
        clearCart();
        notification.success({
          message: 'Đã xóa giỏ hàng',
          description: 'Tất cả sản phẩm đã được xóa khỏi giỏ hàng',
          placement: 'topRight',
        });
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      notification.warning({
        message: 'Giỏ hàng trống',
        description: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán',
        placement: 'topRight',
      });
      return;
    }
    navigate('/checkout');
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-empty-container content-below-header">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Giỏ hàng của bạn đang trống"
        >
          <Button type="primary" onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="cart-container content-below-header">
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
                    e.target.src = '';
                  }}
                />
              </div>

              <div className="item-details">
                <h3 className="item-name">
                  {item.name}
                  {Number(item.discount) > 0 && (
                    <span style={{
                      marginLeft: 8,
                      background: '#ff4d4f',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      fontSize: 12,
                      marginTop: -2,
                      display: 'inline-block'
                    }}>
                      -{item.discount}%
                    </span>
                  )}
                </h3>
                <div className="item-price">
                  {Number(item.discount) > 0 ? (
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
                  min={0}
                  max={item.stock}
                  value={item.quantity}
                  step={1}
                  stringMode
                  onChange={(value) => {
                                         if (value === 0) {
                       setConfirmDialog({
                         show: true,
                         title: 'Xác nhận xóa sản phẩm',
                         message: `Bạn có muốn xóa sản phẩm "${item.name}" khỏi giỏ hàng không?`,
                         onConfirm: () => {
                           removeFromCart(item.id);
                           notification.success({
                             message: 'Đã xóa sản phẩm',
                             description: `Đã xóa ${item.name} khỏi giỏ hàng`,
                             placement: 'topRight',
                           });
                           setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
                         }
                       });
                       // Reset quantity back to 1 if user cancels
                       setTimeout(() => {
                         if (confirmDialog.show) {
                           updateQuantity(item.id, 1);
                         }
                       }, 100);
                    } else if (value > 0) {
                      handleQuantityChange(item.id, value, item.name);
                    }
                  }}
                  loading={updatingQuantity[item.id]}
                />
              </div>

              <div className="item-total">
                <span className="total-label">Tổng:</span>
                <span className="total-price">
                  {Number(item.discount) > 0
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
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
                 </div>
       </div>
       
       {/* Custom Confirm Dialog */}
       {confirmDialog.show && (
         <div 
           style={{
             position: 'fixed',
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             backgroundColor: 'rgba(0, 0, 0, 0.5)',
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             zIndex: 9999,
           }}
         >
           <div 
             style={{
               backgroundColor: 'white',
               borderRadius: '8px',
               padding: '24px',
               maxWidth: '400px',
               width: '90%',
               boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
             }}
           >
             <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
               {confirmDialog.title}
             </h3>
             <p style={{ margin: '0 0 24px 0', color: '#666' }}>
               {confirmDialog.message}
             </p>
             <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
               <Button 
                 onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
               >
                 Hủy
               </Button>
               <Button 
                 type="primary" 
                 danger
                 onClick={confirmDialog.onConfirm}
               >
                 Đồng ý
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default UserCart; 