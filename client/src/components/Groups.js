import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FaPlus, FaEdit, FaUsers, FaCalendar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    dayOfWeek: 'monday',
    time: '',
    isActive: true
  });

  const daysOfWeek = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье'
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Ошибка при загрузке групп');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await axios.put(`/api/groups/${editingGroup._id}`, formData);
      } else {
        await axios.post('/api/groups', formData);
      }
      
      setShowModal(false);
      setEditingGroup(null);
      resetForm();
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      setError('Ошибка при сохранении группы');
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      room: group.room,
      dayOfWeek: group.dayOfWeek,
      time: group.time,
      isActive: group.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (groupId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту группу?')) {
      try {
        await axios.delete(`/api/groups/${groupId}`);
        fetchGroups();
      } catch (error) {
        console.error('Error deleting group:', error);
        setError('Ошибка при удалении группы');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      room: '',
      dayOfWeek: 'monday',
      time: '',
      isActive: true
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGroup(null);
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
        <h2>Группы</h2>
        {user?.role === 'teacher' && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <FaPlus className="me-2" />
            Создать группу
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
                  <th>Название</th>
                  <th>Зал</th>
                  <th>День недели</th>
                  <th>Время</th>
                  <th>Студентов</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group._id}>
                    <td>
                      <strong>{group.name}</strong>
                      <br />
                      <small className="text-muted">
                        Педагог: {group.teacher?.name}
                      </small>
                    </td>
                    <td>
                      <FaMapMarkerAlt className="me-1" />
                      {group.room}
                    </td>
                    <td>
                      <FaCalendar className="me-1" />
                      {daysOfWeek[group.dayOfWeek]}
                    </td>
                    <td>
                      <FaClock className="me-1" />
                      {group.time}
                    </td>
                    <td>
                      <FaUsers className="me-1" />
                      {group.students?.length || 0}
                    </td>
                    <td>
                      <Badge bg={group.isActive ? 'success' : 'secondary'}>
                        {group.isActive ? 'Активна' : 'Неактивна'}
                      </Badge>
                    </td>
                    <td>
                      {user?.role === 'teacher' && group.teacher?._id === user._id && (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(group)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(group._id)}
                          >
                            Удалить
                          </Button>
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

      {/* Modal для создания/редактирования группы */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingGroup ? 'Редактировать группу' : 'Создать новую группу'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Название группы *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Например: Начинающие"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Зал *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                    required
                    placeholder="Например: Зал 1"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>День недели *</Form.Label>
                  <Form.Select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                    required
                  >
                    {Object.entries(daysOfWeek).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Время *</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Группа активна"
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
              {editingGroup ? 'Сохранить' : 'Создать'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Groups; 