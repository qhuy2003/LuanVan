import axios from "axios";

const API_URL = "https://luanvan-production-4c74.up.railway.app/api";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const getShipperDashboard = () => 
  axios.get(`${API_URL}/shipper/dashboard`, { 
    headers: getHeaders() 
  });

export const acceptOrder = (orderId) => 
  axios.post(`${API_URL}/shipper/orders/${orderId}/accept`, {}, { 
    headers: getHeaders() 
  });

export const updateOrderStatus = (orderId, data) => 
  axios.post(`${API_URL}/shipper/orders/${orderId}/status`, data, { 
    headers: getHeaders() 
  });