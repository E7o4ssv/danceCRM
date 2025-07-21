import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import Students from './components/Students';
import Teachers from './components/Teachers';
import Attendance from './components/Attendance';
import IndividualLessons from './components/IndividualLessons';
import Chat from './components/Chat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Загрузка...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Компонент для маршрутов только для администраторов
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Загрузка...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="app">
        {user && <Navbar />}
        <main className="main-content">
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/groups" 
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/students" 
              element={
                <ProtectedRoute>
                  <Students />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teachers" 
              element={
                <AdminRoute>
                  <Teachers />
                </AdminRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute>
                  <Attendance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/individual-lessons" 
              element={
                <ProtectedRoute>
                  <IndividualLessons />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } 
            />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 