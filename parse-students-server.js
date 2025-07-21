const axios = require('axios');
const fs = require('fs');

// Конфигурация сервера
const SERVER_CONFIG = {
  development: {
    baseURL: 'http://localhost:3001',
    description: 'Локальный сервер разработки'
  },
  production: {
    baseURL: 'http://89.104.71.170:5000',
    description: 'Продакшн сервер'
  }
};

// Выберите окружение
const ENVIRONMENT = 'production'; // или 'development'
const config = SERVER_CONFIG[ENVIRONMENT];

console.log(`Используется ${config.description}: ${config.baseURL}`);

// Функция для получения токена авторизации
async function getAuthToken(username, password) {
  try {
    const response = await axios.post(`${config.baseURL}/api/auth/login`, {
      username,
      password
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Ошибка авторизации:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Функция для получения всех студентов
async function fetchStudents(token) {
  try {
    const response = await axios.get(`${config.baseURL}/api/students`, {
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

// Функция для получения групп (для дополнительной информации)
async function fetchGroups(token) {
  try {
    const response = await axios.get(`${config.baseURL}/api/groups`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении групп:', error.response?.data?.message || error.message);
    return [];
  }
}

// Функция для парсинга и сохранения данных
async function parseStudentsFromServer() {
  try {
    // Запрос учетных данных
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };

    console.log('\n=== ПАРСИНГ ДАННЫХ СТУДЕНТОВ ===');
    console.log(`Сервер: ${config.baseURL}`);
    
    const username = await askQuestion('Введите логин: ');
    const password = await askQuestion('Введите пароль: ');
    
    rl.close();

    console.log('\nПолучение токена авторизации...');
    const token = await getAuthToken(username, password);
    console.log('Авторизация успешна!');

    console.log('\nПолучение данных студентов...');
    const students = await fetchStudents(token);
    console.log(`Найдено студентов: ${students.length}`);

    console.log('\nПолучение данных групп...');
    const groups = await fetchGroups(token);
    console.log(`Найдено групп: ${groups.length}`);

    // Создаем папку для данных если её нет
    const dataDir = 'parsed-data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Сохраняем данные студентов в JSON
    const studentsData = {
      server: config.baseURL,
      timestamp: new Date().toISOString(),
      total: students.length,
      students: students
    };
    
    const studentsFile = `${dataDir}/students-${Date.now()}.json`;
    fs.writeFileSync(studentsFile, JSON.stringify(studentsData, null, 2));
    console.log(`Данные студентов сохранены в: ${studentsFile}`);

    // Сохраняем данные групп в JSON
    const groupsData = {
      server: config.baseURL,
      timestamp: new Date().toISOString(),
      total: groups.length,
      groups: groups
    };
    
    const groupsFile = `${dataDir}/groups-${Date.now()}.json`;
    fs.writeFileSync(groupsFile, JSON.stringify(groupsData, null, 2));
    console.log(`Данные групп сохранены в: ${groupsFile}`);

    // Генерируем CSV файл
    const csvData = generateCSV(students, groups);
    const csvFile = `${dataDir}/students-${Date.now()}.csv`;
    fs.writeFileSync(csvFile, csvData);
    console.log(`CSV файл сохранен в: ${csvFile}`);

    // Выводим статистику
    printStatistics(students, groups);

  } catch (error) {
    console.error('Ошибка при парсинге:', error.message);
  }
}

// Генерация CSV файла
function generateCSV(students, groups) {
  const headers = [
    'ID студента', 
    'Имя', 
    'Телефон', 
    'Активен', 
    'Группы', 
    'Дата создания',
    'Количество групп'
  ];
  
  const rows = students.map(student => [
    student._id,
    student.name,
    student.phone || '',
    student.isActive ? 'Да' : 'Нет',
    student.groups ? student.groups.map(g => g.name).join('; ') : '',
    new Date(student.createdAt).toLocaleDateString('ru-RU'),
    student.groups ? student.groups.length : 0
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Вывод статистики
function printStatistics(students, groups) {
  console.log('\n=== СТАТИСТИКА ===');
  console.log(`Всего студентов: ${students.length}`);
  console.log(`Всего групп: ${groups.length}`);
  
  const activeStudents = students.filter(s => s.isActive);
  console.log(`Активных студентов: ${activeStudents.length}`);
  
  const studentsWithPhone = students.filter(s => s.phone);
  console.log(`Студентов с телефоном: ${studentsWithPhone.length}`);
  
  const studentsInGroups = students.filter(s => s.groups && s.groups.length > 0);
  console.log(`Студентов в группах: ${studentsInGroups.length}`);
  
  const studentsWithoutGroups = students.filter(s => !s.groups || s.groups.length === 0);
  console.log(`Студентов без групп: ${studentsWithoutGroups.length}`);
  
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
  
  console.log('\n=== СТУДЕНТЫ ПО ГРУППАМ ===');
  Object.entries(groupStats)
    .sort(([,a], [,b]) => b - a) // Сортировка по количеству студентов
    .forEach(([groupName, count]) => {
      console.log(`${groupName}: ${count} студентов`);
    });
  
  // Топ-5 студентов с наибольшим количеством групп
  const studentsByGroups = students
    .filter(s => s.groups && s.groups.length > 0)
    .sort((a, b) => (b.groups?.length || 0) - (a.groups?.length || 0))
    .slice(0, 5);
  
  console.log('\n=== ТОП-5 СТУДЕНТОВ ПО КОЛИЧЕСТВУ ГРУПП ===');
  studentsByGroups.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name} - ${student.groups.length} групп`);
  });
  
  // Примеры студентов
  console.log('\n=== ПРИМЕРЫ СТУДЕНТОВ ===');
  students.slice(0, 5).forEach((student, index) => {
    const groupsInfo = student.groups ? student.groups.map(g => g.name).join(', ') : 'нет групп';
    console.log(`${index + 1}. ${student.name} (${student.phone || 'нет телефона'}) - ${student.isActive ? 'активен' : 'неактивен'} - группы: ${groupsInfo}`);
  });
}

// Запуск парсинга
parseStudentsFromServer(); 