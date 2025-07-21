# Как запарсить данные с сервера в Swift приложении

## 🚀 Быстрый старт для iOS разработчика

### Шаг 1: Создай модели данных

Сначала создай структуры для парсинга JSON:

```swift
import Foundation

// Модель студента
struct Student: Codable {
    let id: String
    let name: String
    let phone: String?
    let groups: [Group]
    let isActive: Bool
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, phone, groups, isActive, createdAt
    }
}

// Модель группы
struct Group: Codable {
    let id: String
    let name: String
    let room: String
    let dayOfWeek: String
    let time: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, room, dayOfWeek, time
    }
}

// Модель ответа авторизации
struct LoginResponse: Codable {
    let token: String
    let user: UserInfo?
}

struct UserInfo: Codable {
    let id: String
    let username: String
    let role: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case username, role
    }
}
```

### Шаг 2: Создай сетевой сервис

```swift
import Foundation

class StudentsNetworkService {
    static let shared = StudentsNetworkService()
    
    private let baseURL = "http://89.104.71.170:5000"
    private var authToken: String?
    
    private init() {}
    
    // Авторизация
    func authenticate(username: String, password: String) async throws -> String {
        let url = URL(string: "\(baseURL)/api/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let credentials = ["username": username, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: credentials)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(httpResponse.statusCode)
        }
        
        let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
        self.authToken = loginResponse.token
        return loginResponse.token
    }
    
    // Получение студентов
    func fetchStudents() async throws -> [Student] {
        guard let token = authToken else {
            throw NetworkError.notAuthenticated
        }
        
        let url = URL(string: "\(baseURL)/api/students")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            return try JSONDecoder().decode([Student].self, from: data)
        case 401:
            throw NetworkError.unauthorized
        case 403:
            throw NetworkError.forbidden
        default:
            throw NetworkError.serverError(httpResponse.statusCode)
        }
    }
}

// Ошибки сети
enum NetworkError: Error, LocalizedError {
    case notAuthenticated
    case unauthorized
    case forbidden
    case serverError(Int)
    case invalidResponse
    
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
        }
    }
}
```

### Шаг 3: Создай ViewModel

```swift
import Foundation

@MainActor
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
                // Авторизация
                _ = try await networkService.authenticate(
                    username: "admin",
                    password: "admin123"
                )
                
                // Получение данных
                let students = try await networkService.fetchStudents()
                self.students = students
                self.isLoading = false
                
            } catch {
                self.error = error
                self.isLoading = false
            }
        }
    }
    
    // Фильтрация студентов
    var activeStudents: [Student] {
        students.filter { $0.isActive }
    }
    
    var studentsWithPhone: [Student] {
        students.filter { $0.phone != nil && !$0.phone!.isEmpty }
    }
    
    var studentsInGroups: [Student] {
        students.filter { !$0.groups.isEmpty }
    }
    
    // Статистика
    var statistics: (total: Int, active: Int, withPhone: Int, inGroups: Int) {
        (
            total: students.count,
            active: activeStudents.count,
            withPhone: studentsWithPhone.count,
            inGroups: studentsInGroups.count
        )
    }
}
```

### Шаг 4: Создай UI

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = StudentsViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                if viewModel.isLoading {
                    ProgressView("Загрузка студентов...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.error {
                    ErrorView(error: error) {
                        viewModel.loadStudents()
                    }
                } else {
                    StudentsListView(students: viewModel.students)
                }
            }
            .navigationTitle("Студенты")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Обновить") {
                        viewModel.loadStudents()
                    }
                }
            }
        }
        .onAppear {
            viewModel.loadStudents()
        }
    }
}

// Список студентов
struct StudentsListView: View {
    let students: [Student]
    
    var body: some View {
        List(students, id: \.id) { student in
            StudentRowView(student: student)
        }
    }
}

// Строка студента
struct StudentRowView: View {
    let student: Student
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text(student.name)
                        .font(.headline)
                    
                    if let phone = student.phone, !phone.isEmpty {
                        Text(phone)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                // Статус
                Text(student.isActive ? "Активен" : "Неактивен")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(student.isActive ? Color.green : Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            
            // Группы
            if !student.groups.isEmpty {
                Text("Группы: \(student.groups.map { $0.name }.joined(separator: ", "))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Text("Нет групп")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// Ошибка
struct ErrorView: View {
    let error: Error
    let retryAction: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.red)
            
            Text("Ошибка загрузки")
                .font(.headline)
            
            Text(error.localizedDescription)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Повторить") {
                retryAction()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
```

## 🔧 Настройка проекта

### 1. Добавь в Info.plist разрешения для сети:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 2. Для iOS 15+ используй async/await:

```swift
// В ViewModel
func loadStudents() {
    Task {
        do {
            let students = try await networkService.fetchStudents()
            await MainActor.run {
                self.students = students
            }
        } catch {
            await MainActor.run {
                self.error = error
            }
        }
    }
}
```

## 📱 Дополнительные возможности

### Расширения для удобства:

```swift
extension Student {
    var displayName: String {
        if let phone = phone, !phone.isEmpty {
            return "\(name) (\(phone))"
        }
        return name
    }
    
    var groupsString: String {
        if groups.isEmpty {
            return "Нет групп"
        }
        return groups.map { $0.name }.joined(separator: ", ")
    }
    
    var formattedCreatedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        if let date = formatter.date(from: createdAt) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            displayFormatter.locale = Locale(identifier: "ru_RU")
            return displayFormatter.string(from: date)
        }
        
        return createdAt
    }
}
```

### Поиск и фильтрация:

```swift
struct StudentsListView: View {
    let students: [Student]
    @State private var searchText = ""
    @State private var showOnlyActive = false
    
    var filteredStudents: [Student] {
        var filtered = students
        
        if showOnlyActive {
            filtered = filtered.filter { $0.isActive }
        }
        
        if !searchText.isEmpty {
            filtered = filtered.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        }
        
        return filtered
    }
    
    var body: some View {
        VStack {
            // Поиск
            TextField("Поиск по имени...", text: $searchText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            
            // Фильтр
            Toggle("Только активные", isOn: $showOnlyActive)
                .padding(.horizontal)
            
            // Список
            List(filteredStudents, id: \.id) { student in
                StudentRowView(student: student)
            }
        }
    }
}
```

## 🎯 Простой алгоритм для Swift

1. **Создай модели** (Student, Group, LoginResponse)
2. **Создай сетевой сервис** (StudentsNetworkService)
3. **Создай ViewModel** (StudentsViewModel)
4. **Создай UI** (ContentView, StudentsListView)
5. **Добавь обработку ошибок**
6. **Протестируй**

## 💡 Советы для Swift

- **Используй async/await** вместо completion handlers
- **Обновляй UI в MainActor** - `@MainActor` или `await MainActor.run`
- **Обрабатывай ошибки** с помощью `do-catch`
- **Используй @Published** для автоматического обновления UI
- **Добавь индикаторы загрузки** для лучшего UX

## 🚀 Готовые файлы

Я создал для тебя готовые Swift файлы:
- `StudentModels.swift` - модели данных
- `StudentsNetworkService.swift` - сетевой сервис  
- `StudentsUIComponents.swift` - UI компоненты

Просто скопируй их в свой проект и настрой учетные данные!

Удачи с разработкой! 🎉 