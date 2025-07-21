import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaGraduationCap,
  FaUsers,
  FaUserGraduate,
  FaUserCheck,
  FaUserTimes
} from 'react-icons/fa';

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
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
    fetchGroups();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      if (error.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
      } else if (error.response?.status === 403) {
        setError('У вас нет прав для просмотра студентов');
      } else {
        setError('Ошибка при загрузке студентов');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (error.response?.status === 401) {
        setError('Ошибка авторизации при загрузке групп');
      }
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

  const handleCreate = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      phone: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent._id}`, formData);
      } else {
        await api.post('/api/students', formData);
      }
      await fetchStudents();
      setShowModal(false);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при сохранении студента');
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого студента?')) {
      return;
    }

    try {
      await api.delete(`/api/students/${studentId}`);
      await fetchStudents();
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при удалении студента');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="container py-8">
          <h1 className="page-title flex items-center gap-3">
            <FaGraduationCap />
            Студенты
          </h1>
          <p className="page-subtitle">
            Управление базой данных студентов
          </p>
        </div>
      </div>

      <div className="container">
        {error && (
          <div className="alert alert-error mb-6">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mb-6">
          <button 
            onClick={handleCreate}
            className="btn btn-primary"
          >
            <FaPlus className="mr-2" />
            Добавить студента
          </button>
        </div>

        {/* Students Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-white mb-0">
              Список студентов ({students.length})
            </h3>
          </div>
          <div className="table-container">
            <table className="table">
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
                    <td className="font-medium text-white">
                      {student.name}
                    </td>
                    <td>
                      {student.phone ? (
                        <div className="flex items-center gap-2">
                          <FaPhone size={12} />
                          {student.phone}
                        </div>
                      ) : (
                        <span className="text-white/40">Не указан</span>
                      )}
                    </td>
                    <td>
                      {student.groups?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.groups.map(group => (
                            <span key={group._id} className="badge badge-info">
                              {group.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/40">Нет групп</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${student.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {student.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                          title="Редактировать"
                        >
                          <FaEdit />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                            title="Удалить"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      <div className="text-white/60">
                        <FaUserGraduate className="mx-auto mb-3" size={48} />
                        <p>Студенты не найдены</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingStudent ? 'Редактировать студента' : 'Добавить студента'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Имя студента</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-white">Активный студент</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Сохранить' : 'Создать'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students; 