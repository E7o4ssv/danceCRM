import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  FaPlus, 
  FaEdit, 
  FaUsers, 
  FaCalendar, 
  FaClock, 
  FaMapMarkerAlt,
  FaUserPlus,
  FaTrash,
  FaEye,
  FaComments
} from 'react-icons/fa';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    dayOfWeek: 'monday',
    time: '',
    teachers: [],
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
    fetchStudents();
    if (user?.role === 'admin') {
      fetchTeachers();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Ошибка при загрузке групп');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/api/auth/users?role=teacher');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      room: '',
      dayOfWeek: 'monday',
      time: '',
      teachers: [],
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      room: group.room,
      dayOfWeek: group.dayOfWeek,
      time: group.time,
      teachers: group.teachers?.map(t => t._id) || [],
      isActive: group.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await api.put(`/api/groups/${editingGroup._id}`, formData);
      } else {
        await api.post('/api/groups', formData);
      }
      await fetchGroups();
      setShowModal(false);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при сохранении группы');
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
            <FaUsers />
            Группы
          </h1>
          <p className="page-subtitle">
            Управление группами и расписанием
          </p>
        </div>
      </div>

      <div className="container">
        {error && (
          <div className="alert alert-error mb-6">
            {error}
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="mb-6">
            <button 
              onClick={handleCreate}
              className="btn btn-primary"
            >
              <FaPlus className="mr-2" />
              Создать группу
            </button>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group._id} className="card hover:scale-105 transition-transform duration-200">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {group.name}
                  </h3>
                  <span className={`badge ${group.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {group.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </div>
              
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <FaMapMarkerAlt />
                    <span>Зал {group.room}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <FaCalendar />
                    <span>{daysOfWeek[group.dayOfWeek]}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <FaClock />
                    <span>{group.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <FaUsers />
                    <span>{group.students?.length || 0} студентов</span>
                  </div>
                  
                  {group.teachers?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {group.teachers.map(teacher => (
                        <span key={teacher._id} className="badge badge-info text-xs">
                          {teacher.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card-footer">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedGroup(group)}
                    className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                    title="Просмотр"
                  >
                    <FaEye />
                  </button>
                  
                  {(user?.role === 'admin' || group.teachers?.some(t => t._id === user._id)) && (
                    <button
                      onClick={() => handleEdit(group)}
                      className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                      title="Редактировать"
                    >
                      <FaEdit />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {/* TODO: Open chat */}}
                    className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white"
                    title="Чат группы"
                  >
                    <FaComments />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {groups.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FaUsers className="mx-auto mb-4 text-white/40" size={64} />
              <p className="text-white/60 text-lg">Группы не найдены</p>
              {user?.role === 'admin' && (
                <button 
                  onClick={handleCreate}
                  className="btn btn-primary mt-4"
                >
                  Создать первую группу
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingGroup ? 'Редактировать группу' : 'Создать группу'}
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
                <label className="form-label">Название группы</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Зал</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Время</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">День недели</label>
                <select
                  className="form-control"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                >
                  {Object.entries(daysOfWeek).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-white">Активная группа</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary">
                  {editingGroup ? 'Сохранить' : 'Создать'}
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

export default Groups; 