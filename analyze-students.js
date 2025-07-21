const fs = require('fs');
const path = require('path');

// Функция для анализа данных студентов
function analyzeStudentsData() {
  try {
    console.log('🔍 === АНАЛИЗ ДАННЫХ СТУДЕНТОВ ===');
    
    // Находим последний файл с данными студентов
    const dataDir = 'parsed-data';
    if (!fs.existsSync(dataDir)) {
      console.log('❌ Папка parsed-data не найдена. Сначала запустите парсинг.');
      return;
    }
    
    const files = fs.readdirSync(dataDir)
      .filter(file => file.startsWith('students-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.log('❌ Файлы с данными студентов не найдены.');
      return;
    }
    
    const latestFile = files[0];
    console.log(`📁 Анализируем файл: ${latestFile}`);
    
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, latestFile), 'utf8'));
    const students = data.students;
    
    console.log(`\n📊 ОБЩАЯ СТАТИСТИКА`);
    console.log(`Сервер: ${data.server}`);
    console.log(`Дата парсинга: ${new Date(data.timestamp).toLocaleString('ru-RU')}`);
    console.log(`Всего студентов: ${students.length}`);
    
    // Детальная статистика
    const stats = {
      total: students.length,
      active: students.filter(s => s.isActive).length,
      inactive: students.filter(s => !s.isActive).length,
      withPhone: students.filter(s => s.phone).length,
      withoutPhone: students.filter(s => !s.phone).length,
      inGroups: students.filter(s => s.groups && s.groups.length > 0).length,
      withoutGroups: students.filter(s => !s.groups || s.groups.length === 0).length,
      createdThisWeek: students.filter(s => {
        const created = new Date(s.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
      }).length,
      createdThisMonth: students.filter(s => {
        const created = new Date(s.createdAt);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return created >= monthAgo;
      }).length
    };
    
    console.log(`\n👥 СТАТУС СТУДЕНТОВ`);
    console.log(`✅ Активных: ${stats.active} (${((stats.active/stats.total)*100).toFixed(1)}%)`);
    console.log(`❌ Неактивных: ${stats.inactive} (${((stats.inactive/stats.total)*100).toFixed(1)}%)`);
    
    console.log(`\n📱 КОНТАКТНАЯ ИНФОРМАЦИЯ`);
    console.log(`📞 С телефоном: ${stats.withPhone} (${((stats.withPhone/stats.total)*100).toFixed(1)}%)`);
    console.log(`🚫 Без телефона: ${stats.withoutPhone} (${((stats.withoutPhone/stats.total)*100).toFixed(1)}%)`);
    
    console.log(`\n👥 ГРУППЫ`);
    console.log(`👥 В группах: ${stats.inGroups} (${((stats.inGroups/stats.total)*100).toFixed(1)}%)`);
    console.log(`🚫 Без групп: ${stats.withoutGroups} (${((stats.withoutGroups/stats.total)*100).toFixed(1)}%)`);
    
    console.log(`\n📅 ДАТЫ СОЗДАНИЯ`);
    console.log(`📅 За неделю: ${stats.createdThisWeek} студентов`);
    console.log(`📅 За месяц: ${stats.createdThisMonth} студентов`);
    
    // Анализ групп
    const groupAnalysis = {};
    students.forEach(student => {
      if (student.groups) {
        student.groups.forEach(group => {
          if (!groupAnalysis[group.name]) {
            groupAnalysis[group.name] = {
              count: 0,
              students: [],
              room: group.room,
              dayOfWeek: group.dayOfWeek,
              time: group.time
            };
          }
          groupAnalysis[group.name].count++;
          groupAnalysis[group.name].students.push(student.name);
        });
      }
    });
    
    console.log(`\n🏆 АНАЛИЗ ГРУПП`);
    if (Object.keys(groupAnalysis).length > 0) {
      Object.entries(groupAnalysis)
        .sort(([,a], [,b]) => b.count - a.count)
        .forEach(([groupName, info], index) => {
          console.log(`${index + 1}. ${groupName}`);
          console.log(`   👥 Студентов: ${info.count}`);
          console.log(`   🏠 Помещение: ${info.room}`);
          console.log(`   📅 День: ${info.dayOfWeek}`);
          console.log(`   ⏰ Время: ${info.time}`);
          console.log(`   👤 Студенты: ${info.students.join(', ')}`);
          console.log('');
        });
    } else {
      console.log('❌ Нет данных о группах');
    }
    
    // Анализ телефонов
    const phoneAnalysis = {};
    students.forEach(student => {
      if (student.phone) {
        const prefix = student.phone.substring(0, 4);
        if (!phoneAnalysis[prefix]) {
          phoneAnalysis[prefix] = 0;
        }
        phoneAnalysis[prefix]++;
      }
    });
    
    console.log(`\n📱 АНАЛИЗ ТЕЛЕФОНОВ`);
    if (Object.keys(phoneAnalysis).length > 0) {
      Object.entries(phoneAnalysis)
        .sort(([,a], [,b]) => b - a)
        .forEach(([prefix, count]) => {
          console.log(`📞 ${prefix}***: ${count} студентов`);
        });
    } else {
      console.log('❌ Нет данных о телефонах');
    }
    
    // Студенты без групп
    const studentsWithoutGroups = students.filter(s => !s.groups || s.groups.length === 0);
    if (studentsWithoutGroups.length > 0) {
      console.log(`\n🚫 СТУДЕНТЫ БЕЗ ГРУПП (${studentsWithoutGroups.length})`);
      studentsWithoutGroups.forEach((student, index) => {
        const phoneInfo = student.phone || 'нет телефона';
        const createdDate = new Date(student.createdAt).toLocaleDateString('ru-RU');
        console.log(`${index + 1}. ${student.name} (${phoneInfo}) - создан: ${createdDate}`);
      });
    }
    
    // Рекомендации
    console.log(`\n💡 РЕКОМЕНДАЦИИ`);
    if (stats.withoutPhone > 0) {
      console.log(`📞 Добавьте телефоны для ${stats.withoutPhone} студентов`);
    }
    if (stats.withoutGroups > 0) {
      console.log(`👥 Запишите в группы ${stats.withoutGroups} студентов`);
    }
    if (stats.inactive > 0) {
      console.log(`⚠️ Проверьте статус ${stats.inactive} неактивных студентов`);
    }
    
    console.log(`\n✅ Анализ завершен!`);
    
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error.message);
  }
}

// Запуск анализа
analyzeStudentsData(); 