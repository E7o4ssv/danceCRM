import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaEnvelope,
  FaUsers,
  FaUserTie,
  FaGraduationCap,
  FaEye,
  FaCheck,
  FaTimes,
  FaChalkboardTeacher
} from 'react-icons/fa';

const Teachers = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Проверяем права доступа - только админы могут видеть этот компонент
  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('У вас нет прав для просмотра этой страницы');
      return;
    }
    fetchTeachers();
    fetchGroups();
  }, [user]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/users?role=teacher');
      setTeachers(response.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Ошибка при загрузке преподавателей');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups');
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const getTeacherGroups = (teacherId) => {
    return groups.filter(group => 
      group.teachers?.some(t => t._id === teacherId) || 
      group.teacher?._id === teacherId
    );
  };

  // Смена статуса преподавателя
  const handleToggleActive = async (teacher) => {
    try {
      await api.put(`/api/auth/users/${teacher._id}/status`, { isActive: !teacher.isActive });
      await fetchTeachers();
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при смене статуса преподавателя');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaUserTie className="mx-auto mb-4 text-white/40" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">Доступ запрещен</h3>
          <p className="text-white/60">У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    );
  }

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

      {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => {
          const teacherGroups = getTeacherGroups(teacher._id);
            
          return (
              <div key={teacher._id} className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {teacher.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {teacher.name}
                        </h3>
                        <p className="text-white/60 text-sm">@{teacher.username}</p>
                      </div>
                    </div>
                    <span className={`badge ${teacher.isActive ? 'badge-success' : 'badge-secondary'}`}>
                      {teacher.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  </div>

                <div className="card-body">
                  <div className="space-y-3">
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-white/80">
                        <FaPhone />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                    
                    {teacher.email && (
                      <div className="flex items-center gap-2 text-white/80">
                        <FaEnvelope />
                        <span>{teacher.email}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-white/80">
                      <FaUsers />
                      <span>{teacherGroups.length} групп</span>
                  </div>

                    {teacherGroups.length > 0 && (
                      <div className="mt-3">
                        <p className="text-white/80 text-sm mb-2">Группы:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacherGroups.map(group => (
                            <span key={group._id} className="badge badge-info text-xs">
                            {group.name}
                            </span>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>

                <div className="card-footer">
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                      title="Просмотр"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                      title="Редактировать"
                    >
                      <FaEdit />
                    </button>
                    {/* Toggle активен/неактивен */}
                    <button
                      className={`btn btn-sm ${teacher.isActive ? 'bg-gray-400 hover:bg-gray-500' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
                      title={teacher.isActive ? 'Сделать неактивным' : 'Сделать активным'}
                      onClick={() => handleToggleActive(teacher)}
                    >
                      {teacher.isActive ? <FaTimes /> : <FaCheck />}
                    </button>
                  </div>
                </div>
              </div>
          );
        })}

      {teachers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FaChalkboardTeacher className="mx-auto mb-4 text-white/40" size={64} />
              <p className="text-white/60 text-lg">Преподаватели не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teachers; 