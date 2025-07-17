# 🚀 Инструкции по безопасному деплою дизайна

## 📋 Обзор изменений

### ✅ Что добавлено:
- **Tailwind CSS** - современная система стилей
- **Glassmorphism дизайн** - стеклянные эффекты
- **Улучшенная авторизация** - с демо-пользователями
- **Адаптивный дизайн** - для всех устройств
- **Новые компоненты** - Chat, IndividualLessons, Teachers
- **Улучшенная навигация** - с новым Navbar

### 🔧 Технические изменения:
- Удален Bootstrap
- Добавлен Tailwind CSS v3.4.0
- Обновлены все компоненты React
- Добавлены новые API endpoints
- Улучшена обработка ошибок

## 🛡️ Безопасность деплоя

### 1. Резервная копия
```bash
# Автоматически создается в deploy-design-safe.sh
backup-YYYYMMDD-HHMMSS/
```

### 2. Тестирование
- ✅ Локальная сборка
- ✅ API тестирование
- ✅ Функциональность сохранена

## 📦 Подготовка к деплою

### Запуск скрипта подготовки:
```bash
./deploy-design-safe.sh
```

Скрипт автоматически:
- Создаст резервную копию
- Проверит зависимости
- Протестирует сборку
- Создаст production build
- Подготовит архив для деплоя

## 🚀 Деплой на сервер

### Шаг 1: Загрузка файлов
```bash
# Загрузите архив на сервер
scp dance-school-design-*.tar.gz user@server:/path/to/app/
```

### Шаг 2: Распаковка
```bash
cd /path/to/app/
tar -xzf dance-school-design-*.tar.gz
```

### Шаг 3: Установка зависимостей
```bash
# Корневые зависимости
npm install

# Зависимости клиента
cd client
npm install
cd ..
```

### Шаг 4: Создание production build
```bash
cd client
npm run build
cd ..
```

### Шаг 5: Настройка переменных окружения
```bash
# Скопируйте .env файл
cp env.example .env

# Отредактируйте .env
nano .env
```

### Шаг 6: Запуск приложения
```bash
# В продакшене
npm start

# Или с PM2
pm2 start server/index.js --name "dance-school"
```

## 🔧 Критические настройки

### 1. Переменные окружения (.env)
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/dance-school
JWT_SECRET=your-secret-key
```

### 2. CORS настройки (server/index.js)
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://your-domain.com',  // Добавьте ваш домен
    'http://89.104.71.170'
  ],
  credentials: true
}));
```

### 3. База данных
```bash
# Проверьте подключение к MongoDB
mongo dance-school
```

## 🧪 Тестирование после деплоя

### 1. Проверка API
```bash
curl http://your-server:3001/api/health
```

### 2. Проверка авторизации
```bash
curl -X POST http://your-server:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher","password":"teacher123"}'
```

### 3. Проверка фронтенда
- Откройте http://your-server:3001
- Попробуйте войти с демо-данными
- Проверьте все разделы

## 🔄 Откат изменений

### Если что-то пошло не так:
```bash
# 1. Остановите приложение
pm2 stop dance-school

# 2. Восстановите из резервной копии
cp -r backup-YYYYMMDD-HHMMSS/* ./

# 3. Перезапустите
pm2 start dance-school
```

## 📊 Мониторинг

### Логи приложения:
```bash
pm2 logs dance-school
```

### Мониторинг ресурсов:
```bash
pm2 monit
```

## 🎯 Демо-данные

После деплоя создайте пользователей:
```bash
# Администратор
curl -X POST http://your-server:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","name":"Администратор","role":"admin"}'

# Учитель
curl -X POST http://your-server:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher","password":"teacher123","name":"Учитель Танцев","role":"teacher"}'
```

## ⚠️ Важные замечания

1. **Не удаляйте резервную копию** до полного тестирования
2. **Проверьте все функции** после деплоя
3. **Мониторьте логи** первые часы после деплоя
4. **Сохраните старые настройки** на случай отката

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи: `pm2 logs dance-school`
2. Проверьте статус: `pm2 status`
3. Проверьте API: `curl http://localhost:3001/api/health`
4. Восстановите из резервной копии при необходимости

---

**Удачи с деплоем! 🚀** 