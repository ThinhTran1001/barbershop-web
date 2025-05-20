import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const getProducts = () => api.get(`/admin/products`);
export const getProductById = (id) => api.get(`/admin/products/${id}`);
export const createProduct = (data) => api.post(`/admin/products`, data);
export const updateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`);

export const getCategories = () => api.get(`/admin/categories`);
export const getCategoryById = (id) => api.get(`/admin/categories/${id}`);
export const createCategory = (data) => api.post(`/admin/categories`, data);
export const updateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

export const getBrands = () => api.get(`/admin/brands`);
export const getBrandById = (id) => api.get(`/admin/brands/${id}`);
export const createBrand = (data) => api.post(`/admin/brands`, data);
export const updateBrand = (id, data) => api.put(`/admin/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`/admin/brands/${id}`);

// Thêm phần từ nhánh master
export const getAllServices = () => api.get(`/services`);
export const createService = (data) => api.post(`/services`, data);
export const updateService = (id, data) => api.put(`/services/${id}`, data);
export const removeService = (id) => api.delete(`/services/${id}`);

export default api;
