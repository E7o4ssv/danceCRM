import axios from 'axios';

// Base URL для API - автоматически определяется по среде
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://89.104.71.170:5000'  // Продакшн сервер
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001'); // Development или переменная окружения

console.log('API_BASE_URL:', API_BASE_URL, 'NODE_ENV:', process.env.NODE_ENV);

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем interceptor для автоматического добавления токена
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Добавляем interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.response?.data);
    if (error.response?.status === 401) {
      // Удаляем токен и перенаправляем на страницу входа
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 