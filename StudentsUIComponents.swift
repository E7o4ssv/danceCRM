import SwiftUI

// MARK: - UI Компоненты для отображения студентов

// Карточка студента
struct StudentCardView: View {
    let student: Student
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text(student.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    if let phone = student.phone, !phone.isEmpty {
                        Text(phone)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                StatusBadgeView(isActive: student.isActive)
            }
            
            if !student.groups.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Группы:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    ForEach(student.groups, id: \.id) { group in
                        GroupChipView(group: group)
                    }
                }
            } else {
                Text("Нет групп")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text("Создан: \(student.formattedCreatedDate)")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// Бейдж статуса
struct StatusBadgeView: View {
    let isActive: Bool
    
    var body: some View {
        Text(isActive ? "Активен" : "Неактивен")
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(isActive ? Color.green : Color.red)
            .foregroundColor(.white)
            .cornerRadius(8)
    }
}

// Чип группы
struct GroupChipView: View {
    let group: Group
    
    var body: some View {
        HStack {
            Text(group.name)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.blue.opacity(0.2))
                .foregroundColor(.blue)
                .cornerRadius(6)
            
            Text("\(group.room) • \(group.russianDayOfWeek) • \(group.time)")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

// Статистика
struct StatisticsView: View {
    let statistics: StudentsStatistics
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Статистика")
                .font(.title2)
                .fontWeight(.bold)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatCardView(
                    title: "Всего",
                    value: "\(statistics.totalStudents)",
                    color: .blue
                )
                
                StatCardView(
                    title: "Активных",
                    value: "\(statistics.activeStudents)",
                    color: .green
                )
                
                StatCardView(
                    title: "С телефоном",
                    value: "\(statistics.studentsWithPhone)",
                    color: .orange
                )
                
                StatCardView(
                    title: "В группах",
                    value: "\(statistics.studentsInGroups)",
                    color: .purple
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// Карточка статистики
struct StatCardView: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// Список студентов
struct StudentsListView: View {
    let students: [Student]
    @State private var searchText = ""
    @State private var selectedFilter: FilterCriteria = .active
    
    private var filteredStudents: [Student] {
        let dataManager = StudentsDataManager.shared
        let filtered = dataManager.filterStudents(students, by: selectedFilter)
        
        if searchText.isEmpty {
            return filtered
        } else {
            return dataManager.filterStudents(filtered, by: .nameContains(searchText))
        }
    }
    
    var body: some View {
        VStack {
            // Фильтры
            FilterView(selectedFilter: $selectedFilter)
            
            // Поиск
            SearchBar(text: $searchText)
            
            // Список
            List(filteredStudents, id: \.id) { student in
                StudentCardView(student: student)
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }
            .listStyle(PlainListStyle())
        }
    }
}

// Панель фильтров
struct FilterView: View {
    @Binding var selectedFilter: FilterCriteria
    
    private let filters: [(FilterCriteria, String)] = [
        (.active, "Активные"),
        (.withPhone, "С телефоном"),
        (.inGroups, "В группах"),
        (.withoutGroups, "Без групп")
    ]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(filters, id: \.0) { filter, title in
                    FilterChipView(
                        title: title,
                        isSelected: selectedFilter == filter
                    ) {
                        selectedFilter = filter
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

// Чип фильтра
struct FilterChipView: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}

// Поисковая строка
struct SearchBar: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Поиск по имени...", text: $text)
                .textFieldStyle(PlainTextFieldStyle())
            
            if !text.isEmpty {
                Button("Очистить") {
                    text = ""
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

// Детальная информация о студенте
struct StudentDetailView: View {
    let student: Student
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Основная информация
                VStack(alignment: .leading, spacing: 12) {
                    Text("Основная информация")
                        .font(.headline)
                    
                    InfoRowView(title: "Имя", value: student.name)
                    if let phone = student.phone, !phone.isEmpty {
                        InfoRowView(title: "Телефон", value: phone)
                    }
                    InfoRowView(title: "Статус", value: student.statusString)
                    InfoRowView(title: "Создан", value: student.formattedCreatedDate)
                }
                
                // Группы
                if !student.groups.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Группы")
                            .font(.headline)
                        
                        ForEach(student.groups, id: \.id) { group in
                            GroupDetailView(group: group)
                        }
                    }
                } else {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Группы")
                            .font(.headline)
                        
                        Text("Студент не записан в группы")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
        }
        .navigationTitle(student.name)
    }
}

// Строка информации
struct InfoRowView: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// Детальная информация о группе
struct GroupDetailView: View {
    let group: Group
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(group.name)
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 4) {
                InfoRowView(title: "Помещение", value: group.room)
                InfoRowView(title: "День", value: group.russianDayOfWeek)
                InfoRowView(title: "Время", value: group.time)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Пример использования в SwiftUI

/*
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
*/ 