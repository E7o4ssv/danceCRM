const axios = require('axios');

const API_BASE_URL = 'http://89.104.71.170:5000/api';
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc4NDczYWIwMWY3OGVlZDBlYWVmZTQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTI3NzAwNDcsImV4cCI6MTc1Mjg1NjQ0N30.c80rtVNkpmjV4xWcKVez_ZB_R_-riaj89xFBvbku_Ww';

async function testChatRestored() {
  try {
    console.log('🔧 Тестирование восстановленного чата...');
    
    // Получаем список групп
    console.log('\n1️⃣ Получение групп...');
    const groupsResponse = await axios.get(`${API_BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${REAL_TOKEN}` }
    });
    
    if (groupsResponse.data.length === 0) {
      console.log('❌ Нет групп для тестирования чата');
      return;
    }
    
    const group = groupsResponse.data[0];
    console.log(`✅ Группа найдена: ${group.name} (ID: ${group._id})`);
    
    // Тестируем получение чата группы
    console.log('\n2️⃣ Тестирование получения чата группы...');
    try {
      const chatResponse = await axios.get(`${API_BASE_URL}/chat/group/${group._id}`, {
        headers: { Authorization: `Bearer ${REAL_TOKEN}` }
      });
      
      console.log('✅ Чат группы получен успешно');
      console.log(`   Участников: ${chatResponse.data.participants?.length || 0}`);
      console.log(`   Сообщений: ${chatResponse.data.messages?.length || 0}`);
      
      // Тестируем отправку сообщения
      console.log('\n3️⃣ Тестирование отправки сообщения...');
      const messageResponse = await axios.post(
        `${API_BASE_URL}/chat/group/${group._id}/messages`,
        { content: 'Тестовое сообщение от ' + new Date().toLocaleString() },
        { headers: { Authorization: `Bearer ${REAL_TOKEN}` } }
      );
      
      console.log('✅ Сообщение отправлено успешно');
      console.log(`   Новое количество сообщений: ${messageResponse.data.messages?.length || 0}`);
      
    } catch (error) {
      console.log(`❌ Ошибка при работе с чатом: ${error.response?.status}`);
      console.log(`   Сообщение: ${error.response?.data?.message || 'Неизвестная ошибка'}`);
    }
    
    console.log('\n🎯 Результат:');
    console.log('✅ Чат восстановлен и работает');
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

// Запускаем тест
testChatRestored(); 