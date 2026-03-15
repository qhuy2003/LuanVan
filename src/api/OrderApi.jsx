import axios from 'axios';
const API_URL = "http://127.0.0.1:8000/api";

const getToken = () => localStorage.getItem('token');

const getHeaders = () => {
  return {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  };
};

 const createOrder = async (payload) => {
  const token = getToken();
  const response = await axios.post(`${API_URL}/orders`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
 const getAdminOrders = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

 const transferToWaitingPickup = async (orderId) => {
  const token = localStorage.getItem('token');
  const res = await axios.patch(
    `${API_URL}/admin/orders/${orderId}/waiting-pickup`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

 const getBrandOrders = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/brand/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

 const confirmOrder = async (orderId) => {
  const token = getToken();
  const res = await axios.patch(
    `${API_URL}/brand/orders/${orderId}/confirm`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

 const rejectOrder = async (orderId) => {
  const token = getToken();
  const res = await axios.patch(
    `${API_URL}/brand/orders/${orderId}/reject`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

 const getRetailerOrders = () => 
  axios.get(`${API_URL}/retailer/orders`, getHeaders());

 const completeOrder = (orderId) => 
  axios.post(`${API_URL}/retailer/orders/${orderId}/complete`, {}, getHeaders());

 const cancelOrder = (orderId) => {
  const token = localStorage.getItem('token');
  return axios.post(
    `${API_URL}/retailer/orders/${orderId}/cancel`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
};

 const refundOrder = (orderId) => {
  const token = localStorage.getItem('token');
  return axios.post(
    `${API_URL}/retailer/orders/${orderId}/refund`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
};

export { 
  createOrder,
  getAdminOrders,
  transferToWaitingPickup,
  getBrandOrders,
  confirmOrder,
  rejectOrder,
  getRetailerOrders,
  completeOrder,
  cancelOrder,
  refundOrder
};  