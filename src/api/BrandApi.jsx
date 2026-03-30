import axios from 'axios';
const API_URL = "https://luanvan-production-4c74.up.railway.app/api";

export const getBrands = () => {
  return axios.get(`${API_URL}/brands`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.data);
};