import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart as clearCartApi,
} from '../services/api';

const UserCartContext = createContext();

// Action types
const LOAD_CART = 'LOAD_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';

const cartReducer = (state, action) => {
  switch (action.type) {
    case LOAD_CART:
      return {
        ...state,
        items: action.payload.items || [],
      };
    case UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId || item.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    default:
      return state;
  }
};

export const UserCartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });
  const { user, loading } = useAuth();
  const [version, setVersion] = useState(0); // Thêm version để force update

  // Load cart from API khi user login hoặc reload
  const fetchCart = async () => {
    if (!user || loading) return;
    try {
      const response = await getCart();
      
      // Ưu tiên data.items, nếu không có thì lấy data.data.items
      let items = [];
      if (Array.isArray(response?.data?.items)) {
        items = response.data.items;
      } else if (Array.isArray(response?.data?.data?.items)) {
        items = response.data.data.items;
      }
      
      const formattedItems = items.map((i) => {
        // Kiểm tra cấu trúc dữ liệu từ backend
        const productData = i.productId;
        const formattedItem = {
          id: productData._id || productData,
          productId: productData._id || productData, // Thêm productId để checkout có thể sử dụng
          name: productData.name,
          image: productData.image,
          price: productData.price,
          discount: productData.discount || 0,
          stock: productData.stock,
          quantity: i.quantity,
        };
        return formattedItem;
      });
      
      // Đảm bảo tạo object mới để trigger re-render
      dispatch({ type: LOAD_CART, payload: { items: [...formattedItems] } });
      setVersion(v => v + 1); // Tăng version mỗi lần fetchCart
    } catch (err) {
      console.error('Error loading cart from API', err);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line
  }, [user, loading]);

  // Actions
  const addToCart = async (product, quantity = 1) => {
    try {
      await addItem({ productId: product.id || product._id, quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to add item to API cart', err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await removeItem(productId);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item from API cart', err);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      // Update state immediately for better UX
      dispatch({ type: UPDATE_QUANTITY, payload: { productId, quantity } });
      
      // Then update API
      await updateItem(productId, { quantity });
      
      // Fetch fresh data from API to ensure sync
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity in API cart', err);
      // Revert state if API call failed
      await fetchCart();
    }
  };

  const clearCart = async () => {
    try {
      await clearCartApi();
      await fetchCart();
    } catch (err) {
      console.error('Failed to clear API cart', err);
    }
  };

  const getCartTotal = () => {
    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.price.toString().replace(/[^\d]/g, ''));
      const discounted = item.discount > 0 ? price - (price * item.discount) / 100 : price;
      return total + discounted * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <UserCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        fetchCart, // <-- export fetchCart
        version, // Trả version ra context
        isLoggedIn: !!user,
      }}
    >
      {children}
    </UserCartContext.Provider>
  );
};

export const useUserCart = () => {
  const context = useContext(UserCartContext);
  if (!context) {
    throw new Error('useUserCart must be used within a UserCartProvider');
  }
  return context;
}; 