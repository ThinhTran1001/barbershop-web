import React, { createContext, useContext, useReducer, useEffect } from 'react';
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

const cartReducer = (state, action) => {
  switch (action.type) {
    case LOAD_CART:
      return {
        ...state,
        items: action.payload.items || [],
      };
    default:
      return state;
  }
};

export const UserCartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });
  const { user, loading } = useAuth();

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
      const formattedItems = items.map((i) => ({
        id: i.productId._id || i.productId,
        name: i.productId.name,
        image: i.productId.image,
        price: i.productId.price,
        discount: i.productId.discount || 0,
        stock: i.productId.stock,
        quantity: i.quantity,
      }));
      dispatch({ type: LOAD_CART, payload: { items: formattedItems } });
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
      await updateItem(productId, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity in API cart', err);
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