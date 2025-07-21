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
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatGroup, setSelectedChatGroup] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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

  // Добавить/удалить ученика из группы
  const handleStudentToggle = async (studentId, checked) => {
    if (!editingGroup) return;
    try {
      if (checked) {
        // Добавить ученика
        await api.post(`/api/groups/${editingGroup._id}/students`, { studentId });
      } else {
        // Удалить ученика
        await api.delete(`/api/groups/${editingGroup._id}/students/${studentId}`);
      }
      await fetchGroups();
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при изменении учеников группы');
    }
  };

  // Открыть чат группы
  const handleOpenChat = async (group) => {
    setSelectedChatGroup(group);
    setShowChatModal(true);
    await fetchChatMessages(group._id);
  };

  // Получить сообщения чата
  const fetchChatMessages = async (groupId) => {
    try {
      const response = await api.get(`/api/chat/group/${groupId}`);
      setChatMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  // Отправить сообщение
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatGroup) return;
    
    try {
      await api.post(`/api/chat/group/${selectedChatGroup._id}/messages`, {
        content: newMessage
      });
      setNewMessage('');
      await fetchChatMessages(selectedChatGroup._id);
    } catch (error) {
      console.error('Error sending message:', error);
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
      <div className="container pt-8">
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
                    onClick={() => handleOpenChat(group)}
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

              {/* Новый блок: управление учениками */}
              {editingGroup && (
                <div className="form-group">
                  <label className="form-label">Ученики в группе</label>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white/5">
                    {students.length > 0 ? (
                      students.map(student => (
                        <label key={student._id} className="flex items-center gap-2 mb-1 cursor-pointer hover:bg-white/10 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={editingGroup.students?.some(s => s._id === student._id)}
                            onChange={e => handleStudentToggle(student._id, e.target.checked)}
                          />
                          <span className="text-white/90">{student.name}</span>
                          {student.phone && (
                            <span className="text-white/60 text-xs">({student.phone})</span>
                          )}
                        </label>
                      ))
                    ) : (
                      <p className="text-white/60 text-sm">Нет доступных учеников</p>
                    )}
                  </div>
                  <p className="text-white/60 text-xs mt-1">
                    Выберите учеников для добавления в группу
                  </p>
                </div>
              )}

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

      {/* Chat Modal */}
      {showChatModal && selectedChatGroup && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Чат группы: {selectedChatGroup.name}
              </h3>
              <button 
                onClick={() => setShowChatModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col h-96">
              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 bg-white/5 rounded mb-4">
                {chatMessages.length > 0 ? (
                  chatMessages.map((message, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/80 text-sm font-medium">
                          {message.sender?.name || 'Неизвестный'}
                        </span>
                        <span className="text-white/40 text-xs">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white/10 p-2 rounded">
                        <p className="text-white">{message.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/60 text-center">Нет сообщений</p>
                )}
              </div>
              
              {/* Форма отправки */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Введите сообщение..."
                  className="form-control flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  className="btn btn-primary"
                  disabled={!newMessage.trim()}
                >
                  Отправить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups; 