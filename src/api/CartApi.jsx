// src/api/CartApi.jsx
import axios from "axios";
import { toast } from 'react-toastify';

const API_URL = "http://127.0.0.1:8000/api";

// Lấy giỏ hàng
const getCart = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error.response?.data || error.message);
    throw error;
  }
};

// Thêm sản phẩm vào giỏ
const addToCartApi = async (productId, quantity = 1) => {
  const token = localStorage.getItem('token');
  if (!token) return toast.error('Vui lòng đăng nhập!');

  try {
    const response = await axios.post(`${API_URL}/cart/add`, 
      { product_id: productId, quantity },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.errors
      ? Object.values(err.response.data.errors).flat()[0]
      : err.response?.data?.message || 'Không thể thêm vào giỏ';

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Phiên hết hạn!');
      setTimeout(() => window.location.href = '/login', 1000);
    } else {
      toast.error(msg);
    }
    throw err;
  }
};

// Cập nhật số lượng
const updateCartItemApi = async (productId, quantity) => {
  const token = localStorage.getItem('token');
  if (!token) return toast.error('Vui lòng đăng nhập!');

  try {
    const response = await axios.put(`${API_URL}/cart/update/${productId}`, 
      { quantity },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Cập nhật thất bại';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Phiên hết hạn!');
      setTimeout(() => window.location.href = '/login', 1000);
    } else {
      toast.error(msg);
    }
    throw err;
  }
};

// Xóa sản phẩm khỏi giỏ
const removeFromCartApi = async (productId) => {
  const token = localStorage.getItem('token');
  if (!token) return toast.error('Vui lòng đăng nhập!');

  try {
    const response = await axios.delete(`${API_URL}/cart/remove/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Xóa thất bại';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Phiên hết hạn!');
      setTimeout(() => window.location.href = '/login', 1000);
    } else {
      toast.error(msg);
    }
    throw err;
  }
};

// Làm trống giỏ hàng
const clearCartApi = async () => {
  const token = localStorage.getItem('token');
  if (!token) return toast.error('Vui lòng đăng nhập!');

  try {
    const response = await axios.delete(`${API_URL}/cart/clear`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Đã làm trống giỏ hàng');
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Làm trống giỏ thất bại';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Phiên hết hạn!');
      setTimeout(() => window.location.href = '/login', 1000);
    } else {
      toast.error(msg);
    }
    throw err;
  }
};

export {
  getCart,
  addToCartApi,
  updateCartItemApi,
  removeFromCartApi,
  clearCartApi
};