import SwiftUI

struct StatisticsView: View {
    let goals: [Goal]
    let habits: [Habit]
    
    @State private var selectedPeriod: Period = .week
    
    enum Period: String, CaseIterable {
        case week = "Týden"
        case month = "Měsíc"
        case year = "Rok"
    }
    
    private var completedGoals: Int {
        goals.filter { $0.status == "completed" }.count
    }
    
    private var totalStreak: Int {
        habits.compactMap { $0.streak }.reduce(0, +)
    }
    
    private var averageStreak: Double {
        guard !habits.isEmpty else { return 0 }
        return Double(totalStreak) / Double(habits.count)
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Statistiky")
                            .font(.largeTitle.bold())
                        Text("Přehled vašeho pokroku")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Picker("Období", selection: $selectedPeriod) {
                        ForEach(Period.allCases, id: \.self) { period in
                            Text(period.rawValue).tag(period)
                        }
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 250)
                }
                
                // Overview cards
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    OverviewCard(
                        title: "Celkem cílů",
                        value: "\(goals.count)",
                        subtitle: "\(completedGoals) dokončených",
                        icon: "target",
                        color: .blue
                    )
                    
                    OverviewCard(
                        title: "Aktivní návyky",
                        value: "\(habits.count)",
                        subtitle: "Průměrný streak: \(String(format: "%.1f", averageStreak))",
                        icon: "repeat.circle.fill",
                        color: .green
                    )
                    
                    OverviewCard(
                        title: "Nejdelší streak",
                        value: "\(habits.compactMap { $0.maxStreak }.max() ?? 0)",
                        subtitle: "dní v řadě",
                        icon: "flame.fill",
                        color: .orange
                    )
                    
                    OverviewCard(
                        title: "Úspěšnost",
                        value: "\(Int(calculateSuccessRate() * 100))%",
                        subtitle: "za \(selectedPeriod.rawValue.lowercased())",
                        icon: "chart.line.uptrend.xyaxis",
                        color: .purple
                    )
                }
                
                // Charts section
                HStack(spacing: 16) {
                    // Habits completion chart
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Plnění návyků")
                            .font(.headline)
                        
                        // Simple bar chart
                        HStack(alignment: .bottom, spacing: 8) {
                            ForEach(0..<7, id: \.self) { day in
                                VStack(spacing: 4) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.orange)
                                        .frame(width: 30, height: CGFloat.random(in: 40...120))
                                    
                                    Text(dayLabel(day))
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .frame(height: 150)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white)
                            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
                    )
                    
                    // Goals progress
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Pokrok cílů")
                            .font(.headline)
                        
                        VStack(spacing: 12) {
                            GoalProgressRow(label: "Aktivní", count: goals.filter { $0.status == "active" }.count, total: goals.count, color: .blue)
                            GoalProgressRow(label: "Dokončené", count: completedGoals, total: goals.count, color: .green)
                            GoalProgressRow(label: "Pozastavené", count: goals.filter { $0.status == "paused" }.count, total: goals.count, color: .gray)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white)
                            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
                    )
                }
                
                // Habits streaks
                VStack(alignment: .leading, spacing: 16) {
                    Text("Streaky návyků")
                        .font(.headline)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        ForEach(habits.sorted { ($0.streak ?? 0) > ($1.streak ?? 0) }) { habit in
                            HabitStreakCard(habit: habit)
                        }
                    }
                }
            }
            .padding(24)
        }
    }
    
    private func calculateSuccessRate() -> Double {
        // Simplified calculation
        guard !habits.isEmpty else { return 0 }
        let avgStreak = averageStreak
        return min(avgStreak / 7.0, 1.0)
    }
    
    private func dayLabel(_ day: Int) -> String {
        let days = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
        return days[day]
    }
}

struct OverviewCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Spacer()
            }
            
            Text(value)
                .font(.system(size: 32, weight: .bold, design: .rounded))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary.opacity(0.8))
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
        )
    }
}

struct GoalProgressRow: View {
    let label: String
    let count: Int
    let total: Int
    let color: Color
    
    private var progress: Double {
        guard total > 0 else { return 0 }
        return Double(count) / Double(total)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.subheadline)
                Spacer()
                Text("\(count)")
                    .font(.subheadline.bold())
                    .foregroundColor(color)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.1))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * progress)
                }
            }
            .frame(height: 6)
        }
    }
}

struct HabitStreakCard: View {
    let habit: Habit
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.1))
                    .frame(width: 44, height: 44)
                
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(habit.name)
                    .font(.subheadline)
                    .lineLimit(1)
                
                HStack(spacing: 4) {
                    Text("\(habit.streak ?? 0)")
                        .font(.headline.bold())
                        .foregroundColor(.orange)
                    Text("/ \(habit.maxStreak ?? 0) max")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
    }
}

#Preview {
    StatisticsView(goals: MainAppView.demoGoals, habits: MainAppView.demoHabits)
}

