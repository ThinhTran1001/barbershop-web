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
    // Kiểm tra stock limit trước khi thêm
    const existingItem = cart.items.find(item => item.id === (product.id || product._id));
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    // Nếu đã đạt stock limit, không thêm nữa
    if (currentQuantity >= product.stock) {
      console.log('❌ Cart quantity already at max, preventing addition');
      return false;
    }
    
    // Tính số lượng thực tế có thể thêm
    const actualQuantityToAdd = Math.min(quantity, product.stock - currentQuantity);
    
    // Nếu không thể thêm gì cả
    if (actualQuantityToAdd <= 0) {
      console.log('❌ Cannot add any more items, stock limit reached');
      return false;
    }
    
    const cartItem = {
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      discount: product.discount || 0, // Thêm discount vào cart
      image: product.image,
      stock: product.stock,
      quantity: actualQuantityToAdd
    };
    dispatch({ type: ADD_TO_CART, payload: cartItem });
    return true; // Trả về true khi thêm thành công
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
    return cart.items.length;
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