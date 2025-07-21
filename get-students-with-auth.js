const axios = require('axios');

// Конфигурация
const SERVER_URL = 'http://89.104.71.170:5000';
const CREDENTIALS = {
  username: 'admin', // Замените на ваш логин
  password: 'admin123' // Замените на ваш пароль
};

// Функция для получения токена авторизации
async function getAuthToken() {
  try {
    console.log('🔐 Получение токена авторизации...');
    
    const response = await axios.post(`${SERVER_URL}/api/auth/login`, CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.token) {
      console.log('✅ Токен получен успешно');
      return response.data.token;
    } else {
      throw new Error('Токен не найден в ответе');
    }
  } catch (error) {
    console.error('❌ Ошибка при получении токена:');
    if (error.response) {
      console.error('   Статус:', error.response.status);
      console.error('   Данные:', error.response.data);
    } else {
      console.error('   Ошибка:', error.message);
    }
    throw error;
  }
}

// Функция для получения студентов с токеном
async function getStudents(token) {
  try {
    console.log('📋 Получение списка студентов...');
    
    const response = await axios.get(`${SERVER_URL}/api/students`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`✅ Получено студентов: ${response.data.length}`);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при получении студентов:');
    if (error.response) {
      console.error('   Статус:', error.response.status);
      console.error('   Данные:', error.response.data);
    } else {
      console.error('   Ошибка:', error.message);
    }
    throw error;
  }
}

// Функция для тестирования разных эндпоинтов
async function testEndpoints(token) {
  const endpoints = [
    '/api/health',
    '/api/auth/profile',
    '/api/students',
    '/api/groups'
  ];
  
  console.log('\n🧪 Тестирование эндпоинтов:');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${SERVER_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`✅ ${endpoint}: ${response.status} - OK`);
      if (endpoint === '/api/students') {
        console.log(`   Студентов: ${response.data.length}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
    }
  }
}

// Основная функция
async function main() {
  try {
    console.log('🚀 === ПОЛУЧЕНИЕ ДАННЫХ СТУДЕНТОВ ===');
    console.log(`🌐 Сервер: ${SERVER_URL}`);
    console.log(`👤 Логин: ${CREDENTIALS.username}`);
    console.log('');
    
    // Получаем токен
    const token = await getAuthToken();
    console.log(`🔑 Токен: ${token.substring(0, 20)}...`);
    
    // Тестируем эндпоинты
    await testEndpoints(token);
    
    // Получаем студентов
    const students = await getStudents(token);
    
    // Выводим данные студентов
    console.log('\n👥 === СПИСОК СТУДЕНТОВ ===');
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   ID: ${student._id}`);
      console.log(`   Телефон: ${student.phone || 'не указан'}`);
      console.log(`   Активен: ${student.isActive ? 'Да' : 'Нет'}`);
      console.log(`   Группы: ${student.groups ? student.groups.map(g => g.name).join(', ') : 'нет групп'}`);
      console.log(`   Создан: ${new Date(student.createdAt).toLocaleDateString('ru-RU')}`);
      console.log('');
    });
    
    console.log('✅ Операция завершена успешно!');
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    console.log('\n🔧 Возможные решения:');
    console.log('   - Проверьте правильность логина и пароля');
    console.log('   - Убедитесь, что сервер работает');
    console.log('   - Проверьте сетевое подключение');
  }
}

// Запуск
main(); 