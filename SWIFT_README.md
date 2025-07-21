# Swift модели для парсинга данных студентов

Этот набор Swift файлов предоставляет полную инфраструктуру для работы с данными студентов из вашего API.

## Файлы

### 1. `StudentModels.swift`
Основные модели данных для парсинга JSON ответов от API.

**Содержит:**
- `Student` - модель студента
- `Group` - модель группы
- `StudentsResponse` - модель ответа API
- `StudentsStatistics` - модель статистики
- `GroupedStudents` - модель группировки
- `StudentsDataManager` - менеджер для работы с данными
- `FilterCriteria` - перечисление для фильтрации

### 2. `StudentsNetworkService.swift`
Сетевой сервис для работы с API.

**Содержит:**
- `StudentsNetworkService` - основной сетевой сервис
- `LoginResponse` - модель ответа авторизации
- `UserInfo` - модель информации о пользователе
- `HealthResponse` - модель ответа здоровья сервера
- `NetworkError` - перечисление ошибок сети

### 3. `StudentsUIComponents.swift`
UI компоненты для отображения данных в SwiftUI.

**Содержит:**
- `StudentCardView` - карточка студента
- `StudentsListView` - список студентов
- `StatisticsView` - отображение статистики
- `StudentDetailView` - детальная информация о студенте
- Различные вспомогательные компоненты

## Использование

### 1. Базовое использование

```swift
import Foundation

// Создание менеджера данных
let dataManager = StudentsDataManager.shared

// Парсинг JSON
let jsonString = """
{
  "server": "http://89.104.71.170:5000",
  "timestamp": "2025-07-17T16:01:30.178Z",
  "total": 5,
  "students": [...]
}
"""

do {
    let response = try dataManager.parseStudents(from: jsonString)
    let students = response.students
    
    // Получение статистики
    let statistics = dataManager.getStatistics(from: students)
    print("Всего студентов: \(statistics.totalStudents)")
    
    // Фильтрация
    let activeStudents = dataManager.filterStudents(students, by: .active)
    let studentsWithPhone = dataManager.filterStudents(students, by: .withPhone)
    
} catch {
    print("Ошибка парсинга: \(error)")
}
```

### 2. Сетевое взаимодействие

```swift
import Foundation

// Создание сетевого сервиса
let networkService = StudentsNetworkService.shared

Task {
    do {
        // Авторизация
        let token = try await networkService.authenticate(
            username: "admin",
            password: "admin123"
        )
        
        // Получение студентов
        let response = try await networkService.fetchStudents()
        let students = response.students
        
        // Обработка данных
        print("Получено студентов: \(students.count)")
        
    } catch {
        print("Ошибка сети: \(error)")
    }
}
```

### 3. SwiftUI приложение

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = StudentsViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                if viewModel.isLoading {
                    ProgressView("Загрузка...")
                } else if let error = viewModel.error {
                    ErrorView(error: error) {
                        viewModel.loadStudents()
                    }
                } else {
                    StudentsListView(students: viewModel.students)
                }
            }
            .navigationTitle("Студенты")
        }
        .onAppear {
            viewModel.loadStudents()
        }
    }
}

class StudentsViewModel: ObservableObject {
    @Published var students: [Student] = []
    @Published var isLoading = false
    @Published var error: Error?
    
    private let networkService = StudentsNetworkService.shared
    
    func loadStudents() {
        isLoading = true
        error = nil
        
        Task {
            do {
                _ = try await networkService.authenticate(
                    username: "admin",
                    password: "admin123"
                )
                
                let response = try await networkService.fetchStudents()
                
                await MainActor.run {
                    self.students = response.students
                    self.isLoading = false
                }
                
            } catch {
                await MainActor.run {
                    self.error = error
                    self.isLoading = false
                }
            }
        }
    }
}
```

## Возможности

### Фильтрация студентов

```swift
// Различные типы фильтрации
let activeStudents = dataManager.filterStudents(students, by: .active)
let studentsWithPhone = dataManager.filterStudents(students, by: .withPhone)
let studentsInGroups = dataManager.filterStudents(students, by: .inGroups)
let studentsByName = dataManager.filterStudents(students, by: .nameContains("Даня"))
let studentsByGroup = dataManager.filterStudents(students, by: .groupName("Начинающие"))
```

### Статистика

```swift
let statistics = dataManager.getStatistics(from: students)
print("Всего: \(statistics.totalStudents)")
print("Активных: \(statistics.activeStudents)")
print("С телефоном: \(statistics.studentsWithPhone)")
print("В группах: \(statistics.studentsInGroups)")
print("Без групп: \(statistics.studentsWithoutGroups)")
```

### Группировка

```swift
let grouped = dataManager.getGroupedStudents(from: students)
print("Студентов без групп: \(grouped.studentsWithoutGroup.count)")

for (groupName, studentsInGroup) in grouped.studentsByGroup {
    print("\(groupName): \(studentsInGroup.count) студентов")
}
```

## Расширения

### Student

```swift
let student = students[0]

// Форматированное отображение
print(student.displayName) // "Даня (+79999999999)"
print(student.groupsString) // "123"
print(student.statusString) // "Активен"
print(student.formattedCreatedDate) // "16.07.2025, 21:59"
```

### Group

```swift
let group = student.groups[0]

print(group.fullInfo) // "123 - 2 (monday, 02:03)"
print(group.russianDayOfWeek) // "Понедельник"
print(group.formattedTime) // "02:03"
```

## Обработка ошибок

```swift
enum NetworkError: Error, LocalizedError {
    case notAuthenticated
    case unauthorized
    case forbidden
    case serverError(Int)
    case invalidResponse
    case decodingError
    case noData
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Необходима авторизация"
        case .unauthorized:
            return "Неверные учетные данные"
        case .forbidden:
            return "Доступ запрещен"
        case .serverError(let code):
            return "Ошибка сервера: \(code)"
        case .invalidResponse:
            return "Неверный ответ сервера"
        case .decodingError:
            return "Ошибка декодирования данных"
        case .noData:
            return "Нет данных"
        }
    }
}
```

## Требования

- iOS 15.0+ / macOS 12.0+
- Swift 5.5+
- Xcode 13.0+

## Установка

1. Скопируйте все три файла в ваш проект
2. Убедитесь, что в проекте включена поддержка SwiftUI
3. Настройте учетные данные в `StudentsNetworkService`

## Настройка

В файле `StudentsNetworkService.swift` измените:

```swift
private let baseURL = "http://89.104.71.170:5000" // Ваш сервер
```

И учетные данные при вызове:

```swift
_ = try await networkService.authenticate(
    username: "ваш_логин",
    password: "ваш_пароль"
)
```

## Примеры использования

Смотрите комментарии в файлах для подробных примеров использования каждого компонента. 