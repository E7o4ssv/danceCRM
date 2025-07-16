import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FaUsers, FaGraduationCap, FaCalendarCheck, FaChartBar } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    groups: 0,
    students: 0,
    attendance: 0,
    recentAttendance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Получаем статистику в зависимости от роли пользователя
        const [groupsRes, studentsRes, attendanceRes] = await Promise.all([
          axios.get('/api/groups'),
          axios.get('/api/students'),
          axios.get('/api/attendance?limit=5')
        ]);

        setStats({
          groups: groupsRes.data.length,
          students: studentsRes.data.length,
          attendance: attendanceRes.data.length,
          recentAttendance: attendanceRes.data.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Ошибка при загрузке статистики');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-stats">
        <h2>Добро пожаловать, {user?.name}!</h2>
        <p className="mb-0">
          {user?.role === 'teacher' 
            ? 'Панель управления педагога' 
            : 'Панель управления администратора'
          }
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers className="text-primary mb-3" size={40} />
              <h3 className="text-primary">{stats.groups}</h3>
              <p className="text-muted mb-0">Групп</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaGraduationCap className="text-success mb-3" size={40} />
              <h3 className="text-success">{stats.students}</h3>
              <p className="text-muted mb-0">Студентов</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaCalendarCheck className="text-warning mb-3" size={40} />
              <h3 className="text-warning">{stats.attendance}</h3>
              <p className="text-muted mb-0">Отчетов о посещаемости</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaChartBar className="text-info mb-3" size={40} />
              <h3 className="text-info">
                {stats.recentAttendance.length}
              </h3>
              <p className="text-muted mb-0">Последние отчеты</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {user?.role === 'teacher' && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Быстрые действия</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Card className="text-center h-100 border-primary">
                  <Card.Body>
                    <h6>Создать группу</h6>
                    <p className="text-muted small">
                      Добавьте новую группу для занятий
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center h-100 border-success">
                  <Card.Body>
                    <h6>Добавить студента</h6>
                    <p className="text-muted small">
                      Зарегистрируйте нового ученика
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center h-100 border-warning">
                  <Card.Body>
                    <h6>Отметить посещаемость</h6>
                    <p className="text-muted small">
                      Создайте отчет о присутствии
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {user?.role === 'admin' && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Административные функции</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Card className="text-center h-100 border-primary">
                  <Card.Body>
                    <h6>Управление группами</h6>
                    <p className="text-muted small">
                      Просмотр и управление всеми группами
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center h-100 border-success">
                  <Card.Body>
                    <h6>Управление студентами</h6>
                    <p className="text-muted small">
                      Просмотр всех студентов школы
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center h-100 border-warning">
                  <Card.Body>
                    <h6>Отчеты о посещаемости</h6>
                    <p className="text-muted small">
                      Просмотр всех отчетов о посещаемости
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {stats.recentAttendance.length > 0 && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Последние отчеты о посещаемости</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Группа</th>
                    <th>Дата</th>
                    <th>Студентов</th>
                    <th>Присутствовало</th>
                    <th>Отправил</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAttendance.map((attendance) => (
                    <tr key={attendance._id}>
                      <td>{attendance.group?.name}</td>
                      <td>{new Date(attendance.date).toLocaleDateString('ru-RU')}</td>
                      <td>{attendance.students.length}</td>
                      <td>
                        {attendance.students.filter(s => s.present).length}
                      </td>
                      <td>{attendance.submittedBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Dashboard; 