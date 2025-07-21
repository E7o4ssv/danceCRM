import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  FaUsers, 
  FaGraduationCap, 
  FaCalendarCheck,
  FaChartLine,
  FaCalendarDay,
  FaClock
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalStudents: 0,
    recentAttendance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [groupsResponse, studentsResponse, attendanceResponse] = await Promise.all([
        api.get('/api/groups'),
        api.get('/api/students'),
        api.get('/api/attendance?limit=5')
      ]);

      setStats({
        totalGroups: groupsResponse.data?.length || 0,
        totalStudents: studentsResponse.data?.length || 0,
        recentAttendance: attendanceResponse.data || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-card">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white/70">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="container pt-8">
        {error && (
          <div className="alert alert-error mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                <FaUsers className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalGroups}</div>
                <div className="text-white/60 text-sm">Активных групп</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                <FaGraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
                <div className="text-white/60 text-sm">Студентов</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <FaCalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.recentAttendance.length}</div>
                <div className="text-white/60 text-sm">Последние отчеты</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
                <FaChartLine className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.recentAttendance.reduce((total, record) => 
                    total + (record.students?.filter(s => s.present).length || 0), 0
                  )}
                </div>
                <div className="text-white/60 text-sm">Присутствий</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-white mb-0 flex items-center gap-2">
                <FaCalendarDay className="w-5 h-5" />
                Быстрые действия
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <button 
                  className="interactive-card w-full p-4 text-left"
                  onClick={() => navigate('/groups')}
                >
                  <div className="flex items-center gap-3">
                    <FaUsers className="w-5 h-5 text-primary-400" />
                    <div>
                      <div className="font-medium text-white">Создать группу</div>
                      <div className="text-sm text-white/60">Добавить новую танцевальную группу</div>
                    </div>
                  </div>
                </button>

                <button 
                  className="interactive-card w-full p-4 text-left"
                  onClick={() => navigate('/students')}
                >
                  <div className="flex items-center gap-3">
                    <FaGraduationCap className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="font-medium text-white">Добавить студента</div>
                      <div className="text-sm text-white/60">Зарегистрировать нового ученика</div>
                    </div>
                  </div>
                </button>

                <button 
                  className="interactive-card w-full p-4 text-left"
                  onClick={() => navigate('/attendance')}
                >
                  <div className="flex items-center gap-3">
                    <FaCalendarCheck className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-medium text-white">Отметить посещаемость</div>
                      <div className="text-sm text-white/60">Создать отчет о посещаемости</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-white mb-0 flex items-center gap-2">
                <FaClock className="w-5 h-5" />
                Последние отчеты
              </h3>
            </div>
            <div className="card-body">
              {stats.recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentAttendance.map((record) => (
                    <div key={record._id} className="glass-card-dark p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-sm">
                            {record.group?.name || 'Неизвестная группа'}
                          </div>
                          <div className="text-xs text-white/60">
                          {formatDate(record.date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-success text-xs">
                            {record.students?.filter(s => s.present).length || 0} ✓
                          </span>
                          <span className="badge badge-danger text-xs">
                            {record.students?.filter(s => !s.present).length || 0} ✗
                          </span>
              </div>
            </div>
          </div>
                  ))}
              </div>
              ) : (
                <div className="text-center py-8">
                  <FaCalendarCheck className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60">Нет записей о посещаемости</p>
              </div>
              )}
              </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 hero-content">
          <h2 className="text-2xl font-bold text-white mb-4">
            Добро пожаловать, {user?.name}!
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            {user?.role === 'admin' 
              ? 'Вы можете управлять всеми аспектами танцевальной школы: группами, студентами, преподавателями и расписанием.'
              : 'Здесь вы можете управлять своими группами, отмечать посещаемость и общаться со студентами.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 