import React from 'react';

const AuthErrorHandler = ({ error, onRetry, onLogout }) => {
  if (!error) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Ошибка аутентификации</h3>
          <p className="text-white/70">{error}</p>
        </div>
        
        <div className="space-y-3">
          {onRetry && (
            <button 
              onClick={onRetry}
              className="btn btn-primary w-full"
            >
              Попробовать снова
            </button>
          )}
          
          {onLogout && (
            <button 
              onClick={onLogout}
              className="btn btn-outline w-full"
            >
              Выйти из системы
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthErrorHandler; 