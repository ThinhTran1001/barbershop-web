import api from "./axiosInstance";

export const getProducts = () => api.get(`/products`);
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post(`/products`, data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const getCategories = () => api.get(`/categories`);
export const getCategoryById = (id) => api.get(`/categories/${id}`);
export const createCategory = (data) => api.post(`/categories`, data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

export const getBrands = () => api.get(`/brands`);
export const getBrandById = (id) => api.get(`/brands/${id}`);
export const createBrand = (data) => api.post(`/brands`, data);
export const updateBrand = (id, data) => api.put(`/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`/brands/${id}`);

// Thêm phần từ nhánh master
export const getAllServices = () => api.get(`/services`);
export const createService = (data) => api.post(`/services`, data);
export const updateService = (id, data) => api.put(`/services/${id}`, data);
export const removeService = (id) => api.delete(`/services/${id}`);

export const getAllUser = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

export const getAllBarber = () => api.get('/barbers');
export const createBarber = (data) => api.post('/barbers', data);
export const updateBarber = (id, data) => api.put(`/barbers/${id}`, data);
export const deleteBarber = (id) => api.delete(`/barbers/${id}`);

export const getAllVoucher = (params) => api.get('/vouchers', { params });
export const createVoucher = (data) => api.post('/vouchers', data); 
export const getVoucherById = (id) => api.get(`/vouchers/${id}`);
export const getVoucherByUser = () => api.get('/vouchers/user');
export const updateVoucher = (id, data) => api.put(`/vouchers/${id}`, data); 
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`);

// User Voucher API
export const getAllUserVouchers = (params) => api.get('/user-vouchers', { params });
export const getAllVoucherByUser = () => api.get('/user-vouchers/user');
export const createUserVoucher = (data) => api.post('/user-vouchers', data);
export const updateUserVoucher = (id, data) => api.put(`/user-vouchers/${id}`, data);
export const deleteUserVoucher = (id) => api.delete(`/user-vouchers/${id}`);

export const getAllOrder = (params) => api.get('/orders', { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const createOrderGuest = (data) => api.post('/orders/guest', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

export const getCart = (params) => api.get('/carts',{params});
export const addItem = (data) => api.post('/carts', data);
export const updateItem = (productId, data) => api.put('/carts', { productId, quantity: data.quantity });
export const removeItem = (id) => api.delete(`/carts/${id}`);
export const clearCart = () => api.delete(`/carts`);

export const loginUser = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const verify = (data) => api.post('/auth/verify-otp', data);
export const resend = (data) => api.post('/auth/resend-otp', data);
export const logoutUser = () => api.post('/auth/logout');
export const refreshToken = () => api.post('/auth/refresh-token');
export const getMe = () => api.get(`/auth/me`);
export const getProfile = () => api.get(`/users/profile/me`);
export const updateProfile = (formData) =>  api.patch(`/users/profile/me`, formData);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const sendChat = async (message, chatHistory = []) => {
  try {
    const response = await api.post(`/chatbot`, { message, chatHistory }, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('API response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error details:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const getFeedbacksByProduct = (productId) => api.get(`/product-reviews/product/${productId}`);
export const getAllFeedbacks = (params) => api.get('/product-reviews', { params });
export const createFeedback = (data) => api.post('/product-reviews', data);
export const approveFeedback = (id) => api.patch(`/product-reviews/${id}/approve`);
export const unapprovalFeedback = (id) => api.patch(`/product-reviews/${id}/unapprove`);
export const deleteFeedback = (id) => api.delete(`/product-reviews/${id}`);

// Feedback APIs (Barber)
export const getBarberFeedbacks = (params) => api.get('/feedback-barber', { params });
export const getBarberFeedbackById = (id) => api.get(`/feedback-barber/${id}`);
export const createBarberFeedback = (data) => api.post('/feedback-barber', data);
export const updateBarberFeedbackApproval = (id, isApproved) =>
  api.patch(`/feedback-barber/${id}/approve`, { isApproved });
export const deleteBarberFeedback = (id) => api.delete(`/feedback-barber/${id}`);

export const getDiscounts = (params) => api.get('/discounts', { params }); 
export const getDiscountById = (id) => api.get(`/discounts/${id}`);
export const createDiscount = (data) => api.post('/discounts', data);
export const updateDiscount = (id, data) => api.put(`/discounts/${id}`, data);
export const deleteDiscount = (id) => api.delete(`/discounts/${id}`);
export const getProductDiscounts = (productId) => api.get(`/discounts/product/${productId}`);
export const toggleDiscountStatus = (id) => api.patch(`/discounts/${id}/toggle-status`);
export const getDiscountStats = () => api.get('/discounts/stats');
export const cleanupExpiredDiscounts = () => api.post('/discounts/cleanup-expired');

export const getAllBookings = (params) => api.get('/bookings/all', { params });
export const getBookingChartStats = (params) => api.get('/bookings/chart-stats', { params });
export const getBookingDetail = (id) => api.get(`/bookings/${id}`);
export const getBookingStats = () => api.get('/bookings/stats');

export default api;
