#!/bin/bash

# Скрипт с curl командами для тестирования API
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc4NDczYWIwMWY3OGVlZDBlYWVmZTQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTI3NzAwNDcsImV4cCI6MTc1Mjg1NjQ0N30.c80rtVNkpmjV4xWcKVez_ZB_R_-riaj89xFBvbku_Ww"
BASE_URL="http://89.104.71.170:5000/api"

echo "🧪 Тестирование API с curl командами"
echo "======================================"

echo ""
echo "1️⃣ Получение списка студентов:"
curl -X GET "$BASE_URL/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.[0:2]' 2>/dev/null || echo "jq не установлен, показываем первые 2 записи"

echo ""
echo "2️⃣ Получение списка групп:"
curl -X GET "$BASE_URL/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.[0:2]' 2>/dev/null || echo "jq не установлен, показываем первые 2 записи"

echo ""
echo "3️⃣ Получение списка пользователей:"
curl -X GET "$BASE_URL/auth/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.[0:2]' 2>/dev/null || echo "jq не установлен, показываем первые 2 записи"

echo ""
echo "4️⃣ Тестирование изменения статуса пользователя (должно вернуть 404 до развертывания):"
curl -X PUT "$BASE_URL/auth/users/68792103001ae980769f75ed/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'

echo ""
echo ""
echo "📋 Ожидаемые результаты:"
echo "✅ 1-3: Должны вернуть данные"
echo "❌ 4: Должен вернуть 404 (до развертывания исправлений)"
echo ""
echo "🚀 После развертывания исправлений:"
echo "✅ 4: Должен работать и изменять статус пользователя" 