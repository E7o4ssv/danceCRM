const axios = require('axios');

const API_BASE_URL = 'http://89.104.71.170:5000/api';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testUserStatusUpdate() {
  try {
    console.log('🔐 Авторизация админа...');
    
    // Авторизация
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.token;
    
    console.log('✅ Авторизация успешна');
    
    // Получаем список пользователей
    console.log('\n👨‍💼 Получение списка пользователей...');
    const usersResponse = await axios.get(`${API_BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Найдено пользователей: ${usersResponse.data.length}`);
    
    if (usersResponse.data.length > 0) {
      const firstUser = usersResponse.data[0];
      console.log(`\n👤 Первый пользователь: ${firstUser.name} (ID: ${firstUser._id})`);
      console.log(`   Роль: ${firstUser.role}`);
      console.log(`   Текущий статус: ${firstUser.isActive ? 'Активен' : 'Неактивен'}`);
      
      // Тестируем изменение статуса
      console.log('\n🔄 Изменение статуса пользователя...');
      const newStatus = !firstUser.isActive;
      
      console.log(`   Отправляем запрос: PUT ${API_BASE_URL}/auth/users/${firstUser._id}/status`);
      console.log(`   Данные: { isActive: ${newStatus} }`);
      
      try {
        const updateStatusResponse = await axios.put(
          `${API_BASE_URL}/auth/users/${firstUser._id}/status`,
          { isActive: newStatus },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        console.log('✅ Статус пользователя изменен успешно');
        console.log(`   Новый статус: ${newStatus ? 'Активен' : 'Неактивен'}`);
        console.log(`   Ответ сервера:`, updateStatusResponse.data);
        
      } catch (error) {
        console.log('❌ Ошибка при изменении статуса:');
        if (error.response) {
          console.log(`   Статус: ${error.response.status}`);
          console.log(`   Данные:`, error.response.data);
          console.log(`   Заголовки:`, error.response.headers);
        } else {
          console.log(`   Ошибка: ${error.message}`);
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
testUserStatusUpdate(); 