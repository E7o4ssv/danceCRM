import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaMusic, FaUser, FaSpinner } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'teacher'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register({
      username: formData.username,
      password: formData.password,
      name: formData.name,
      phone: formData.phone,
      role: formData.role
    });
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card max-w-lg">
        <div className="login-header">
          <div className="logo">
            <FaMusic />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Школа Танцев</h2>
          <p className="text-white/70">Регистрация в системе управления</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <div className="flex items-center">
              <FaUser className="mr-2" />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Полное имя</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Иван Иванов"
                disabled={loading}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">Имя пользователя</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="teacher123"
                disabled={loading}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Телефон</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 (999) 123-45-67"
              disabled={loading}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">Роль</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="form-control"
            >
              <option value="teacher">Преподаватель</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Пароль</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                disabled={loading}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                disabled={loading}
                className="form-control"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary w-full"
          >
            {loading ? <FaSpinner className="spinner" /> : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/70">
            Уже есть аккаунт?{' '}
            <Link 
              to="/login" 
              className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 