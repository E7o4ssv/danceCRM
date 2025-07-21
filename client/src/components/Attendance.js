import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  FaCalendarCheck,
  FaPlus, 
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendar, 
  FaClock
} from 'react-icons/fa';

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
    fetchGroups();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/attendance');
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Ошибка при загрузке посещаемости');
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
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

        {/* Attendance Records */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-white mb-0">
              Записи посещаемости ({attendanceRecords.length})
            </h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Группа</th>
                  <th>Присутствовало</th>
                  <th>Отсутствовало</th>
                  <th>Преподаватель</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                    <tr key={record._id}>
                      <td>
                      <div className="flex items-center gap-2">
                        <FaClock size={14} className="text-white/60" />
                        {formatDate(record.date)}
                      </div>
                      </td>
                    <td className="text-primary-400">
                      {record.group?.name || 'Группа удалена'}
                      </td>
                      <td>
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-400" />
                        <span className="text-green-400">
                          {record.students?.filter(s => s.present).length || 0}
                        </span>
                      </div>
                      </td>
                      <td>
                      <div className="flex items-center gap-2">
                        <FaTimesCircle className="text-red-400" />
                        <span className="text-red-400">
                          {record.students?.filter(s => !s.present).length || 0}
                        </span>
                      </div>
                      </td>
                    <td className="text-white/80">
                      {record.submittedBy?.name || 'Неизвестно'}
                      </td>
                    </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      <div className="text-white/60">
                        <FaCalendarCheck className="mx-auto mb-3" size={48} />
                        <p>Записи посещаемости не найдены</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Cards */}
        {attendanceRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                  <FaCalendarCheck size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{attendanceRecords.length}</div>
                  <div className="text-white/60 text-sm">Всего записей</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                  <FaCheckCircle size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {attendanceRecords.reduce((total, record) => 
                      total + (record.students?.filter(s => s.present).length || 0), 0
                    )}
                  </div>
                  <div className="text-white/60 text-sm">Присутствий</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                  <FaTimesCircle size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {attendanceRecords.reduce((total, record) => 
                      total + (record.students?.filter(s => !s.present).length || 0), 0
                    )}
                  </div>
                  <div className="text-white/60 text-sm">Пропусков</div>
                </div>
              </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
};

export default Attendance; 