import Foundation

// MARK: - Сетевой сервис для работы с API

class StudentsNetworkService {
    static let shared = StudentsNetworkService()
    
    private let baseURL = "http://89.104.71.170:5000"
    private var authToken: String?
    
    private init() {}
    
    // MARK: - Авторизация
    
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
    
    // MARK: - Получение данных студентов
    
    func fetchStudents() async throws -> StudentsResponse {
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
            return try StudentsDataManager.shared.parseStudents(from: data)
        case 401:
            throw NetworkError.unauthorized
        case 403:
            throw NetworkError.forbidden
        default:
            throw NetworkError.serverError(httpResponse.statusCode)
        }
    }
    
    // MARK: - Получение групп
    
    func fetchGroups() async throws -> [Group] {
        guard let token = authToken else {
            throw NetworkError.notAuthenticated
        }
        
        let url = URL(string: "\(baseURL)/api/groups")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode([Group].self, from: data)
    }
    
    // MARK: - Проверка здоровья сервера
    
    func checkServerHealth() async throws -> HealthResponse {
        let url = URL(string: "\(baseURL)/api/health")!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(HealthResponse.self, from: data)
    }
}

// MARK: - Модели для сетевых запросов

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

struct HealthResponse: Codable {
    let status: String
    let timestamp: String
    let uptime: Double
    let environment: String
}

// MARK: - Ошибки сети

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

// MARK: - Пример использования

/*
// Пример использования в iOS приложении:

class StudentsViewController: UIViewController {
    private let networkService = StudentsNetworkService.shared
    private let dataManager = StudentsDataManager.shared
    
    override func viewDidLoad() {
        super.viewDidLoad()
        loadStudents()
    }
    
    private func loadStudents() {
        Task {
            do {
                // 1. Авторизация
                let token = try await networkService.authenticate(
                    username: "admin",
                    password: "admin123"
                )
                print("Авторизация успешна")
                
                // 2. Получение данных студентов
                let response = try await networkService.fetchStudents()
                let students = response.students
                
                // 3. Обработка данных в главном потоке
                await MainActor.run {
                    self.displayStudents(students)
                }
                
            } catch {
                await MainActor.run {
                    self.showError(error)
                }
            }
        }
    }
    
    private func displayStudents(_ students: [Student]) {
        // Получение статистики
        let statistics = dataManager.getStatistics(from: students)
        print("Всего студентов: \(statistics.totalStudents)")
        
        // Группировка
        let grouped = dataManager.getGroupedStudents(from: students)
        
        // Фильтрация активных студентов
        let activeStudents = dataManager.filterStudents(students, by: .active)
        
        // Обновление UI
        updateUI(with: students, statistics: statistics, grouped: grouped)
    }
    
    private func updateUI(with students: [Student], statistics: StudentsStatistics, grouped: GroupedStudents) {
        // Обновление UI элементов
        // Например, обновление таблицы, лейблов со статистикой и т.д.
    }
    
    private func showError(_ error: Error) {
        let alert = UIAlertController(
            title: "Ошибка",
            message: error.localizedDescription,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
*/ 