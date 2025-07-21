# Как запарсить данные с сервера - Простое объяснение для друга

## 🤔 Что такое парсинг данных?

**Парсинг** - это извлечение и обработка данных с сервера для дальнейшего использования.

Представь, что сервер - это библиотека с книгами, а парсинг - это когда ты берешь нужные книги и записываешь важную информацию в свой блокнот.

## 📋 Пошаговый план

### Шаг 1: Подключение к серверу
Сначала нужно "поздороваться" с сервером и получить разрешение на доступ к данным.

```javascript
// Пример на JavaScript
const serverUrl = 'http://89.104.71.170:5000';
const credentials = {
    username: 'admin',
    password: 'admin123'
};
```

### Шаг 2: Авторизация (получение токена)
Сервер требует "пропуск" (токен) для доступа к данным.

```javascript
// Получаем токен
const response = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
});

const { token } = await response.json();
console.log('Токен получен:', token);
```

### Шаг 3: Запрос данных
Теперь используем токен для получения данных.

```javascript
// Получаем список студентов
const studentsResponse = await fetch(`${serverUrl}/api/students`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

const students = await studentsResponse.json();
console.log('Получено студентов:', students.length);
```

## 🛠️ Готовые инструменты

### 1. JavaScript (Node.js)
```javascript
// Установка зависимостей
npm install axios

// Скрипт для парсинга
const axios = require('axios');

async function parseStudents() {
    try {
        // 1. Авторизация
        const authResponse = await axios.post('http://89.104.71.170:5000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = authResponse.data.token;
        
        // 2. Получение данных
        const studentsResponse = await axios.get('http://89.104.71.170:5000/api/students', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const students = studentsResponse.data;
        
        // 3. Сохранение в файл
        const fs = require('fs');
        fs.writeFileSync('students.json', JSON.stringify(students, null, 2));
        
        console.log(`Сохранено ${students.length} студентов`);
        
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

parseStudents();
```

### 2. Python
```python
import requests
import json

def parse_students():
    # 1. Авторизация
    auth_response = requests.post('http://89.104.71.170:5000/api/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    
    token = auth_response.json()['token']
    
    # 2. Получение данных
    headers = {'Authorization': f'Bearer {token}'}
    students_response = requests.get('http://89.104.71.170:5000/api/students', headers=headers)
    
    students = students_response.json()
    
    # 3. Сохранение в файл
    with open('students.json', 'w', encoding='utf-8') as f:
        json.dump(students, f, ensure_ascii=False, indent=2)
    
    print(f'Сохранено {len(students)} студентов')

parse_students()
```

### 3. Swift (iOS)
```swift
import Foundation

class StudentsParser {
    func parseStudents() async {
        do {
            // 1. Авторизация
            let authResponse = try await URLSession.shared.data(
                for: URLRequest(url: URL(string: "http://89.104.71.170:5000/api/auth/login")!)
            )
            
            let token = try JSONDecoder().decode(LoginResponse.self, from: authResponse.0).token
            
            // 2. Получение данных
            var request = URLRequest(url: URL(string: "http://89.104.71.170:5000/api/students")!)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let studentsResponse = try await URLSession.shared.data(for: request)
            let students = try JSONDecoder().decode([Student].self, from: studentsResponse.0)
            
            print("Получено \(students.count) студентов")
            
        } catch {
            print("Ошибка: \(error)")
        }
    }
}
```

## 📊 Что можно делать с данными

### 1. Сохранение в файлы
```javascript
// JSON файл
fs.writeFileSync('students.json', JSON.stringify(students, null, 2));

// CSV файл
const csv = students.map(s => `${s.name},${s.phone || ''},${s.isActive}`).join('\n');
fs.writeFileSync('students.csv', csv);
```

### 2. Анализ данных
```javascript
// Статистика
const stats = {
    total: students.length,
    active: students.filter(s => s.isActive).length,
    withPhone: students.filter(s => s.phone).length,
    inGroups: students.filter(s => s.groups.length > 0).length
};

console.log('Статистика:', stats);
```

### 3. Фильтрация
```javascript
// Только активные студенты
const activeStudents = students.filter(s => s.isActive);

// Студенты с телефоном
const studentsWithPhone = students.filter(s => s.phone);

// Поиск по имени
const searchResults = students.filter(s => s.name.includes('Даня'));
```

## 🔧 Частые проблемы и решения

### Проблема: "Access token required"
**Решение:** Нужно сначала авторизоваться и получить токен.

### Проблема: "Unauthorized"
**Решение:** Проверь правильность логина и пароля.

### Проблема: "Connection refused"
**Решение:** Проверь, что сервер работает и доступен.

## 📱 Готовые скрипты

Я создал для тебя готовые скрипты:

1. **`parse-students-89.104.71.170.js`** - Полный скрипт с авторизацией
2. **`get-students-with-auth.js`** - Простой скрипт для тестирования
3. **`analyze-students.js`** - Анализ сохраненных данных

### Как запустить:
```bash
# Установка зависимостей
npm install axios

# Запуск парсинга
node parse-students-89.104.71.170.js
```

## 🎯 Простой алгоритм

1. **Подключись** к серверу
2. **Авторизуйся** (получи токен)
3. **Запроси** нужные данные
4. **Обработай** полученную информацию
5. **Сохрани** результат

## 💡 Советы

- **Всегда обрабатывай ошибки** - сервер может быть недоступен
- **Сохраняй токены** - не запрашивай авторизацию каждый раз
- **Используй правильные заголовки** - Content-Type и Authorization
- **Проверяй статус ответа** - 200 = OK, 401 = не авторизован, 403 = запрещено

## 🚀 Быстрый старт

Скопируй один из готовых скриптов, измени учетные данные и запусти:

```bash
node parse-students-89.104.71.170.js
```

Результат будет сохранен в папке `parsed-data` в форматах JSON и CSV.

Удачи с парсингом! 🎉 