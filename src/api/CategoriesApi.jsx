import axios from "axios";

const API_URL = "https://luanvan-production-4c74.up.railway.app/api";

// 📋 Lấy danh sách categories
const getCategories = async () => {
    const token = localStorage.getItem("token");
    try {
        const response = await axios.get(`${API_URL}/categories`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách danh mục:", error.response?.data || error.message);
        throw error;
    }
};

// ➕ Thêm category mới
const createCategories = async (categoryData) => {
    const token = localStorage.getItem("token");
    try {
        const response = await axios.post(`${API_URL}/categories`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi thêm danh mục:", error.response?.data || error.message);
        throw error;
    }
};

// 📝 Cập nhật category
const updateCategories = async (id, categoryData) => {
    const token = localStorage.getItem("token");
    try {
        const response = await axios.put(`${API_URL}/categories/${id}`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi cập nhật danh mục:", error.response?.data || error.message);
        throw error;
    }
};

// 🗑️ Xóa category
const deleteCategories = async (id) => {
    const token = localStorage.getItem("token");
    try {
        const response = await axios.delete(`${API_URL}/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi xóa danh mục:", error.response?.data || error.message);
        throw error;
    }
};

// 🔍 Lấy chi tiết một category
const getCategoriesById = async (id) => {
    const token = localStorage.getItem("token");
    try {
        const response = await axios.get(`${API_URL}/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy thông tin danh mục:", error.response?.data || error.message);
        throw error;
    }
};

export {
    getCategories,
    createCategories,
    updateCategories,
    deleteCategories,
    getCategoriesById
};