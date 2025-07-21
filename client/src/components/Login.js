import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGraduationCap, FaSpinner, FaEye, FaEyeSlash, FaMusic } from 'react-icons/fa';
import logo from '../logo-2.svg';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Перенаправляем на главную страницу после успешного входа
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-dance-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary-500/5 rounded-full blur-3xl animate-bounce-slow"></div>
      </div>

      {/* Login Card */}
      <div className="glass-modal w-full max-w-md relative z-10 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 shadow-dance animate-float">
            <img src={logo} alt="Школа Танцев" className="w-20 h-20 filter brightness-0 invert" />
          </div>
          <p className="text-lg text-white/80">Войдите в свой аккаунт</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-error mb-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-base">{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="form-label text-lg text-white/95 mb-3 flex items-center gap-2">
              <FaGraduationCap className="w-5 h-5" />
              Имя пользователя
            </label>
            <input
              type="text"
              name="username"
              className="form-control text-lg py-4 px-4"
              placeholder="Введите ваше имя пользователя"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label text-lg text-white/95 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Пароль
            </label>
            <div className="relative">
            <input
                type={showPassword ? 'text' : 'password'}
              name="password"
                className="form-control pr-14 text-lg py-4 px-4"
                placeholder="Введите ваш пароль"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-4 text-lg font-semibold relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-dance-500/20 to-primary-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <FaSpinner className="animate-spin w-5 h-5" />
                  <span>Вход в систему...</span>
                </>
              ) : (
                <>
                  <FaGraduationCap className="w-5 h-5" />
                  <span>Войти</span>
                </>
              )}
            </div>
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-white/70 mb-4 text-lg">Нет аккаунта?</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 text-primary-400 hover:text-primary-300 transition-colors font-medium text-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Создать аккаунт
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-white/60 text-base">
          © 2024 Система управления танцевальной школой
        </p>
      </div>
    </div>
  );
};

export default Login; 