import api from "./axiosInstance";

// Product
export const getProducts = () => api.get(`/products`);
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post(`/products`, data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Category
export const getCategories = () => api.get(`/categories`);
export const getCategoryById = (id) => api.get(`/categories/${id}`);
export const createCategory = (data) => api.post(`/categories`, data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Brand
export const getBrands = () => api.get(`/brands`);
export const getBrandById = (id) => api.get(`/brands/${id}`);
export const createBrand = (data) => api.post(`/brands`, data);
export const updateBrand = (id, data) => api.put(`/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`/brands/${id}`);

// Service
export const getAllServices = () => api.get(`/services`);
export const createService = (data) => {
  // Nếu data là FormData, không set Content-Type để browser tự set
  if (data instanceof FormData) {
    return api.post(`/services`, data);
  }
  // Đảm bảo truyền đúng field images là mảng
  if (data.imageUrl && !data.images) {
    data.images = [data.imageUrl];
    delete data.imageUrl;
  }
  return api.post(`/services`, data);
};
export const updateService = (id, data) => {
  // Nếu data là FormData, không set Content-Type để browser tự set
  if (data instanceof FormData) {
    return api.put(`/services/${id}`, data);
  }
  // Đảm bảo truyền đúng field images là mảng
  if (data.imageUrl && !data.images) {
    data.images = [data.imageUrl];
    delete data.imageUrl;
  }
  return api.put(`/services/${id}`, data);
};
export const removeService = (id) => api.delete(`/services/${id}`);

// User
export const getAllUser = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Barber
export const getAllBarber = (params) => api.get('/barbers', { params });
export const createBarber = (data) => api.post('/barbers', data);
export const updateBarber = (id, data) => api.put(`/barbers/${id}`, data);
export const deleteBarber = (id) => api.delete(`/barbers/${id}`);

// Voucher
export const getAllVoucher = (params) => api.get('/vouchers', { params });
export const createVoucher = (data) => api.post('/vouchers', data);
export const getVoucherById = (id) => api.get(`/vouchers/${id}`);
export const getVoucherByUser = () => api.get('/vouchers/user');
export const getPersonalVouchers = () => api.get('/vouchers/personal');
export const updateVoucher = (id, data) => api.put(`/vouchers/${id}`, data);
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`);

// User Voucher
export const getAllUserVouchers = (params) => api.get('/user-vouchers', { params });
export const getAllVoucherByUser = () => api.get('/user-vouchers/user');
export const createUserVoucher = (data) => api.post('/user-vouchers', data);
export const updateUserVoucher = (id, data) => api.put(`/user-vouchers/${id}`, data);
export const deleteUserVoucher = (id) => api.delete(`/user-vouchers/${id}`);

// Order
export const getAllOrder = (params) => api.get('/orders', { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const createOrderGuest = (data) => api.post('/orders/guest', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Cart
export const getCart = (params) => api.get('/carts', { params });
export const addItem = (data) => api.post('/carts', data);
export const updateItem = (productId, data) => api.put('/carts', { productId, quantity: data.quantity });
export const removeItem = (id) => api.delete(`/carts/${id}`);
export const clearCart = () => api.delete(`/carts`);

// Auth
export const loginUser = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const verify = (data) => api.post('/auth/verify-otp', data);
export const resend = (data) => api.post('/auth/resend-otp', data);
export const logoutUser = () => api.post('/auth/logout');
export const refreshToken = () => api.post('/auth/refresh-token');
export const getMe = () => api.get(`/auth/me`);
export const getProfile = () => api.get(`/users/profile/me`);
export const updateProfile = (formData) => api.patch(`/users/profile/me`, formData);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Address
export const getUserAddresses = () => api.get('/addresses');
export const createAddress = (data) => api.post('/addresses', data);
export const updateAddress = (id, data) => api.put(`/addresses/${id}`, data);
export const deleteAddress = (id) => api.delete(`/addresses/${id}`);
export const setDefaultAddress = (id) => api.patch(`/addresses/${id}/set-default`);

// OAuth
export const initiateGoogleLogin = () => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=703568250378-bookqj2l9dv38j3m24kf5737dja1arbj.apps.googleusercontent.com&redirect_uri=${encodeURIComponent('http://localhost:3000/api/auth/google')}&response_type=code&scope=email%20profile`;
  window.location.href = googleAuthUrl;
};

// Chat
export const sendChat = async (message, chatHistory = []) => {
  try {
    const response = await api.post(`/chatbot`, { message, chatHistory }, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    throw error;
  }
};

// Upload
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Feedback Product
export const getFeedbacksByProduct = (productId) => api.get(`/product-reviews/product/${productId}`);
export const getAllFeedbacks = (params) => api.get('/product-reviews', { params });
export const createFeedback = (data) => api.post('/product-reviews', data);
export const deleteFeedback = (id) => api.delete(`/product-reviews/${id}`);
export const updateFeedbackStatus = (id, status) => api.patch(`/product-reviews/${id}/status`, { status });


// Feedback Barber
export const getBarberFeedbacks = (params) => api.get('/feedback-barber', { params });
export const getBarberFeedbackById = (id) => api.get(`/feedback-barber/${id}`);
export const createBarberFeedback = (data) => api.post('/feedback-barber', data);

export const deleteBarberFeedback = (id) => api.delete(`/feedback-barber/${id}`);
export const updateBarberFeedbackStatus = (id, status) => api.patch(`/feedback-barber/${id}/status`, { status });

export const getBarberFeedbackByBookingId = (bookingId) =>
  api.get(`/feedback-barber/booking/${bookingId}`);

// Discount
export const getDiscounts = (params) => api.get('/discounts', { params });
export const getDiscountById = (id) => api.get(`/discounts/${id}`);
export const createDiscount = (data) => api.post('/discounts', data);
export const updateDiscount = (id, data) => api.put(`/discounts/${id}`, data);
export const deleteDiscount = (id) => api.delete(`/discounts/${id}`);
export const getProductDiscounts = (productId) => api.get(`/discounts/product/${productId}`);
export const toggleDiscountStatus = (id) => api.patch(`/discounts/${id}/toggle-status`);



// Booking
export const getAllBookings = (params) => api.get('/bookings/all', { params });
export const getBookingChartStats = (params) => api.get('/bookings/chart-stats', { params });
export const getBookingDetail = (id) => api.get(`/bookings/${id}`);
export const getBookingStats = () => api.get('/bookings/stats');

// Booking Status Management
export const rejectBooking = (bookingId, data) => api.put(`/bookings/${bookingId}/reject`, data);
export const markBookingNoShow = (bookingId, data) => api.put(`/bookings/${bookingId}/no-show`, data);
export const updateBookingStatus = (bookingId, status) => api.put(`/bookings/${bookingId}/status`, { status });

// Feedback Order & Booking
export const createFeedbackOrder = (data) => api.post('/feedback-orders', data);
export const updateFeedbackOrder = (orderId, data) => api.put(`/feedback-orders/${orderId}`, data);
export const getFeedbackOrderByOrderId = (orderId) => api.get(`/feedback-orders/${orderId}`);

export const finalizeOrder = (orderCode, orderData, userId = null) => {
  if (userId) {
    return api.post(`/orders/finalize-auth`, { orderCode, orderData, userId });
  } else {
    return api.post(`/orders/finalize-guest`, { orderCode, orderData });
  }
};


export const createFeedbackBooking = (data) => api.post('/feedback-bookings', data);
export const updateFeedbackBooking = (bookingId, data) => api.put(`/feedback-bookings/${bookingId}`, data);
export const getFeedbackBookingByBookingId = (bookingId) => api.get(`/feedback-bookings/${bookingId}`);

// Blog
export const getAllBlogs = (params) => api.get('/news', { params });
export const getBlogById = (id) => api.get(`/news/${id}`);
export const createBlog = (data) => api.post('/news', data);
export const updateBlog = (id, data) => api.put(`/news/${id}`, data);
export const deleteBlog = (id) => api.delete(`/news/${id}`);

export const getOrderByCode = (code) => api.get(`/orders/code/${code}`);
export const updateStatusPayment = (orderId, status, paidAt) => api.put(`/payments/order/${orderId}`, { status, paidAt });
export const markPaymentAsPaid = (orderId) => api.put(`/payments/mark-paid/${orderId}`);


export default api;
