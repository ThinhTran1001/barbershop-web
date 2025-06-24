import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cartStorage } from '../utils/localStorage';

const CartContext = createContext();

// Action types
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const LOAD_CART = 'LOAD_CART';

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case ADD_TO_CART:
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload]
        };
      }

    case REMOVE_FROM_CART:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case CLEAR_CART:
      return {
        ...state,
        items: []
      };

    case LOAD_CART:
      return {
        ...state,
        items: action.payload.items || []
      };

    default:
      return state;
  }
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, {
    items: []
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = cartStorage.getCart();
    if (savedCart && savedCart.items) {
      dispatch({ type: LOAD_CART, payload: savedCart });
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    cartStorage.setCart(cart);
  }, [cart]);

  // Cart actions
  const addToCart = (product, quantity = 1) => {
    const cartItem = {
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      discount: product.discount || 0,
      image: product.image,
      stock: product.stock,
      quantity: quantity
    };
    dispatch({ type: ADD_TO_CART, payload: cartItem });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: UPDATE_QUANTITY, payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };

  // Calculate cart totals
  const getCartTotal = () => {
    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.price.toString().replace(/[^\d]/g, ""));
      const discountedPrice = item.discount > 0 
        ? price - (price * item.discount / 100) 
        : price;
      return total + (discountedPrice * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 