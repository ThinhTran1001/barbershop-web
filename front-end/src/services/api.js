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
export const updateVoucher = (id, data) => api.put(`/vouchers/${id}`, data); 
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`);

// User Voucher API
export const getAllUserVouchers = (params) => api.get('/user-vouchers', { params });
export const createUserVoucher = (data) => api.post('/user-vouchers', data);
export const updateUserVoucher = (id, data) => api.put(`/user-vouchers/${id}`, data);
export const deleteUserVoucher = (id) => api.delete(`/user-vouchers/${id}`);

export const getAllOrder = (params) => api.get('/orders', { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

export const loginUser = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const verify = (data) => api.post('/auth/verify-otp', data);
export const resend = (data) => api.post('/auth/resend-otp', data);
export const logoutUser = () => api.post('/auth/logout');
export const refreshToken = () => api.post('/auth/refresh-token');
export const getMe = () => api.get(`/auth/me`);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export default api;
