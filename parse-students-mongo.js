const mongoose = require('mongoose');
const fs = require('fs');

// Подключение к MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/dance'; // Измените на ваш URI

// Схема студента (такая же как в проекте)
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Student = mongoose.model('Student', studentSchema);

// Схема группы для популяции
const groupSchema = new mongoose.Schema({
  name: String,
  room: String,
  dayOfWeek: String,
  time: String
});

const Group = mongoose.model('Group', groupSchema);

// Функция для парсинга студентов
async function parseStudentsFromDB() {
  try {
    console.log('Подключение к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Подключение успешно!');
    
    console.log('Получение студентов из базы данных...');
    const students = await Student.find({})
      .populate('groups', 'name room dayOfWeek time')
      .lean(); // Для лучшей производительности
    
    console.log(`Найдено студентов: ${students.length}`);
    
    // Сохраняем в JSON файл
    const jsonData = {
      total: students.length,
      timestamp: new Date().toISOString(),
      students: students
    };
    
    fs.writeFileSync('students-db-data.json', JSON.stringify(jsonData, null, 2));
    console.log('Данные сохранены в students-db-data.json');
    
    // Экспорт в CSV
    const csvData = generateCSV(students);
    fs.writeFileSync('students-data.csv', csvData);
    console.log('Данные сохранены в students-data.csv');
    
    // Статистика
    printStatistics(students);
    
  } catch (error) {
    console.error('Ошибка при парсинге:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Отключение от MongoDB');
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
    student.groups ? student.groups.map(g => g.name).join(', ') : '',
    new Date(student.createdAt).toLocaleDateString('ru-RU')
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Вывод статистики
function printStatistics(students) {
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
  
  // Студенты без групп
  const studentsWithoutGroups = students.filter(s => !s.groups || s.groups.length === 0);
  console.log(`\nСтудентов без групп: ${studentsWithoutGroups.length}`);
  
  // Примеры студентов
  console.log('\n=== ПРИМЕРЫ СТУДЕНТОВ ===');
  students.slice(0, 5).forEach((student, index) => {
    console.log(`${index + 1}. ${student.name} (${student.phone || 'нет телефона'}) - ${student.isActive ? 'активен' : 'неактивен'}`);
  });
}

// Запуск парсинга
parseStudentsFromDB(); 