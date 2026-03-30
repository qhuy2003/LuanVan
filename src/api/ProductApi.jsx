import axios from "axios";
import { toast } from 'react-toastify';
const API_URL = "https://luanvan-production-4c74.up.railway.app/api";

// 📦 Lấy danh sách sản phẩm
const getProducts = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

// 📦 Lấy danh sách sản phẩm cho nhà bán lẻ
const getProductsRetailer = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/products/retailer`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

//them san pham
const createProduct = async (data) => {
  const token = localStorage.getItem('token');
  if (!token) return toast.error('Vui lòng đăng nhập!');

  try {
    const res = await axios.post(`${API_URL}/products`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.errors
      ? Object.values(err.response.data.errors).flat()[0]
      : err.response?.data?.message || 'Lỗi server';

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      toast.error('Phiên hết hạn!');
      setTimeout(() => window.location.href = '/login', 1000);
    } else {
      toast.error(msg);
    }   
    throw err;
  }
};


const updateProduct = async (id, productData) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(`${API_URL}/products/${id}`, productData, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

// 🗑️ Xóa sản phẩm
// const deleteProduct = async (id) => {
//   const token = localStorage.getItem("token");
//   try {
//     const response = await axios.delete(`${API_URL}/products/${id}`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Lỗi xóa sản phẩm:", error.response?.data || error.message);
//     throw error;
//   }
// };

// Hiển thị/ẩn sản phẩm 
const toggleVisibility = async (productId) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(
    `${import.meta.env.VITE_API_URL}/products/${productId}/toggle`,
    {}, // body rỗng
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};
// 🔍 Lấy chi tiết một sản phẩm
const getProductById = async (id) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy thông tin sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

// 🔢 Đếm số lượng sản phẩm
const getProductCount = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/products/count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.count;
  } catch (error) {
    console.error("Lỗi lấy số lượng sản phẩm:", error);
    throw error;
  }
};

// 🔁 Lấy danh sách loại vận chuyển
const getShippingTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/shipping-types`);
    return response.data; // trả về mảng loại vận chuyển
  } catch (error) {
    console.error('Lỗi tải loại vận chuyển:', error.response?.data || error.message);
    throw error;
  }
};
const getProductsByBrand = (brandId) => {
  return axios.get(`${API_URL}/products?brand_id=${brandId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.data);
};
export {
  getProducts,
  createProduct,
  updateProduct,
  toggleVisibility,
  // deleteProduct,
  getProductById,
  getShippingTypes,
  getProductsByBrand,
  getProductCount,
  getProductsRetailer
};
