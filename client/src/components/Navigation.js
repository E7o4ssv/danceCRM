import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar expand="lg" className="navbar">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">
          🕺 Школа Танцев
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active' : ''}
            >
              Главная
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/groups" 
              className={isActive('/groups') ? 'active' : ''}
            >
              Группы
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/students" 
              className={isActive('/students') ? 'active' : ''}
            >
              Студенты
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/attendance" 
              className={isActive('/attendance') ? 'active' : ''}
            >
              Посещаемость
            </Nav.Link>
          </Nav>
          
          <Nav className="ms-auto">
            <Nav.Item className="d-flex align-items-center me-3">
              <FaUser className="me-2" />
              <span className="text-white">
                {user?.name} ({user?.role === 'teacher' ? 'Педагог' : 'Администратор'})
              </span>
            </Nav.Item>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-1" />
              Выйти
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation; 