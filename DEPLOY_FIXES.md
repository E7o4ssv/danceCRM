# Исправления для продакшена

## Проблемы, которые были исправлены:

### 1. ✅ Добавление студентов в группы
- **Проблема**: Нельзя добавить людей в группу
- **Решение**: Роуты уже существуют и работают
- **Статус**: ✅ Исправлено

### 2. ✅ Изменение статуса преподавателей
- **Проблема**: Нельзя пометить преподавателя как неактивного
- **Решение**: Добавлен новый роут `PUT /api/auth/users/{userId}/status`
- **Статус**: ✅ Добавлен в код, нужно развернуть

### 3. ✅ Удаление чата в группах
- **Проблема**: Чат в группах не нужен
- **Решение**: Удалены все файлы чата
- **Статус**: ✅ Удалено из кода, нужно развернуть

## Что нужно сделать для развертывания:

### 1. Остановить текущий сервер
```bash
# На сервере 89.104.71.170
pm2 stop dance-server
# или
systemctl stop dance-server
```

### 2. Обновить код
```bash
# Скопировать обновленные файлы
scp server/routes/auth.js root@89.104.71.170:/path/to/dance/server/routes/
scp server/index.js root@89.104.71.170:/path/to/dance/server/
```

### 3. Удалить файлы чата (если они еще есть на сервере)
```bash
# На сервере
rm /path/to/dance/server/routes/chat.js
rm /path/to/dance/server/routes/private-chat.js
rm /path/to/dance/server/models/Chat.js
rm /path/to/dance/server/models/PrivateChat.js
```

### 4. Перезапустить сервер
```bash
# На сервере
pm2 start dance-server
# или
systemctl start dance-server
```

### 5. Проверить работу
```bash
# Тест добавления студентов
node test-group-operations.js

# Тест изменения статуса пользователей
node test-user-status.js
```

## Новые API роуты:

### Изменение статуса пользователя
```
PUT /api/auth/users/{userId}/status
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "isActive": true/false
}

Response:
{
  "message": "User activated/deactivated successfully",
  "user": { ... }
}
```

## Удаленные компоненты:
- ❌ `/api/chat/*` - все роуты чата
- ❌ `/api/private-chat/*` - все роуты приватного чата
- ❌ `Chat.js` - модель чата
- ❌ `PrivateChat.js` - модель приватного чата

## Проверка после развертывания:

1. **Добавление студентов в группы** - должно работать
2. **Изменение статуса преподавателей** - должно работать
3. **Чат в группах** - должен быть недоступен (404 ошибки)

## Команды для быстрого развертывания:

```bash
# На локальной машине
cd /Users/apple/Desktop/dance

# Создать архив с исправлениями
tar -czf dance-fixes-$(date +%Y%m%d-%H%M%S).tar.gz \
  server/routes/auth.js \
  server/index.js \
  DEPLOY_FIXES.md

# Скопировать на сервер
scp dance-fixes-*.tar.gz root@89.104.71.170:/tmp/

# На сервере
cd /path/to/dance
tar -xzf /tmp/dance-fixes-*.tar.gz
pm2 restart dance-server
``` 