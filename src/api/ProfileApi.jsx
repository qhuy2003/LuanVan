// src/api/ProfileApi.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const getHeaders = () => ({
  headers: { 
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export const getMyProfile = () => 
  axios.get(`${API_URL}/me`, getHeaders());

export const updateMyProfile = (data) => {
  return axios.post(`${API_URL}/me`, data, getHeaders());
};

export const changeMyPassword = (data) => 
  axios.put(`${API_URL}/me/password`, data, getHeaders());

export const getBrandInfo = (brandId) => 
  axios.get(`${API_URL}/brands/${brandId}`, getHeaders());