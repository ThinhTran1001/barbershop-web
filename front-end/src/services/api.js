import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

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

export default api;
