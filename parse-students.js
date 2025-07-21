const axios = require('axios');
const fs = require('fs');

// Конфигурация
const API_BASE_URL = 'http://localhost:3001'; // Измените на ваш сервер
const TOKEN = ''; // Добавьте ваш токен авторизации

// Функция для получения всех студентов
async function fetchStudents() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/students`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении студентов:', error.response?.data || error.message);
    throw error;
  }
}

// Функция для парсинга и сохранения данных
async function parseStudents() {
  try {
    console.log('Получение списка студентов...');
    const students = await fetchStudents();
    
    console.log(`Найдено студентов: ${students.length}`);
    
    // Сохраняем в JSON файл
    const jsonData = {
      total: students.length,
      timestamp: new Date().toISOString(),
      students: students
    };
    
    fs.writeFileSync('students-data.json', JSON.stringify(jsonData, null, 2));
    console.log('Данные сохранены в students-data.json');
    
    // Выводим статистику
    console.log('\n=== СТАТИСТИКА ===');
    console.log(`Всего студентов: ${students.length}`);
    
    const activeStudents = students.filter(s => s.isActive);
    console.log(`Активных студентов: ${activeStudents.length}`);
    
    const studentsWithPhone = students.filter(s => s.phone);
    console.log(`Студентов с телефоном: ${studentsWithPhone.length}`);
    
    const studentsInGroups = students.filter(s => s.groups && s.groups.length > 0);
    console.log(`Студентов в группах: ${studentsInGroups.length}`);
    
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
    Object.entries(groupStats).forEach(([groupName, count]) => {
      console.log(`${groupName}: ${count} студентов`);
    });
    
    // Выводим первые 5 студентов как пример
    console.log('\n=== ПРИМЕРЫ СТУДЕНТОВ ===');
    students.slice(0, 5).forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.phone || 'нет телефона'}) - ${student.isActive ? 'активен' : 'неактивен'}`);
    });
    
  } catch (error) {
    console.error('Ошибка при парсинге:', error.message);
  }
}

// Запуск парсинга
parseStudents(); 