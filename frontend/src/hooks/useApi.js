import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const useApi = () => {
  const get = async (path) => {
    try {
      const response = await axios.get(`${API_URL}${path}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const post = async (path, data, authHeader = null) => {
    try {
      const config = authHeader ? {
        headers: { Authorization: authHeader }
      } : {};

      const response = await axios.post(`${API_URL}${path}`, data, config);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const put = async (path, data, authHeader = null) => {
    try {
      const config = authHeader ? {
        headers: { Authorization: authHeader }
      } : {};

      const response = await axios.put(`${API_URL}${path}`, data, config);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const del = async (path, authHeader = null) => {
    try {
      const config = authHeader ? {
        headers: { Authorization: authHeader }
      } : {};

      const response = await axios.delete(`${API_URL}${path}`, config);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  return { get, post, put, del };
};
