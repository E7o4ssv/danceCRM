import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaPlus, FaCalendar, FaUsers, FaCheck, FaTimes, FaEye } from 'react-icons/fa';

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchAttendance();
    fetchGroups();
  }, [filterGroup, filterDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = '/api/attendance';
      const params = new URLSearchParams();
      
      if (filterGroup) params.append('group', filterGroup);
      if (filterDate) params.append('date', filterDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Ошибка при загрузке отчетов о посещаемости');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleCreateAttendance = async () => {
    if (!selectedGroup) {
      setError('Выберите группу');
      return;
    }

    try {
      const group = groups.find(g => g._id === selectedGroup);
      if (!group || !group.students || group.students.length === 0) {
        setError('В выбранной группе нет студентов');
        return;
      }

      const students = group.students.map(student => ({
        student: student._id,
        present: false
      }));

      setAttendanceData(students);
      setShowModal(true);
    } catch (error) {
      console.error('Error preparing attendance:', error);
      setError('Ошибка при подготовке отчета');
    }
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    try {
      const attendancePayload = {
        group: selectedGroup,
        date: selectedDate.toISOString().split('T')[0],
        students: attendanceData
      };

      await axios.post('/api/attendance', attendancePayload);
      
      setShowModal(false);
      setSelectedGroup(null);
      setSelectedDate(new Date());
      setAttendanceData([]);
      fetchAttendance();
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setError('Ошибка при отправке отчета о посещаемости');
    }
  };

  const toggleStudentAttendance = (studentId) => {
    setAttendanceData(prev => 
      prev.map(student => 
        student.student === studentId 
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    return group ? group.name : 'Неизвестная группа';
  };

  const getStudentName = (studentId) => {
    const group = groups.find(g => g.students?.some(s => s._id === studentId));
    if (group) {
      const student = group.students.find(s => s._id === studentId);
      return student ? student.name : 'Неизвестный студент';
    }
    return 'Неизвестный студент';
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
        <h2>Посещаемость</h2>
        {user?.role === 'teacher' && (
          <Button variant="primary" onClick={handleCreateAttendance}>
            <FaPlus className="me-2" />
            Создать отчет
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Фильтры */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Фильтр по группе</Form.Label>
                <Form.Select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                >
                  <option value="">Все группы</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Фильтр по дате</Form.Label>
                <DatePicker
                  selected={filterDate ? new Date(filterDate) : null}
                  onChange={(date) => setFilterDate(date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Выберите дату"
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setFilterGroup('');
                  setFilterDate('');
                }}
              >
                Сбросить фильтры
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Дата</th>
                  <th>Студентов</th>
                  <th>Присутствовало</th>
                  <th>Отправил</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <strong>{record.group?.name}</strong>
                      <br />
                      <small className="text-muted">
                        {record.group?.room} • {record.group?.dayOfWeek} • {record.group?.time}
                      </small>
                    </td>
                    <td>
                      <FaCalendar className="me-1" />
                      {new Date(record.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <FaUsers className="me-1" />
                      {record.students.length}
                    </td>
                    <td>
                      <span className="attendance-present">
                        {record.students.filter(s => s.present).length}
                      </span>
                      {' / '}
                      <span className="attendance-absent">
                        {record.students.length}
                      </span>
                    </td>
                    <td>{record.submittedBy?.name}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          // Здесь можно добавить просмотр деталей
                          alert('Детали посещаемости:\n' + 
                            record.students.map(s => 
                              `${s.student?.name || 'Неизвестный'}: ${s.present ? 'Присутствовал' : 'Отсутствовал'}`
                            ).join('\n')
                          );
                        }}
                      >
                        <FaEye />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal для создания отчета о посещаемости */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Создать отчет о посещаемости</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitAttendance}>
          <Modal.Body>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Группа *</Form.Label>
                  <Form.Select
                    value={selectedGroup || ''}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    required
                  >
                    <option value="">Выберите группу</option>
                    {groups
                      .filter(group => group.teacher?._id === user._id)
                      .map(group => (
                        <option key={group._id} value={group._id}>
                          {group.name} ({group.students?.length || 0} студентов)
                        </option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Дата *</Form.Label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {attendanceData.length > 0 && (
              <div>
                <h6>Отметить посещаемость:</h6>
                <div className="table-responsive">
                  <Table>
                    <thead>
                      <tr>
                        <th>Студент</th>
                        <th>Присутствие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((student, index) => (
                        <tr key={student.student}>
                          <td>{getStudentName(student.student)}</td>
                          <td>
                            <Button
                              variant={student.present ? 'success' : 'outline-success'}
                              size="sm"
                              onClick={() => toggleStudentAttendance(student.student)}
                              className="me-2"
                            >
                              <FaCheck />
                            </Button>
                            <Button
                              variant={!student.present ? 'danger' : 'outline-danger'}
                              size="sm"
                              onClick={() => toggleStudentAttendance(student.student)}
                            >
                              <FaTimes />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" disabled={!selectedGroup || attendanceData.length === 0}>
              Отправить отчет
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Attendance; 