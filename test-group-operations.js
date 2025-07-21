const axios = require('axios');

const API_BASE_URL = 'http://89.104.71.170:5000/api';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testGroupOperations() {
  try {
    console.log('🔐 Авторизация админа...');
    
    // Авторизация
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.token;
    
    console.log('✅ Авторизация успешна');
    
    // Получаем список групп
    console.log('\n📋 Получение списка групп...');
    const groupsResponse = await axios.get(`${API_BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Найдено групп: ${groupsResponse.data.length}`);
    
    if (groupsResponse.data.length > 0) {
      const firstGroup = groupsResponse.data[0];
      console.log(`\n📝 Первая группа: ${firstGroup.name} (ID: ${firstGroup._id})`);
      console.log(`   Студентов в группе: ${firstGroup.students ? firstGroup.students.length : 0}`);
      
      // Получаем список студентов
      console.log('\n👥 Получение списка студентов...');
      const studentsResponse = await axios.get(`${API_BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Найдено студентов: ${studentsResponse.data.length}`);
      
      if (studentsResponse.data.length > 0) {
        const firstStudent = studentsResponse.data[0];
        console.log(`\n👤 Первый студент: ${firstStudent.name} (ID: ${firstStudent._id})`);
        
        // Пытаемся добавить студента в группу
        console.log('\n➕ Добавление студента в группу...');
        try {
          const addStudentResponse = await axios.post(
            `${API_BASE_URL}/groups/${firstGroup._id}/students`,
            { studentId: firstStudent._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('✅ Студент успешно добавлен в группу');
          console.log(`   Обновленная группа: ${addStudentResponse.data.name}`);
          console.log(`   Студентов в группе: ${addStudentResponse.data.students.length}`);
          
        } catch (error) {
          if (error.response) {
            console.log(`❌ Ошибка при добавлении студента: ${error.response.data.message}`);
          } else {
            console.log(`❌ Ошибка: ${error.message}`);
          }
        }
      }
    }
    
    // Тестируем обновление статуса пользователя
    console.log('\n👨‍💼 Получение списка пользователей...');
    const usersResponse = await axios.get(`${API_BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Найдено пользователей: ${usersResponse.data.length}`);
    
    if (usersResponse.data.length > 0) {
      const firstUser = usersResponse.data[0];
      console.log(`\n👤 Первый пользователь: ${firstUser.name} (ID: ${firstUser._id})`);
      console.log(`   Текущий статус: ${firstUser.isActive ? 'Активен' : 'Неактивен'}`);
      
      // Тестируем изменение статуса
      console.log('\n🔄 Изменение статуса пользователя...');
      try {
        const newStatus = !firstUser.isActive;
        const updateStatusResponse = await axios.put(
          `${API_BASE_URL}/auth/users/${firstUser._id}/status`,
          { isActive: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log(`✅ Статус пользователя изменен на: ${newStatus ? 'Активен' : 'Неактивен'}`);
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ Ошибка при изменении статуса: ${error.response.data.message}`);
        } else {
          console.log(`❌ Ошибка: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Ошибка API: ${error.response.status} - ${error.response.data.message}`);
    } else {
      console.log(`❌ Ошибка: ${error.message}`);
    }
  }
}

// Запускаем тест
testGroupOperations(); 