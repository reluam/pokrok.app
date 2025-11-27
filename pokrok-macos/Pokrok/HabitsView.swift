import SwiftUI

struct HabitsView: View {
    @Binding var habits: [Habit]
    @EnvironmentObject var apiManager: APIManager
    
    @State private var showingAddHabit = false
    @State private var selectedHabit: Habit?
    @State private var filterFrequency: String? = nil
    
    private var filteredHabits: [Habit] {
        if let frequency = filterFrequency {
            return habits.filter { $0.frequency == frequency }
        }
        return habits
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Návyky")
                        .font(.largeTitle.bold())
                    Text("\(habits.count) celkem • Nejdelší streak: \(habits.compactMap { $0.maxStreak }.max() ?? 0) dní")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Filter
                Picker("Frekvence", selection: $filterFrequency) {
                    Text("Všechny").tag(nil as String?)
                    Text("Denní").tag("daily" as String?)
                    Text("Týdenní").tag("weekly" as String?)
                    Text("Měsíční").tag("monthly" as String?)
                }
                .pickerStyle(.segmented)
                .frame(width: 280)
                
                Button(action: { showingAddHabit = true }) {
                    Label("Přidat návyk", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
            .padding(24)
            
            Divider()
            
            // Habits grid
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    ForEach(filteredHabits) { habit in
                        HabitCardLarge(habit: habit, onComplete: {
                            completeHabit(habit)
                        }, onSelect: {
                            selectedHabit = habit
                        })
                    }
                }
                .padding(24)
            }
        }
        .sheet(isPresented: $showingAddHabit) {
            AddHabitSheet(habits: $habits)
        }
        .sheet(item: $selectedHabit) { habit in
            HabitDetailSheet(habit: habit, habits: $habits)
        }
    }
    
    private func completeHabit(_ habit: Habit) {
        if let index = habits.firstIndex(where: { $0.id == habit.id }) {
            var updatedHabit = habit
            updatedHabit.lastCompleted = Date()
            updatedHabit.streak = (updatedHabit.streak ?? 0) + 1
            if (updatedHabit.streak ?? 0) > (updatedHabit.maxStreak ?? 0) {
                updatedHabit.maxStreak = updatedHabit.streak
            }
            habits[index] = updatedHabit
            
            // Sync with API
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let dateString = dateFormatter.string(from: Date())
            
            Task {
                try? await apiManager.completeHabit(habit.id, date: dateString)
            }
        }
    }
}

struct HabitCardLarge: View {
    let habit: Habit
    let onComplete: () -> Void
    let onSelect: () -> Void
    
    @State private var isHovering = false
    @State private var isCompletedToday = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(habit.name)
                        .font(.headline)
                        .lineLimit(1)
                    
                    Text(habit.category ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                difficultyBadge
            }
            
            // Description
            Text(habit.description ?? "")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            Spacer()
            
            // Stats
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                        Text("\(habit.streak ?? 0)")
                            .font(.title3.bold())
                    }
                    Text("Aktuální streak")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(habit.maxStreak ?? 0)")
                        .font(.title3.bold())
                        .foregroundColor(.blue)
                    Text("Nejlepší")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // Complete button
            Button(action: {
                withAnimation(.spring(response: 0.3)) {
                    isCompletedToday = true
                    onComplete()
                }
            }) {
                HStack {
                    Image(systemName: isCompletedToday ? "checkmark.circle.fill" : "circle")
                    Text(isCompletedToday ? "Splněno" : "Označit jako splněné")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(isCompletedToday ? Color.green : Color.orange)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .buttonStyle(.plain)
            .disabled(isCompletedToday)
        }
        .padding(16)
        .frame(height: 220)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: .black.opacity(isHovering ? 0.15 : 0.08), radius: isHovering ? 12 : 6, x: 0, y: 4)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
        .onTapGesture {
            onSelect()
        }
        .onAppear {
            checkIfCompletedToday()
        }
    }
    
    private var difficultyBadge: some View {
        Text((habit.difficulty ?? "medium").capitalized)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(difficultyColor.opacity(0.1))
            .foregroundColor(difficultyColor)
            .cornerRadius(4)
    }
    
    private var difficultyColor: Color {
        switch habit.difficulty {
        case "easy": return .green
        case "hard": return .red
        default: return .orange
        }
    }
    
    private func checkIfCompletedToday() {
        if let lastCompleted = habit.lastCompleted {
            isCompletedToday = Calendar.current.isDateInToday(lastCompleted)
        }
    }
}

struct AddHabitSheet: View {
    @Binding var habits: [Habit]
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var apiManager: APIManager
    @EnvironmentObject var authManager: AuthManager
    
    @State private var name = ""
    @State private var description = ""
    @State private var category = "Zdraví"
    @State private var frequency: Frequency = .daily
    @State private var difficulty: Difficulty = .medium
    
    let categories = ["Zdraví", "Mindfulness", "Vzdělání", "Produktivita", "Fitness", "Vztahy"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Nový návyk")
                    .font(.title2.bold())
                Spacer()
                Button("Zrušit") { dismiss() }
                    .buttonStyle(.plain)
            }
            .padding()
            
            Divider()
            
            Form {
                Section {
                    TextField("Název návyku", text: $name)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Popis", text: $description, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)
                }
                
                Section {
                    Picker("Kategorie", selection: $category) {
                        ForEach(categories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                    
                    Picker("Frekvence", selection: $frequency) {
                        Text("Denně").tag(Frequency.daily)
                        Text("Týdně").tag(Frequency.weekly)
                        Text("Vlastní").tag(Frequency.custom)
                    }
                    .pickerStyle(.segmented)
                    
                    Picker("Obtížnost", selection: $difficulty) {
                        Text("Lehká").tag(Difficulty.easy)
                        Text("Střední").tag(Difficulty.medium)
                        Text("Těžká").tag(Difficulty.hard)
                    }
                    .pickerStyle(.segmented)
                }
            }
            .formStyle(.grouped)
            .padding()
            
            Divider()
            
            // Footer
            HStack {
                Spacer()
                Button("Vytvořit návyk") {
                    createHabit()
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                .disabled(name.isEmpty)
            }
            .padding()
        }
        .frame(width: 500, height: 420)
    }
    
    private func createHabit() {
        let newHabit = Habit(
            id: UUID().uuidString,
            name: name,
            description: description,
            frequency: frequency.rawValue,
            streak: 0,
            maxStreak: 0,
            lastCompleted: nil,
            category: category,
            difficulty: difficulty.rawValue,
            isCustom: true,
            createdAt: Date()
        )
        
        habits.append(newHabit)
        
        // Sync with API
        if let userId = authManager.userId {
            Task {
                try? await apiManager.createHabit(newHabit, userId: userId)
            }
        }
        
        dismiss()
    }
}

struct HabitDetailSheet: View {
    let habit: Habit
    @Binding var habits: [Habit]
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(habit.name)
                        .font(.title2.bold())
                    Text(habit.category ?? "")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Button("Zavřít") { dismiss() }
                    .buttonStyle(.plain)
            }
            .padding()
            
            Divider()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(habit.description ?? "")
                        .foregroundColor(.secondary)
                    
                    // Stats grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        StatCard(title: "Aktuální streak", value: "\(habit.streak)", icon: "flame.fill", color: .orange)
                        StatCard(title: "Nejlepší streak", value: "\(habit.maxStreak)", icon: "trophy.fill", color: .yellow)
                        StatCard(title: "Frekvence", value: (habit.frequency ?? "daily").capitalized, icon: "repeat", color: .blue)
                    }
                    
                    Divider()
                    
                    Text("Historie")
                        .font(.headline)
                    
                    Text("Zde bude kalendář s historií plnění...")
                        .foregroundColor(.secondary)
                }
                .padding()
            }
        }
        .frame(width: 550, height: 450)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title.bold())
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(color.opacity(0.1))
        )
    }
}

#Preview {
    HabitsView(habits: .constant(MainAppView.demoHabits))
        .environmentObject(APIManager())
        .environmentObject(AuthManager())
}

