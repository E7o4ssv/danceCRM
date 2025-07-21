const axios = require('axios');
const fs = require('fs');

// Конфигурация
const SERVER_URL = 'http://89.104.71.170:5000'; // Ваш сервер
const CREDENTIALS = {
  username: 'admin', // Замените на ваш логин
  password: 'admin123' // Замените на ваш пароль
};

// Функция для получения токена
async function getAuthToken() {
  try {
    const response = await axios.post(`${SERVER_URL}/api/auth/login`, CREDENTIALS);
    return response.data.token;
  } catch (error) {
    console.error('Ошибка авторизации:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Функция для получения студентов
async function fetchStudents(token) {
  try {
    const response = await axios.get(`${SERVER_URL}/api/students`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении студентов:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Основная функция парсинга
async function quickParse() {
  try {
    console.log('=== БЫСТРЫЙ ПАРСИНГ СТУДЕНТОВ ===');
    console.log(`Сервер: ${SERVER_URL}`);
    
    console.log('\nАвторизация...');
    const token = await getAuthToken();
    console.log('✓ Авторизация успешна');
    
    console.log('\nПолучение данных студентов...');
    const students = await fetchStudents(token);
    console.log(`✓ Найдено студентов: ${students.length}`);
    
    // Создаем папку для данных
    const dataDir = 'parsed-data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    // Сохраняем в JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFile = `${dataDir}/students-${timestamp}.json`;
    const jsonData = {
      server: SERVER_URL,
      timestamp: new Date().toISOString(),
      total: students.length,
      students: students
    };
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
    console.log(`✓ JSON сохранен: ${jsonFile}`);
    
    // Сохраняем в CSV
    const csvFile = `${dataDir}/students-${timestamp}.csv`;
    const csvData = generateCSV(students);
    fs.writeFileSync(csvFile, csvData);
    console.log(`✓ CSV сохранен: ${csvFile}`);
    
    // Статистика
    printQuickStats(students);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Генерация CSV
function generateCSV(students) {
  const headers = ['ID', 'Имя', 'Телефон', 'Активен', 'Группы', 'Дата создания'];
  const rows = students.map(student => [
    student._id,
    student.name,
    student.phone || '',
    student.isActive ? 'Да' : 'Нет',
    student.groups ? student.groups.map(g => g.name).join('; ') : '',
    new Date(student.createdAt).toLocaleDateString('ru-RU')
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Быстрая статистика
function printQuickStats(students) {
  console.log('\n=== СТАТИСТИКА ===');
  console.log(`Всего студентов: ${students.length}`);
  console.log(`Активных: ${students.filter(s => s.isActive).length}`);
  console.log(`С телефоном: ${students.filter(s => s.phone).length}`);
  console.log(`В группах: ${students.filter(s => s.groups && s.groups.length > 0).length}`);
  
  // Топ групп
  const groupStats = {};
  students.forEach(student => {
    if (student.groups) {
      student.groups.forEach(group => {
        groupStats[group.name] = (groupStats[group.name] || 0) + 1;
      });
    }
  });
  
  console.log('\n=== ТОП ГРУПП ===');
  Object.entries(groupStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([name, count], index) => {
      console.log(`${index + 1}. ${name}: ${count} студентов`);
    });
}

// Запуск
quickParse(); 