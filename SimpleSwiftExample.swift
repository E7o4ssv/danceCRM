import SwiftUI
import Foundation

// MARK: - Простой пример для быстрого старта

// 1. Модели данных
struct Student: Codable {
    let id: String
    let name: String
    let phone: String?
    let isActive: Bool
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, phone, isActive
    }
}

// 2. Простой сетевой сервис
class SimpleNetworkService {
    static let shared = SimpleNetworkService()
    private var token: String?
    
    func login() async throws {
        let url = URL(string: "http://89.104.71.170:5000/api/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let credentials = ["username": "admin", "password": "admin123"]
        request.httpBody = try JSONSerialization.data(withJSONObject: credentials)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(LoginResponse.self, from: data)
        self.token = response.token
    }
    
    func fetchStudents() async throws -> [Student] {
        guard let token = token else {
            throw NetworkError.notAuthenticated
        }
        
        let url = URL(string: "http://89.104.71.170:5000/api/students")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([Student].self, from: data)
    }
}

struct LoginResponse: Codable {
    let token: String
}

enum NetworkError: Error {
    case notAuthenticated
}

// 3. Простой ViewModel
@MainActor
class SimpleViewModel: ObservableObject {
    @Published var students: [Student] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let networkService = SimpleNetworkService.shared
    
    func loadStudents() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await networkService.login()
                let students = try await networkService.fetchStudents()
                self.students = students
                self.isLoading = false
            } catch {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}

// 4. Простой UI
struct SimpleContentView: View {
    @StateObject private var viewModel = SimpleViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                if viewModel.isLoading {
                    ProgressView("Загрузка...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.errorMessage {
                    VStack {
                        Text("Ошибка: \(error)")
                            .foregroundColor(.red)
                        Button("Повторить") {
                            viewModel.loadStudents()
                        }
                    }
                } else {
                    List(viewModel.students, id: \.id) { student in
                        VStack(alignment: .leading) {
                            Text(student.name)
                                .font(.headline)
                            if let phone = student.phone {
                                Text(phone)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            Text(student.isActive ? "Активен" : "Неактивен")
                                .font(.caption)
                                .foregroundColor(student.isActive ? .green : .red)
                        }
                    }
                }
            }
            .navigationTitle("Студенты")
            .toolbar {
                Button("Обновить") {
                    viewModel.loadStudents()
                }
            }
        }
        .onAppear {
            viewModel.loadStudents()
        }
    }
}

// MARK: - Как использовать

/*
1. Скопируй этот код в новый Swift файл в Xcode
2. Создай новый SwiftUI проект
3. Замени ContentView на SimpleContentView
4. Добавь в Info.plist:
   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <true/>
   </dict>
5. Запусти приложение

Результат: Приложение загрузит список студентов с сервера и отобразит их в списке.
*/

// MARK: - Расширенный пример с деталями

struct StudentDetailView: View {
    let student: Student
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Имя: \(student.name)")
                .font(.title2)
            
            if let phone = student.phone {
                Text("Телефон: \(phone)")
                    .font(.body)
            }
            
            Text("Статус: \(student.isActive ? "Активен" : "Неактивен")")
                .font(.body)
                .foregroundColor(student.isActive ? .green : .red)
            
            Spacer()
        }
        .padding()
        .navigationTitle("Детали студента")
    }
}

// MARK: - Пример с поиском

struct StudentsWithSearchView: View {
    @StateObject private var viewModel = SimpleViewModel()
    @State private var searchText = ""
    
    var filteredStudents: [Student] {
        if searchText.isEmpty {
            return viewModel.students
        } else {
            return viewModel.students.filter { 
                $0.name.localizedCaseInsensitiveContains(searchText) 
            }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                TextField("Поиск по имени...", text: $searchText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding()
                
                List(filteredStudents, id: \.id) { student in
                    NavigationLink(destination: StudentDetailView(student: student)) {
                        VStack(alignment: .leading) {
                            Text(student.name)
                                .font(.headline)
                            if let phone = student.phone {
                                Text(phone)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Студенты (\(filteredStudents.count))")
            .toolbar {
                Button("Обновить") {
                    viewModel.loadStudents()
                }
            }
        }
        .onAppear {
            viewModel.loadStudents()
        }
    }
}

// MARK: - Пример с статистикой

struct StudentsWithStatsView: View {
    @StateObject private var viewModel = SimpleViewModel()
    
    var stats: (total: Int, active: Int, withPhone: Int) {
        let total = viewModel.students.count
        let active = viewModel.students.filter { $0.isActive }.count
        let withPhone = viewModel.students.filter { $0.phone != nil }.count
        return (total, active, withPhone)
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // Статистика
                HStack {
                    VStack {
                        Text("\(stats.total)")
                            .font(.title)
                            .fontWeight(.bold)
                        Text("Всего")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                    
                    VStack {
                        Text("\(stats.active)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        Text("Активных")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                    
                    VStack {
                        Text("\(stats.withPhone)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                        Text("С телефоном")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .padding()
                
                // Список
                List(viewModel.students, id: \.id) { student in
                    VStack(alignment: .leading) {
                        Text(student.name)
                            .font(.headline)
                        if let phone = student.phone {
                            Text(phone)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        Text(student.isActive ? "Активен" : "Неактивен")
                            .font(.caption)
                            .foregroundColor(student.isActive ? .green : .red)
                    }
                }
            }
            .navigationTitle("Студенты")
            .toolbar {
                Button("Обновить") {
                    viewModel.loadStudents()
                }
            }
        }
        .onAppear {
            viewModel.loadStudents()
        }
    }
} 