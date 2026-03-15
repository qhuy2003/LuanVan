import axios from 'axios';
const API_URL = "http://127.0.0.1:8000/api";

export const getBrands = () => {
  return axios.get(`${API_URL}/brands`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.data);
};