import axios from "axios";

const API_URL = "https://luanvan-production-4c74.up.railway.app/api";

// 🟢 Đăng ký
const registerUser = async (userData) => {

  try {
    const response = await axios.post(`${API_URL}/register`, userData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi đăng ký:", error.response?.data || error.message);
    throw error;
  }
  console.log("Dữ liệu gửi:", userData);
};

// 🟡 Đăng nhập
const loginUser = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || "Lỗi đăng nhập!";
  }
};

// 🔵 Lấy thông tin user
const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 📊 Lấy số lượng user (Admin only)
const getUserCount = async () => {
  try {
    const res = await axios.get(`${API_URL}/users/count`);
    return res.data.count;
  } catch (error) {
    console.error("Lỗi lấy số lượng user:", error);
    throw error;
  }
};

// 📋 Lấy danh sách users
const getUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy danh sách users:", error);
    throw error;
  }
};

// ➕ Tạo user mới
const createUser = async (userData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/users`, userData, {
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo user:", error);
    throw error;
  }
};

// 🔄 Cập nhật thông tin user
const updateUser = async (id, userData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/users/${id}`, userData, {
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật user:", error);
    throw error;
  }
};

// ❌ Xóa user
const deleteUser = async (id) => {
 const token = localStorage.getItem("token");
  try {
    const response = await axios.delete(`${API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi xóa người dùng:", error.response?.data || error.message);
    throw error;
  }
};

export { 
  registerUser, 
  loginUser, 
  getCurrentUser, 
  getUserCount,
  getUsers,
  createUser,
  updateUser,
  deleteUser 
};
