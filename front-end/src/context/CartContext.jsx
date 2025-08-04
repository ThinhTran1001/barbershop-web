import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cartStorage } from '../utils/localStorage';
import { getProducts } from '../services/api';

const CartContext = createContext();

// Action types
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const LOAD_CART = 'LOAD_CART';
const SYNC_STOCK = 'SYNC_STOCK';

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

    case SYNC_STOCK:
      return {
        ...state,
        items: state.items.map(item => {
          const updatedProduct = action.payload.products.find(p => p._id === item.id || p.id === item.id);
          if (updatedProduct) {
            return {
              ...item,
              stock: updatedProduct.stock,
              price: updatedProduct.price,
              discount: updatedProduct.discount || 0,
              name: updatedProduct.name,
              image: updatedProduct.image
            };
          }
          return item;
        })
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
    // Kiểm tra sản phẩm có hết hàng không
    if (product.stock === 0) {
      console.log('❌ Cannot add out of stock product to cart:', product.name);
      return false;
    }
    
    const existingItem = cart.items.find(item => item.id === (product.id || product._id));
    
    const cartItem = {
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      discount: product.discount || 0,
      image: product.image,
      stock: product.stock,
      quantity: quantity
    };
    
    if (existingItem) {
      // Nếu sản phẩm đã có trong giỏ hàng, cộng thêm số lượng
      dispatch({ type: UPDATE_QUANTITY, payload: { id: product.id || product._id, quantity: existingItem.quantity + quantity } });
    } else {
      // Nếu sản phẩm chưa có, thêm mới
      dispatch({ type: ADD_TO_CART, payload: cartItem });
    }
    
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

  // Sync stock with server
  const syncStock = async () => {
    try {
      if (cart.items.length === 0) return;
      
      // Lấy danh sách product IDs từ cart
      const productIds = cart.items.map(item => item.id);
      
      // Gọi API để lấy thông tin sản phẩm mới nhất
      const response = await getProducts();
      const products = response.data || [];
      
      // Lọc ra các sản phẩm có trong cart
      const cartProducts = products.filter(product => 
        productIds.includes(product._id) || productIds.includes(product.id)
      );
      
      // Dispatch action để cập nhật stock
      dispatch({ type: SYNC_STOCK, payload: { products: cartProducts } });
      
      console.log('✅ Cart stock synced with server');
    } catch (error) {
      console.error('❌ Error syncing cart stock:', error);
    }
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    syncStock
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 