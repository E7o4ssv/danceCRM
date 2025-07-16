import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaPhone, FaGraduationCap } from 'react-icons/fa';

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    isActive: true
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Ошибка при загрузке студентов');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`/api/students/${editingStudent._id}`, formData);
      } else {
        await axios.post('/api/students', formData);
      }
      
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      setError('Ошибка при сохранении студента');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      phone: student.phone || '',
      isActive: student.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого студента?')) {
      try {
        await axios.delete(`/api/students/${studentId}`);
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        setError('Ошибка при удалении студента');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      isActive: true
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    resetForm();
  };

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Студенты</h2>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <FaPlus className="me-2" />
            Добавить студента
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Группы</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>
                      {student.phone ? (
                        <>
                          <FaPhone className="me-1" />
                          {student.phone}
                        </>
                      ) : (
                        <span className="text-muted">Не указан</span>
                      )}
                    </td>
                    <td>
                      {student.groups && student.groups.length > 0 ? (
                        <div>
                          {student.groups.map((group, index) => (
                            <Badge key={group._id} bg="info" className="me-1">
                              {group.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">Не в группах</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={student.isActive ? 'success' : 'secondary'}>
                        {student.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </td>
                    <td>
                      {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(student)}
                          >
                            <FaEdit />
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(student._id)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal для создания/редактирования студента */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingStudent ? 'Редактировать студента' : 'Добавить нового студента'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Имя студента *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="Введите имя студента"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Телефон</Form.Label>
              <Form.Control
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+7 (999) 123-45-67"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Студент активен"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button variant="primary" type="submit">
              {editingStudent ? 'Сохранить' : 'Добавить'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Students; 