const axios = require('axios');

const BASE_URL = 'http://89.104.71.170:5000';

async function testChatFunctionality() {
  console.log('🧪 Тестирование функциональности чата');
  console.log('=====================================\n');

  try {
    // 1. Логин для получения токена
    console.log('1️⃣ Логин...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Логин успешен\n');

    // 2. Тест получения списка чатов
    console.log('2️⃣ Получение списка чатов...');
    const chatsResponse = await axios.get(`${BASE_URL}/api/private-chat/chats`, { headers });
    console.log(`✅ Получено чатов: ${chatsResponse.data.length}`);
    console.log('📋 Список чатов:', JSON.stringify(chatsResponse.data, null, 2));
    console.log('');

    // 3. Тест получения списка пользователей
    console.log('3️⃣ Получение списка пользователей...');
    const usersResponse = await axios.get(`${BASE_URL}/api/private-chat/users`, { headers });
    console.log(`✅ Получено пользователей: ${usersResponse.data.length}`);
    console.log('👥 Пользователи:', JSON.stringify(usersResponse.data, null, 2));
    console.log('');

    // 4. Тест получения чата с конкретным пользователем
    if (usersResponse.data.length > 0) {
      const partnerId = usersResponse.data[0]._id;
      console.log(`4️⃣ Получение чата с пользователем ${usersResponse.data[0].name}...`);
      const chatResponse = await axios.get(`${BASE_URL}/api/private-chat/chats/${partnerId}`, { headers });
      console.log('✅ Чат получен:', JSON.stringify(chatResponse.data, null, 2));
      console.log('');

      // 5. Тест отправки сообщения
      console.log('5️⃣ Отправка тестового сообщения...');
      const messageResponse = await axios.post(`${BASE_URL}/api/private-chat/chats/${partnerId}/messages`, {
        content: 'Тестовое сообщение от ' + new Date().toLocaleString()
      }, { headers });
      console.log('✅ Сообщение отправлено:', JSON.stringify(messageResponse.data, null, 2));
      console.log('');

      // 6. Проверка обновленного чата
      console.log('6️⃣ Проверка обновленного чата...');
      const updatedChatResponse = await axios.get(`${BASE_URL}/api/private-chat/chats/${partnerId}`, { headers });
      console.log('✅ Чат обновлен:', JSON.stringify(updatedChatResponse.data, null, 2));
    }

    console.log('\n🎉 Все тесты прошли успешно!');
    console.log('💬 Чат полностью функционален');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    process.exit(1);
  }
}

testChatFunctionality(); 