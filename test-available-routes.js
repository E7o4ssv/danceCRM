const axios = require('axios');

const API_BASE_URL = 'http://89.104.71.170:5000/api';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testAvailableRoutes() {
  try {
    console.log('🔐 Авторизация админа...');
    
    // Авторизация
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.token;
    
    console.log('✅ Авторизация успешна');
    
    // Тестируем различные роуты
    const routesToTest = [
      { name: 'GET /api/auth/users', method: 'GET', url: `${API_BASE_URL}/auth/users` },
      { name: 'PUT /api/auth/users/{id}', method: 'PUT', url: `${API_BASE_URL}/auth/users/68792103001ae980769f75ed` },
      { name: 'PUT /api/auth/users/{id}/status', method: 'PUT', url: `${API_BASE_URL}/auth/users/68792103001ae980769f75ed/status` },
      { name: 'GET /api/groups', method: 'GET', url: `${API_BASE_URL}/groups` },
      { name: 'POST /api/groups/{id}/students', method: 'POST', url: `${API_BASE_URL}/groups/68783266bbb45f0f13ccda6c/students` },
      { name: 'GET /api/students', method: 'GET', url: `${API_BASE_URL}/students` }
    ];
    
    for (const route of routesToTest) {
      console.log(`\n🔍 Тестируем: ${route.name}`);
      
      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        
        if (route.method === 'POST') {
          config.data = { studentId: 'test' };
        } else if (route.method === 'PUT') {
          config.data = { isActive: false };
        }
        
        const response = await axios({
          method: route.method,
          url: route.url,
          ...config
        });
        
        console.log(`   ✅ Статус: ${response.status}`);
        
      } catch (error) {
        if (error.response) {
          console.log(`   ❌ Статус: ${error.response.status}`);
          if (error.response.status === 404) {
            console.log(`   📝 Роут не найден`);
          } else if (error.response.status === 400) {
            console.log(`   📝 Роут найден, но ошибка валидации`);
          }
        } else {
          console.log(`   ❌ Ошибка: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

// Запускаем тест
testAvailableRoutes(); 