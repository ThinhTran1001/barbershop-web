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

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload.items || [],
      };
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
        };
      }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload),
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    default:
      return state;
  }
};

export const UserCartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });
  const { user, loading } = useAuth();
  const [version, setVersion] = useState(0);

  const fetchCart = async () => {
    if (!user || loading) return;
    try {
      const response = await getCart();
      let items = [];
      if (Array.isArray(response?.data?.items)) {
        items = response.data.items;
      } else if (Array.isArray(response?.data?.data?.items)) {
        items = response.data.data.items;
      }
      const formattedItems = items.map((i) => {
        const productData = i.productId;
        return {
          id: productData._id || productData,
          productId: productData._id || productData,
          name: productData.name,
          image: productData.image,
          price: productData.price,
          discount: productData.discount || 0,
          stock: productData.stock,
          quantity: i.quantity,
        };
      });
      dispatch({ type: 'LOAD_CART', payload: { items: [...formattedItems] } });
      setVersion(v => v + 1);
    } catch (err) {
      console.error('Error loading cart from API', err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user, loading]);

  const addToCart = async (product, quantity = 1, callback) => {
    try {
      // Cập nhật state cục bộ ngay lập tức
      const cartItem = {
        id: product.id || product._id,
        productId: product.id || product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        discount: product.discount || 0,
        stock: product.stock,
        quantity: quantity,
      };
      dispatch({ type: 'ADD_TO_CART', payload: cartItem });

      // Gọi API để thêm vào server
      await addItem({ productId: product.id || product._id, quantity });

      // Fetch lại để đồng bộ với server
      await fetchCart();

      if (callback) callback();
    } catch (err) {
      console.error('Failed to add item to API cart', err);
      // Revert state nếu thất bại
      await fetchCart();
    }
  };

  const removeFromCart = async (productId) => {
    try {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      await removeItem(productId);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item from API cart', err);
      await fetchCart();
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
      await updateItem(productId, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity in API cart', err);
      await fetchCart();
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'CLEAR_CART' });
      await clearCartApi();
      await fetchCart();
    } catch (err) {
      console.error('Failed to clear API cart', err);
      await fetchCart();
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
        fetchCart,
        version,
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