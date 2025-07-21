import Foundation

// MARK: - Основные модели

// Модель для группы
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

// Модель для студента
struct Student: Codable {
    let id: String
    let name: String
    let phone: String?
    let groups: [Group]
    let isActive: Bool
    let createdAt: String
    let version: Int
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, phone, groups, isActive, createdAt
        case version = "__v"
    }
}

// Модель для ответа API
struct StudentsResponse: Codable {
    let server: String
    let timestamp: String
    let total: Int
    let students: [Student]
}

// MARK: - Дополнительные модели для удобства

// Модель для статистики
struct StudentsStatistics {
    let totalStudents: Int
    let activeStudents: Int
    let studentsWithPhone: Int
    let studentsInGroups: Int
    let studentsWithoutGroups: Int
    
    init(from students: [Student]) {
        self.totalStudents = students.count
        self.activeStudents = students.filter { $0.isActive }.count
        self.studentsWithPhone = students.filter { $0.phone != nil && !$0.phone!.isEmpty }.count
        self.studentsInGroups = students.filter { !$0.groups.isEmpty }.count
        self.studentsWithoutGroups = students.filter { $0.groups.isEmpty }.count
    }
}

// Модель для группировки студентов
struct GroupedStudents {
    let studentsByGroup: [String: [Student]]
    let studentsWithoutGroup: [Student]
    
    init(from students: [Student]) {
        var grouped: [String: [Student]] = [:]
        
        for student in students {
            for group in student.groups {
                if grouped[group.name] == nil {
                    grouped[group.name] = []
                }
                grouped[group.name]?.append(student)
            }
        }
        
        self.studentsByGroup = grouped
        self.studentsWithoutGroup = students.filter { $0.groups.isEmpty }
    }
}

// MARK: - Расширения для удобства

extension Student {
    // Форматированная дата создания
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
    
    // Полное имя с телефоном
    var displayName: String {
        if let phone = phone, !phone.isEmpty {
            return "\(name) (\(phone))"
        }
        return name
    }
    
    // Список групп в виде строки
    var groupsString: String {
        if groups.isEmpty {
            return "Нет групп"
        }
        return groups.map { $0.name }.joined(separator: ", ")
    }
    
    // Статус активности
    var statusString: String {
        return isActive ? "Активен" : "Неактивен"
    }
}

extension Group {
    // Полная информация о группе
    var fullInfo: String {
        return "\(name) - \(room) (\(dayOfWeek), \(time))"
    }
    
    // Форматированное время
    var formattedTime: String {
        return time
    }
    
    // Русское название дня недели
    var russianDayOfWeek: String {
        let days: [String: String] = [
            "monday": "Понедельник",
            "tuesday": "Вторник", 
            "wednesday": "Среда",
            "thursday": "Четверг",
            "friday": "Пятница",
            "saturday": "Суббота",
            "sunday": "Воскресенье"
        ]
        return days[dayOfWeek] ?? dayOfWeek
    }
}

// MARK: - Утилиты для работы с данными

class StudentsDataManager {
    static let shared = StudentsDataManager()
    
    private init() {}
    
    // Парсинг JSON данных
    func parseStudents(from jsonData: Data) throws -> StudentsResponse {
        let decoder = JSONDecoder()
        return try decoder.decode(StudentsResponse.self, from: jsonData)
    }
    
    // Парсинг из JSON строки
    func parseStudents(from jsonString: String) throws -> StudentsResponse {
        guard let data = jsonString.data(using: .utf8) else {
            throw NSError(domain: "StudentsDataManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON string"])
        }
        return try parseStudents(from: data)
    }
    
    // Получение статистики
    func getStatistics(from students: [Student]) -> StudentsStatistics {
        return StudentsStatistics(from: students)
    }
    
    // Группировка студентов
    func getGroupedStudents(from students: [Student]) -> GroupedStudents {
        return GroupedStudents(from: students)
    }
    
    // Фильтрация студентов
    func filterStudents(_ students: [Student], by criteria: FilterCriteria) -> [Student] {
        return students.filter { student in
            switch criteria {
            case .active:
                return student.isActive
            case .withPhone:
                return student.phone != nil && !student.phone!.isEmpty
            case .inGroups:
                return !student.groups.isEmpty
            case .withoutGroups:
                return student.groups.isEmpty
            case .nameContains(let text):
                return student.name.localizedCaseInsensitiveContains(text)
            case .groupName(let groupName):
                return student.groups.contains { $0.name.localizedCaseInsensitiveContains(groupName) }
            }
        }
    }
}

// MARK: - Перечисления для фильтрации

enum FilterCriteria {
    case active
    case withPhone
    case inGroups
    case withoutGroups
    case nameContains(String)
    case groupName(String)
}

// MARK: - Пример использования

/*
// Пример использования в iOS приложении:

// 1. Парсинг данных
let jsonString = """
{
  "server": "http://89.104.71.170:5000",
  "timestamp": "2025-07-17T16:01:30.178Z",
  "total": 5,
  "students": [...]
}
"""

do {
    let response = try StudentsDataManager.shared.parseStudents(from: jsonString)
    let students = response.students
    
    // 2. Получение статистики
    let statistics = StudentsDataManager.shared.getStatistics(from: students)
    print("Всего студентов: \(statistics.totalStudents)")
    print("Активных: \(statistics.activeStudents)")
    
    // 3. Группировка
    let grouped = StudentsDataManager.shared.getGroupedStudents(from: students)
    print("Студентов без групп: \(grouped.studentsWithoutGroup.count)")
    
    // 4. Фильтрация
    let activeStudents = StudentsDataManager.shared.filterStudents(students, by: .active)
    let studentsWithPhone = StudentsDataManager.shared.filterStudents(students, by: .withPhone)
    
    // 5. Отображение данных
    for student in students {
        print("\(student.displayName) - \(student.statusString)")
        print("Группы: \(student.groupsString)")
        print("Создан: \(student.formattedCreatedDate)")
        print("---")
    }
    
} catch {
    print("Ошибка парсинга: \(error)")
}
*/ 