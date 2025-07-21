import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaHome, FaUsers, FaGraduationCap, FaChalkboardTeacher, 
  FaCalendarCheck, FaComments, FaUser, FaSignOutAlt, FaMusic,
  FaBars, FaTimes
} from 'react-icons/fa';
import logo from '../logo-2.svg';

const navItems = [
  { path: '/dashboard', label: 'Главная', icon: FaHome },
  { path: '/groups', label: 'Группы', icon: FaUsers },
  { path: '/students', label: 'Студенты', icon: FaGraduationCap },
  { path: '/teachers', label: 'Учителя', icon: FaChalkboardTeacher },
  { path: '/individual-lessons', label: 'Индивидуальные', icon: FaUser },
  { path: '/attendance', label: 'Посещаемость', icon: FaCalendarCheck },
  { path: '/chat', label: 'Чат', icon: FaComments }
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.path === '/teachers' && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <nav className="navbar">
      <div className="container">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="Школа Танцев" className="w-12 h-12 filter brightness-0 invert" />
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {filteredNavItems.map((item) => {
      const Icon = item.icon;
      return (
          <NavLink 
                  key={item.path}
            to={item.path} 
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
          >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
          </NavLink>
      );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <FaUser className="w-3 h-3 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-white">{user?.name}</div>
                <div className="text-xs text-white/60">
                  {user?.role === 'admin' ? 'Администратор' : 'Преподаватель'}
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title="Выйти"
            >
              <FaSignOutAlt className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 border-t border-white/20 pt-4">
            <div className="space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-base">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            
            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <FaUser className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white text-base">{user?.name}</div>
                  <div className="text-sm text-white/60">
                    {user?.role === 'admin' ? 'Администратор' : 'Преподаватель'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline w-full"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 