import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axiosInstance from '../services/axiosInstance';
import { notification, message } from 'antd';

const CartLoggedInContext = createContext();

export const CartLoggedInProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const fetchCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get('/carts');
      console.log('Context - Cart data received:', response.data);
      setCart(response.data || { items: [] });
      updateCartCount(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      notification.error({
        message: 'Lỗi tải giỏ hàng',
        description: error.response?.data?.message || 'Không thể kết nối đến server',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCartCount = (items) => {
    if (!items) return;
    const count = items.reduce((total, item) => total + (item.quantity || 0), 0);
    setCartCount(count);
  };

  const addToCartHandler = async (productId, quantity = 1) => {
    if (!user) {
      notification.warning({
        message: 'Vui lòng đăng nhập',
        description: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng',
        placement: 'topRight',
      });
      return false;
    }

    try {
      setLoading(true);
      await axiosInstance.post('/carts', { productId, quantity });
      await fetchCart();
      message.success('Đã thêm vào giỏ hàng');
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      notification.error({
        message: 'Lỗi thêm vào giỏ hàng',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm',
        placement: 'topRight',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      message.warning('Số lượng phải lớn hơn 0');
      return false;
    }

    try {
      setLoading(true);
      await axiosInstance.put('/carts', { productId, quantity });
      await fetchCart();
      message.success('Đã cập nhật số lượng');
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      notification.error({
        message: 'Lỗi cập nhật số lượng',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật',
        placement: 'topRight',
      });
      // Refresh cart to get latest data
      await fetchCart();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    if (!productId) {
      notification.error({
        message: 'Lỗi xóa sản phẩm',
        description: 'Không tìm thấy ID sản phẩm',
        placement: 'topRight',
      });
      return false;
    }

    try {
      setLoading(true);
      console.log('Context - Removing productId:', productId);
      const response = await axiosInstance.delete(`/carts/remove/${productId}`);
      console.log('Context - Remove response:', response.data);
      await fetchCart();
      message.success('Đã xóa sản phẩm khỏi giỏ hàng');
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      console.error('Error response:', error.response);
      notification.error({
        message: 'Lỗi xóa sản phẩm',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm',
        placement: 'topRight',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      console.log('Clearing cart...');
      const response = await axiosInstance.delete('/carts/clear');
      console.log('Clear cart response:', response.data);
      await fetchCart();
      message.success('Đã xóa toàn bộ giỏ hàng');
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      console.error('Error response:', error.response);
      notification.error({
        message: 'Lỗi xóa giỏ hàng',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi xóa giỏ hàng',
        placement: 'topRight',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    if (!cart.items) return 0;
    return cart.items.reduce((total, item) => {
      if (!item.productId) return total;
      const price = parseFloat(item.productId.price || 0);
      const discount = parseFloat(item.productId.discount || 0);
      const quantity = parseInt(item.quantity || 0);
      
      const discountedPrice = discount > 0 
        ? price - (price * discount / 100) 
        : price;
      return total + (discountedPrice * quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartCount;
  };

  const isInCart = (productId) => {
    if (!cart.items) return false;
    return cart.items.some(item => 
      (item.productId?._id === productId) || (item.productId === productId)
    );
  };

  const getProductQuantity = (productId) => {
    if (!cart.items) return 0;
    const item = cart.items.find(item => 
      (item.productId?._id === productId) || (item.productId === productId)
    );
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [] });
      setCartCount(0);
    }
  }, [user]);

  const value = {
    cart,
    loading,
    cartCount,
    addToCart: addToCartHandler,
    updateQuantity,
    removeItem,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart,
    getProductQuantity,
    fetchCart,
  };

  return (
    <CartLoggedInContext.Provider value={value}>
      {children}
    </CartLoggedInContext.Provider>
  );
};

export const useCartLoggedIn = () => {
  const context = useContext(CartLoggedInContext);
  if (!context) {
    throw new Error('useCartLoggedIn must be used within a CartLoggedInProvider');
  }
  return context;
};
