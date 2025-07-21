# Модели данных в базе данных

## 📊 Обзор структуры базы данных

Ваша база данных содержит **7 основных моделей** для системы управления школой танцев:

1. **User** - Пользователи системы (учителя, администраторы)
2. **Student** - Студенты
3. **Group** - Группы занятий
4. **Attendance** - Посещаемость
5. **IndividualLesson** - Индивидуальные занятия
6. **Chat** - Групповые чаты
7. **PrivateChat** - Приватные чаты

---

## 👤 1. User (Пользователи)

**Описание:** Пользователи системы - учителя и администраторы

### Поля:
```javascript
{
  username: String,        // Логин (уникальный)
  password: String,        // Хешированный пароль
  role: String,           // 'teacher' или 'admin'
  name: String,           // Полное имя
  phone: String,          // Телефон (опционально)
  isActive: Boolean,      // Активен ли пользователь
  createdAt: Date         // Дата создания
}
```

### Особенности:
- **Автоматическое хеширование паролей** с помощью bcrypt
- **Метод сравнения паролей** `comparePassword()`
- **Роли:** teacher (учитель), admin (администратор)

### Пример данных:
```json
{
  "_id": "6877f67625ea20c6b11c5b57",
  "username": "admin",
  "password": "$2a$10$...",
  "role": "admin",
  "name": "Администратор",
  "phone": "+79999999999",
  "isActive": true,
  "createdAt": "2025-07-16T18:59:02.794Z"
}
```

---

## 🎓 2. Student (Студенты)

**Описание:** Студенты школы танцев

### Поля:
```javascript
{
  name: String,           // Имя студента
  phone: String,          // Телефон (опционально)
  groups: [ObjectId],     // Ссылки на группы
  isActive: Boolean,      // Активен ли студент
  createdAt: Date         // Дата создания
}
```

### Связи:
- **groups** → Group (многие ко многим)

### Пример данных:
```json
{
  "_id": "6877f67625ea20c6b11c5b57",
  "name": "Даня",
  "phone": "+79999999999",
  "groups": ["68783266bbb45f0f13ccda6c"],
  "isActive": true,
  "createdAt": "2025-07-16T18:59:02.794Z"
}
```

---

## 👥 3. Group (Группы)

**Описание:** Группы занятий

### Поля:
```javascript
{
  name: String,           // Название группы
  teachers: [ObjectId],   // Учителя группы
  teacher: ObjectId,      // Основной учитель (для совместимости)
  room: String,           // Помещение
  dayOfWeek: String,      // День недели
  time: String,           // Время занятий
  students: [ObjectId],   // Студенты в группе
  isActive: Boolean,      // Активна ли группа
  createdBy: ObjectId,    // Кто создал группу
  createdAt: Date         // Дата создания
}
```

### Связи:
- **teachers** → User (многие ко многим)
- **teacher** → User (один к одному)
- **students** → Student (многие ко многим)
- **createdBy** → User (один к одному)

### Особенности:
- **Автоматическое добавление** основного учителя в массив teachers
- **Дни недели:** monday, tuesday, wednesday, thursday, friday, saturday, sunday

### Пример данных:
```json
{
  "_id": "68783266bbb45f0f13ccda6c",
  "name": "Начинающие",
  "teachers": ["6877f67625ea20c6b11c5b57"],
  "teacher": "6877f67625ea20c6b11c5b57",
  "room": "Зал 1",
  "dayOfWeek": "monday",
  "time": "18:00",
  "students": ["6877f67625ea20c6b11c5b57"],
  "isActive": true,
  "createdBy": "6877f67625ea20c6b11c5b57",
  "createdAt": "2025-07-16T18:59:02.794Z"
}
```

---

## ✅ 4. Attendance (Посещаемость)

**Описание:** Учет посещаемости студентов

### Поля:
```javascript
{
  group: ObjectId,        // Группа
  date: Date,             // Дата занятия
  students: [{            // Студенты и их статус
    student: ObjectId,    // Студент
    present: Boolean,     // Присутствовал ли
    note: String          // Заметка
  }],
  submittedBy: ObjectId,  // Кто отметил посещаемость
  submittedAt: Date       // Когда отметили
}
```

### Связи:
- **group** → Group (один к одному)
- **students.student** → Student (один к одному)
- **submittedBy** → User (один к одному)

### Особенности:
- **Уникальный индекс** по group + date (предотвращает дубликаты)
- **Массив студентов** с индивидуальным статусом посещения

### Пример данных:
```json
{
  "_id": "68783266bbb45f0f13ccda6d",
  "group": "68783266bbb45f0f13ccda6c",
  "date": "2025-07-16T00:00:00.000Z",
  "students": [
    {
      "student": "6877f67625ea20c6b11c5b57",
      "present": true,
      "note": "Отлично занимался"
    }
  ],
  "submittedBy": "6877f67625ea20c6b11c5b57",
  "submittedAt": "2025-07-16T18:59:02.794Z"
}
```

---

## 🎯 5. IndividualLesson (Индивидуальные занятия)

**Описание:** Индивидуальные занятия со студентами

### Поля:
```javascript
{
  name: String,           // Название занятия
  teacher: ObjectId,      // Учитель
  students: [ObjectId],   // Студенты (максимум 2)
  schedule: [{            // Расписание
    dayOfWeek: String,    // День недели
    time: String          // Время
  }],
  room: String,           // Помещение
  isActive: Boolean,      // Активно ли занятие
  duration: Number,       // Продолжительность (минуты)
  price: Number,          // Стоимость
  notes: String,          // Заметки
  createdBy: ObjectId,    // Кто создал
  createdAt: Date         // Дата создания
}
```

### Связи:
- **teacher** → User (один к одному)
- **students** → Student (многие ко многим)
- **createdBy** → User (один к одному)

### Особенности:
- **Валидация:** максимум 2 студента на занятие
- **Продолжительность:** 30-180 минут (по умолчанию 60)
- **Гибкое расписание** с несколькими днями/временем

### Пример данных:
```json
{
  "_id": "68783266bbb45f0f13ccda6e",
  "name": "Индивидуальный урок",
  "teacher": "6877f67625ea20c6b11c5b57",
  "students": ["6877f67625ea20c6b11c5b57"],
  "schedule": [
    {
      "dayOfWeek": "monday",
      "time": "19:00"
    }
  ],
  "room": "Зал 2",
  "isActive": true,
  "duration": 60,
  "price": 1000,
  "notes": "Индивидуальный урок для начинающих",
  "createdBy": "6877f67625ea20c6b11c5b57",
  "createdAt": "2025-07-16T18:59:02.794Z"
}
```

---

## 💬 6. Chat (Групповые чаты)

**Описание:** Групповые чаты для общения

### Поля:
```javascript
{
  group: ObjectId,        // Группа
  participants: [ObjectId], // Участники чата
  messages: [{            // Сообщения
    sender: ObjectId,     // Отправитель
    content: String,      // Текст сообщения
    timestamp: Date,      // Время отправки
    isRead: Boolean       // Прочитано ли
  }],
  lastActivity: Date,     // Последняя активность
  isActive: Boolean,      // Активен ли чат
  createdAt: Date         // Дата создания
}
```

### Связи:
- **group** → Group (один к одному)
- **participants** → User (многие ко многим)
- **messages.sender** → User (один к одному)

### Особенности:
- **Автоматическое обновление** lastActivity при добавлении сообщений
- **Индекс** для быстрого поиска по группе

### Пример данных:
```json
{
  "_id": "68783266bbb45f0f13ccda6f",
  "group": "68783266bbb45f0f13ccda6c",
  "participants": ["6877f67625ea20c6b11c5b57"],
  "messages": [
    {
      "sender": "6877f67625ea20c6b11c5b57",
      "content": "Привет всем!",
      "timestamp": "2025-07-16T18:59:02.794Z",
      "isRead": true
    }
  ],
  "lastActivity": "2025-07-16T18:59:02.794Z",
  "isActive": true,
  "createdAt": "2025-07-16T18:59:02.794Z"
}
```

---

## 🔒 7. PrivateChat (Приватные чаты)

**Описание:** Приватные чаты между двумя пользователями

### Поля:
```javascript
{
  participants: [ObjectId], // Участники (ровно 2)
  messages: [{            // Сообщения
    sender: ObjectId,     // Отправитель
    content: String,      // Текст сообщения
    timestamp: Date,      // Время отправки
    isRead: Boolean       // Прочитано ли
  }],
  lastActivity: Date,     // Последняя активность
  isActive: Boolean,      // Активен ли чат
  createdAt: Date         // Дата создания
}
```

### Связи:
- **participants** → User (многие ко многим)
- **messages.sender** → User (один к одному)

### Особенности:
- **Валидация:** ровно 2 участника
- **Статические методы** для поиска чатов
- **Автоматическое обновление** lastActivity

### Статические методы:
- `findChatBetween(userId1, userId2)` - найти чат между двумя пользователями
- `findUserChats(userId)` - найти все чаты пользователя

### Пример данных:
```json
{
  "_id": "68783266bbb45f0f13ccda70",
  "participants": [
    "6877f67625ea20c6b11c5b57",
    "6877f67625ea20c6b11c5b58"
  ],
  "messages": [
    {
      "sender": "6877f67625ea20c6b11c5b57",
      "content": "Привет!",
      "timestamp": "2025-07-16T18:59:02.794Z",
      "isRead": true
    }
  ],
  "lastActivity": "2025-07-16T18:59:02.794Z",
  "isActive": true,
  "createdAt": "2025-07-16T18:59:02.794Z"
}
```

---

## 🔗 Связи между моделями

```
User (1) ←→ (N) Group
User (1) ←→ (N) Student (через группы)
User (1) ←→ (N) Attendance
User (1) ←→ (N) IndividualLesson
User (1) ←→ (N) Chat
User (1) ←→ (N) PrivateChat

Group (1) ←→ (N) Student
Group (1) ←→ (N) Attendance
Group (1) ←→ (1) Chat

Student (N) ←→ (N) Group
Student (1) ←→ (N) IndividualLesson
Student (1) ←→ (N) Attendance
```

---

## 📊 Статистика базы данных

### Коллекции:
- **users** - Пользователи системы
- **students** - Студенты
- **groups** - Группы занятий
- **attendances** - Посещаемость
- **individuallessons** - Индивидуальные занятия
- **chats** - Групповые чаты
- **privatechats** - Приватные чаты

### Индексы:
- **User:** username (уникальный)
- **Attendance:** group + date (уникальный)
- **Chat:** group
- **PrivateChat:** participants

### Валидации:
- **IndividualLesson:** максимум 2 студента
- **PrivateChat:** ровно 2 участника
- **User:** роль только teacher или admin
- **Group:** день недели из предопределенного списка

---

## 💡 Рекомендации по использованию

### Для парсинга данных:
1. **Student** - основная модель для парсинга списка студентов
2. **Group** - для получения информации о группах
3. **User** - для авторизации и управления пользователями

### Для Swift приложения:
```swift
// Основные модели для парсинга
struct Student: Codable {
    let id: String
    let name: String
    let phone: String?
    let groups: [Group]
    let isActive: Bool
    let createdAt: String
}

struct Group: Codable {
    let id: String
    let name: String
    let room: String
    let dayOfWeek: String
    let time: String
}
```

Эта структура базы данных обеспечивает полную функциональность системы управления школой танцев! 🎉 