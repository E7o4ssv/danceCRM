import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  FaUser, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaClock, 
  FaMapMarkerAlt,
  FaUserPlus,
  FaCalendarAlt,
  FaRubleSign,
  FaStickyNote
} from 'react-icons/fa';

const IndividualLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    students: [],
    schedule: [{ dayOfWeek: 'monday', time: '' }],
    room: '',
    duration: 60,
    price: '',
    notes: ''
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
    fetchLessons();
    fetchStudents();
    if (user?.role === 'admin') {
      fetchTeachers();
    }
  }, [user]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/individual-lessons');
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setError('Ошибка при загрузке индивидуальных занятий');
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
    setEditingLesson(null);
    setFormData({
      name: '',
      teacher: user?.role === 'teacher' ? user._id : '',
      students: [],
      schedule: [{ dayOfWeek: 'monday', time: '' }],
      room: '',
      duration: 60,
      price: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      name: lesson.name,
      teacher: lesson.teacher?._id || '',
      students: lesson.students?.map(s => s._id) || [],
      schedule: lesson.schedule || [{ dayOfWeek: 'monday', time: '' }],
      room: lesson.room,
      duration: lesson.duration,
      price: lesson.price || '',
      notes: lesson.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await api.put(`/api/individual-lessons/${editingLesson._id}`, formData);
      } else {
        await api.post('/api/individual-lessons', formData);
      }
      await fetchLessons();
      setShowModal(false);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при сохранении занятия');
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

        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <div className="mb-6">
            <button 
              onClick={handleCreate}
              className="btn btn-primary"
            >
              <FaPlus className="mr-2" />
              Создать индивидуальное занятие
            </button>
          </div>
      )}

      {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => (
            <div key={lesson._id} className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {lesson.name}
                  </h3>
                  <span className={`badge ${lesson.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {lesson.isActive ? 'Активно' : 'Неактивно'}
                  </span>
                </div>
              </div>

              <div className="card-body">
                <div className="space-y-3">
                  {lesson.teacher && (
                    <div className="flex items-center gap-2 text-white/80">
                      <FaUser />
                      <span>{lesson.teacher.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <FaMapMarkerAlt />
                    <span>Зал {lesson.room}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <FaClock />
                    <span>{lesson.duration} минут</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <FaUserPlus />
                    <span>{lesson.students?.length || 0} студентов</span>
                </div>

                  {lesson.price && (
                    <div className="flex items-center gap-2 text-white/80">
                      <FaRubleSign />
                      <span>{lesson.price} ₽</span>
                    </div>
                  )}
                  
                  {lesson.schedule?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-white/80 text-sm mb-2">Расписание:</p>
                      <div className="space-y-1">
                  {lesson.schedule.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FaCalendarAlt className="text-white/60" />
                            <span className="text-white/80">
                      {daysOfWeek[item.dayOfWeek]} в {item.time}
                            </span>
                    </div>
                  ))}
                </div>
                    </div>
                  )}
                  
                  {lesson.students?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-white/80 text-sm mb-2">Студенты:</p>
                      <div className="flex flex-wrap gap-1">
                        {lesson.students.map(student => (
                          <span key={student._id} className="badge badge-info text-xs">
                            {student.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                  </div>
              
              <div className="card-footer">
                <div className="flex gap-2">
                  {(user?.role === 'admin' || lesson.teacher?._id === user._id) && (
                    <>
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                        title="Редактировать"
                      >
                        <FaEdit />
                      </button>
                      
                      {user?.role === 'admin' && (
                        <button
                          className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                          title="Удалить"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
        ))}
        
        {lessons.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FaUser className="mx-auto mb-4 text-white/40" size={64} />
              <p className="text-white/60 text-lg">Индивидуальные занятия не найдены</p>
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <button 
                  onClick={handleCreate}
                  className="btn btn-primary mt-4"
                >
                  Создать первое занятие
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingLesson ? 'Редактировать занятие' : 'Создать индивидуальное занятие'}
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
                <label className="form-label">Название занятия</label>
                <input
                    type="text"
                  className="form-control"
                    value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {user?.role === 'admin' && (
                <div className="form-group">
                  <label className="form-label">Преподаватель</label>
                  <select
                    className="form-control"
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    required
                  >
                    <option value="">Выберите преподавателя</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  <label className="form-label">Продолжительность (мин)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min="30"
                    max="180"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Стоимость (₽)</label>
                <input
                    type="number"
                  className="form-control"
                    value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Заметки</label>
                <textarea
                  className="form-control"
                  rows="3"
                value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация о занятии"
              />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary">
                  {editingLesson ? 'Сохранить' : 'Создать'}
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

export default IndividualLessons; 