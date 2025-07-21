const axios = require('axios');
const fs = require('fs');

// Конфигурация для вашего сервера
const SERVER_URL = 'http://89.104.71.170:5000';
const CREDENTIALS = {
  username: 'admin', // Измените на ваш логин
  password: 'admin123' // Измените на ваш пароль
};

// Функция для проверки доступности сервера
async function checkServerHealth() {
  try {
    console.log('🔍 Проверка доступности сервера...');
    const response = await axios.get(`${SERVER_URL}/api/health`, {
      timeout: 5000
    });
    console.log('✅ Сервер доступен:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Сервер недоступен:', error.message);
    return false;
  }
}

// Функция для получения токена авторизации
async function getAuthToken() {
  try {
    console.log('🔐 Авторизация...');
    const response = await axios.post(`${SERVER_URL}/api/auth/login`, CREDENTIALS, {
      timeout: 10000
    });
    
    if (response.data.token) {
      console.log('✅ Авторизация успешна');
      return response.data.token;
    } else {
      throw new Error('Токен не получен');
    }
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Функция для получения всех студентов
async function fetchStudents(token) {
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
    console.error('❌ Ошибка при получении студентов:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Функция для получения групп
async function fetchGroups(token) {
  try {
    console.log('👥 Получение списка групп...');
    const response = await axios.get(`${SERVER_URL}/api/groups`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`✅ Получено групп: ${response.data.length}`);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при получении групп:', error.response?.data?.message || error.message);
    return [];
  }
}

// Основная функция парсинга
async function parseStudentsFromServer() {
  try {
    console.log('🚀 === ПАРСИНГ ДАННЫХ СТУДЕНТОВ ===');
    console.log(`🌐 Сервер: ${SERVER_URL}`);
    console.log(`👤 Логин: ${CREDENTIALS.username}`);
    console.log('');

    // Проверяем доступность сервера
    const isServerAvailable = await checkServerHealth();
    if (!isServerAvailable) {
      console.log('❌ Невозможно подключиться к серверу. Проверьте:');
      console.log('   - Доступность сервера');
      console.log('   - Правильность URL');
      console.log('   - Сетевые настройки');
      return;
    }

    // Получаем токен авторизации
    const token = await getAuthToken();

    // Получаем данные студентов
    const students = await fetchStudents(token);

    // Получаем данные групп
    const groups = await fetchGroups(token);

    // Создаем папку для данных
    const dataDir = 'parsed-data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
      console.log('📁 Создана папка parsed-data');
    }

    // Генерируем timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Сохраняем данные студентов в JSON
    const studentsData = {
      server: SERVER_URL,
      timestamp: new Date().toISOString(),
      total: students.length,
      students: students
    };
    
    const studentsFile = `${dataDir}/students-${timestamp}.json`;
    fs.writeFileSync(studentsFile, JSON.stringify(studentsData, null, 2));
    console.log(`💾 JSON файл сохранен: ${studentsFile}`);

    // Сохраняем данные групп в JSON
    if (groups.length > 0) {
      const groupsData = {
        server: SERVER_URL,
        timestamp: new Date().toISOString(),
        total: groups.length,
        groups: groups
      };
      
      const groupsFile = `${dataDir}/groups-${timestamp}.json`;
      fs.writeFileSync(groupsFile, JSON.stringify(groupsData, null, 2));
      console.log(`💾 Группы сохранены: ${groupsFile}`);
    }

    // Генерируем CSV файл
    const csvData = generateCSV(students);
    const csvFile = `${dataDir}/students-${timestamp}.csv`;
    fs.writeFileSync(csvFile, csvData);
    console.log(`📊 CSV файл сохранен: ${csvFile}`);

    // Выводим статистику
    printStatistics(students, groups);

    console.log('\n🎉 Парсинг завершен успешно!');
    console.log(`📂 Все файлы сохранены в папке: ${dataDir}`);

  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    console.log('\n🔧 Возможные решения:');
    console.log('   - Проверьте правильность логина и пароля');
    console.log('   - Убедитесь, что сервер работает');
    console.log('   - Проверьте сетевое подключение');
  }
}

// Генерация CSV файла
function generateCSV(students) {
  const headers = [
    'ID студента', 
    'Имя', 
    'Телефон', 
    'Активен', 
    'Группы', 
    'Количество групп',
    'Дата создания'
  ];
  
  const rows = students.map(student => [
    student._id,
    student.name,
    student.phone || '',
    student.isActive ? 'Да' : 'Нет',
    student.groups ? student.groups.map(g => g.name).join('; ') : '',
    student.groups ? student.groups.length : 0,
    new Date(student.createdAt).toLocaleDateString('ru-RU')
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Вывод статистики
function printStatistics(students, groups) {
  console.log('\n📈 === СТАТИСТИКА ===');
  console.log(`👥 Всего студентов: ${students.length}`);
  console.log(`👥 Всего групп: ${groups.length}`);
  
  const activeStudents = students.filter(s => s.isActive);
  console.log(`✅ Активных студентов: ${activeStudents.length}`);
  
  const studentsWithPhone = students.filter(s => s.phone);
  console.log(`📱 Студентов с телефоном: ${studentsWithPhone.length}`);
  
  const studentsInGroups = students.filter(s => s.groups && s.groups.length > 0);
  console.log(`👥 Студентов в группах: ${studentsInGroups.length}`);
  
  const studentsWithoutGroups = students.filter(s => !s.groups || s.groups.length === 0);
  console.log(`🚫 Студентов без групп: ${studentsWithoutGroups.length}`);
  
  // Группировка по группам
  const groupStats = {};
  students.forEach(student => {
    if (student.groups) {
      student.groups.forEach(group => {
        if (!groupStats[group.name]) {
          groupStats[group.name] = 0;
        }
        groupStats[group.name]++;
      });
    }
  });
  
  console.log('\n🏆 === ТОП ГРУПП ===');
  Object.entries(groupStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([groupName, count], index) => {
      console.log(`${index + 1}. ${groupName}: ${count} студентов`);
    });
  
  // Примеры студентов
  console.log('\n👤 === ПРИМЕРЫ СТУДЕНТОВ ===');
  students.slice(0, 5).forEach((student, index) => {
    const groupsInfo = student.groups ? student.groups.map(g => g.name).join(', ') : 'нет групп';
    const phoneInfo = student.phone || 'нет телефона';
    const status = student.isActive ? 'активен' : 'неактивен';
    console.log(`${index + 1}. ${student.name} (${phoneInfo}) - ${status} - группы: ${groupsInfo}`);
  });
}

// Запуск парсинга
parseStudentsFromServer(); 