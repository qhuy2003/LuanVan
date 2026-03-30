import axios from 'axios';
import { toast } from 'react-toastify';
const API_URL = 'https://luanvan-production-4c74.up.railway.app/api';

const getToken = () => localStorage.getItem('token');




const getPromotions = async () => {
  const token = getToken();
  try {
    const response = await axios.get(`${API_URL}/promotions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    // Better error diagnostics for auth issues
    if (error.response?.status === 401) {
      // token invalid or expired — clear and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    toast.error("Không thể tải danh sách khuyến mãi");
    throw error;
  }
};


const createPromotion = async (data) => {
  const token = getToken();
  try {
    const response = await axios.post(`${API_URL}/promotions`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Tạo khuyến mãi thành công!');
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Tạo khuyến mãi thất bại';
    toast.error(msg);
    throw error;
  }
};


const updatePromotion = async (id, data) => {
  const token = getToken();
  try {
    const response = await axios.put(`${API_URL}/promotions/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Cập nhật khuyến mãi thành công!');
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Cập nhật thất bại';
    toast.error(msg);
    throw error;
  }
};

// Xóa khuyến mãi (admin)
 const deletePromotion = async (id) => {
  const token = getToken();
  try {
    await axios.delete(`${API_URL}/promotions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Đã xóa khuyến mãi');
  } catch (error) {
    const msg = error.response?.data?.message || 'Xóa thất bại';
    toast.error(msg);
    throw error;
  }
};

// Bật/tắt khuyến mãi (admin)
 const toggleActive = async (id) => {
  const token = getToken();
  try {
    const response = await axios.patch(`${API_URL}/promotions/${id}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success(response.data.message || 'Đã đổi trạng thái');
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Thao tác thất bại';
    toast.error(msg);
    throw error;
  }
};

// Áp dụng mã giảm giá (dành cho khách – retailer)
const applyVoucher = async (code, orderAmount = 0) => {
  const token = getToken();
  try {
    const response = await axios.post(`${API_URL}/vouchers/apply`, {
      code,
      order_amount: orderAmount  
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Mã không hợp lệ';
    throw error;
  }
};

const getPublicPromotions = async () => {
  const token = getToken();
  try {
    const response = await axios.get(`${API_URL}/promotions/public`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
const getBrandPromotions = async (brandId,data) => {
  const token = getToken();
  try {
    const response = await axios.get(`${API_URL}/promotions/brand/${brandId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export { getPromotions, createPromotion, updatePromotion, deletePromotion, toggleActive, applyVoucher,getPublicPromotions,getBrandPromotions };
