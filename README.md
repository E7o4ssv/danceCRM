# 🕺 Школа Танцев - Система управления

Веб-приложение для управления школой танцев с функциями учета посещаемости, управления группами и студентами.

## 🚀 Возможности

### Для педагогов:
- ✅ Авторизация в системе
- ✅ Создание и управление группами
- ✅ Добавление/удаление студентов из групп
- ✅ Отметка посещаемости студентов
- ✅ Отправка отчетов о посещаемости

### Для администраторов:
- ✅ Просмотр всех групп и студентов
- ✅ Получение отчетов о посещаемости
- ✅ Управление пользователями системы

## 🛠 Технологии

### Backend:
- **Node.js** с Express
- **MongoDB** для хранения данных
- **JWT** для аутентификации
- **Swagger** для документации API

### Frontend:
- **React** с функциональными компонентами
- **React Bootstrap** для UI
- **Axios** для HTTP запросов
- **React Router** для навигации

## 📋 Требования

- Node.js (версия 14 или выше)
- MongoDB (локально или MongoDB Atlas)
- npm или yarn

## 🚀 Установка и запуск

### Локальная разработка

#### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd dance
```

#### 2. Установка зависимостей
```bash
# Установка зависимостей для backend и frontend
npm run install-all
```

#### 3. Настройка переменных окружения
```bash
# Скопируйте пример файла конфигурации
cp env.example .env

# Отредактируйте .env файл
nano .env
```

Пример содержимого `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dance-school
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### 4. Запуск MongoDB
```bash
# Если MongoDB установлен локально
mongod

# Или используйте MongoDB Atlas (облачная база данных)
```

#### 5. Запуск приложения
```bash
# Запуск в режиме разработки (backend + frontend)
npm run dev

# Или запуск по отдельности:
npm run server    # Только backend
npm run client    # Только frontend
```

### Развертывание на Amvera

#### 1. Подготовка к развертыванию
Проект уже содержит необходимый файл `amvera.yml` для развертывания на Amvera.

#### 2. Настройка переменных окружения
В разделе "Конфигурация" на Amvera установите следующие переменные:
```env
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb://localhost:27017/dance-school
JWT_SECRET=your-production-secret-key-change-this
```

#### 3. Развертывание
Выберите один из способов:

**Способ 1: Push в Git-репозиторий**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

**Способ 2: Загрузка через интерфейс**
1. Перейдите в раздел "Репозиторий"
2. Загрузите все файлы проекта
3. В разделе "Конфигурация" настройте переменные окружения
4. Нажмите "Применить" и "Собрать"

#### 4. Домены
- **Внутреннее имя**: `amvera-devferretx-run-dance`
- **Порт**: 80
- **Постоянное хранилище**: `/data`

## 🌐 Доступ к приложению

### Локальная разработка
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Документация**: http://localhost:5000/api-docs

### Amvera (продакшн)
- **Приложение**: https://amvera-devferretx-run-dance.amvera.io
- **API Документация**: https://amvera-devferretx-run-dance.amvera.io/api-docs
- **Health Check**: https://amvera-devferretx-run-dance.amvera.io/api/health

## 👤 Создание первого пользователя

После запуска приложения:

1. Откройте http://localhost:3000
2. Нажмите "Зарегистрироваться"
3. Создайте пользователя с ролью "admin"
4. Войдите в систему

## 📚 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Информация о пользователе

### Группы
- `GET /api/groups` - Список групп
- `POST /api/groups` - Создание группы
- `PUT /api/groups/:id` - Обновление группы
- `DELETE /api/groups/:id` - Удаление группы

### Студенты
- `GET /api/students` - Список студентов
- `POST /api/students` - Создание студента
- `PUT /api/students/:id` - Обновление студента
- `DELETE /api/students/:id` - Удаление студента

### Посещаемость
- `GET /api/attendance` - Список отчетов
- `POST /api/attendance` - Создание отчета
- `PUT /api/attendance/:id` - Обновление отчета
- `DELETE /api/attendance/:id` - Удаление отчета

## 🔧 Структура проекта

```
dance/
├── server/                 # Backend
│   ├── models/            # Mongoose модели
│   ├── routes/            # API маршруты
│   ├── middleware/        # Middleware функции
│   └── index.js           # Основной файл сервера
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── contexts/      # React контексты
│   │   └── App.js         # Основной компонент
│   └── public/            # Статические файлы
├── package.json           # Зависимости и скрипты
└── README.md             # Документация
```

## 🎯 Роли пользователей

### Педагог (teacher)
- Создание и управление своими группами
- Добавление студентов в группы
- Отметка посещаемости
- Просмотр отчетов по своим группам

### Администратор (admin)
- Просмотр всех групп и студентов
- Управление пользователями системы
- Полный доступ ко всем функциям

## 🔒 Безопасность

- JWT токены для аутентификации
- Хеширование паролей с bcrypt
- Валидация данных на сервере
- Проверка прав доступа по ролям

## 📱 Мобильное приложение

Для мобильного приложения на Swift используйте следующие API endpoints:

```swift
// Базовый URL
let baseURL = "http://localhost:5000/api"

// Пример запроса
let url = URL(string: "\(baseURL)/groups")!
var request = URLRequest(url: url)
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
```

## 🐛 Отладка

### Логи сервера
```bash
# Просмотр логов в реальном времени
npm run server
```

### Проверка базы данных
```bash
# Подключение к MongoDB
mongo dance-school
```

### Проверка API
```bash
# Тестирование API через curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/groups
```

## 📝 Лицензия

MIT License

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте документацию API: http://localhost:5000/api-docs
2. Просмотрите логи сервера
3. Убедитесь, что MongoDB запущена
4. Проверьте настройки в файле .env

---

**Удачного использования! 🕺💃** 