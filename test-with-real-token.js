const axios = require('axios');

const API_BASE_URL = 'http://89.104.71.170:5000/api';
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc4NDczYWIwMWY3OGVlZDBlYWVmZTQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTI3NzAwNDcsImV4cCI6MTc1Mjg1NjQ0N30.c80rtVNkpmjV4xWcKVez_ZB_R_-riaj89xFBvbku_Ww';

async function testWithRealToken() {
  try {
    console.log('🔐 Тестирование с реальным токеном...');
    
    // Тестируем получение студентов
    console.log('\n👥 Получение списка студентов...');
    const studentsResponse = await axios.get(`${API_BASE_URL}/students`, {
      headers: { 
        Authorization: `Bearer ${REAL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Найдено студентов: ${studentsResponse.data.length}`);
    
    if (studentsResponse.data.length > 0) {
      const firstStudent = studentsResponse.data[0];
      console.log(`\n👤 Первый студент: ${firstStudent.name} (ID: ${firstStudent._id})`);
    }
    
    // Тестируем получение групп
    console.log('\n📋 Получение списка групп...');
    const groupsResponse = await axios.get(`${API_BASE_URL}/groups`, {
      headers: { 
        Authorization: `Bearer ${REAL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Найдено групп: ${groupsResponse.data.length}`);
    
    if (groupsResponse.data.length > 0) {
      const firstGroup = groupsResponse.data[0];
      console.log(`\n📝 Первая группа: ${firstGroup.name} (ID: ${firstGroup._id})`);
      console.log(`   Студентов в группе: ${firstGroup.students ? firstGroup.students.length : 0}`);
    }
    
    // Тестируем получение пользователей
    console.log('\n👨‍💼 Получение списка пользователей...');
    const usersResponse = await axios.get(`${API_BASE_URL}/auth/users`, {
      headers: { 
        Authorization: `Bearer ${REAL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Найдено пользователей: ${usersResponse.data.length}`);
    
    if (usersResponse.data.length > 0) {
      const firstUser = usersResponse.data[0];
      console.log(`\n👤 Первый пользователь: ${firstUser.name} (ID: ${firstUser._id})`);
      console.log(`   Роль: ${firstUser.role}`);
      console.log(`   Статус: ${firstUser.isActive ? 'Активен' : 'Неактивен'}`);
    }
    
    // Тестируем новый роут изменения статуса
    console.log('\n🔄 Тестирование изменения статуса пользователя...');
    if (usersResponse.data.length > 0) {
      const testUser = usersResponse.data[0];
      const newStatus = !testUser.isActive;
      
      try {
        const updateStatusResponse = await axios.put(
          `${API_BASE_URL}/auth/users/${testUser._id}/status`,
          { isActive: newStatus },
          { 
            headers: { 
              Authorization: `Bearer ${REAL_TOKEN}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        console.log('✅ Статус пользователя изменен успешно');
        console.log(`   Новый статус: ${newStatus ? 'Активен' : 'Неактивен'}`);
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ Ошибка при изменении статуса: ${error.response.status}`);
          console.log(`   Сообщение: ${error.response.data.message || 'Неизвестная ошибка'}`);
        } else {
          console.log(`❌ Ошибка: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Общая ошибка:');
    if (error.response) {
      console.log(`   Статус: ${error.response.status}`);
      console.log(`   Данные:`, error.response.data);
    } else {
      console.log(`   Ошибка: ${error.message}`);
    }
  }
}

// Запускаем тест
testWithRealToken(); 