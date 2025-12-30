import SwiftUI

struct HabitDetailView: View {
    let habit: Habit
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var aspirations: [Aspiration] = []
    
    // Editing states
    @State private var editingName: String
    @State private var editingDescription: String
    @State private var editingFrequency: String
    @State private var editingSelectedDays: [String]
    @State private var editingAlwaysShow: Bool
    @State private var editingReminderTime: String
    @State private var editingNotificationEnabled: Bool
    @State private var editingAreaId: String?
    
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    
    init(habit: Habit) {
        self.habit = habit
        self._editingName = State(initialValue: habit.name)
        self._editingDescription = State(initialValue: habit.description ?? "")
        self._editingFrequency = State(initialValue: habit.frequency)
        self._editingSelectedDays = State(initialValue: habit.selectedDays ?? [])
        self._editingAlwaysShow = State(initialValue: habit.alwaysShow)
        self._editingReminderTime = State(initialValue: habit.reminderTime ?? "09:00")
        self._editingNotificationEnabled = State(initialValue: habit.reminderTime != nil)
        self._editingAreaId = State(initialValue: habit.aspirationId)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.lg) {
                    // Basic Information Card
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Název")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            TextField("Název návyku", text: $editingName)
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                                .padding(DesignSystem.Spacing.sm)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                )
                                .cornerRadius(DesignSystem.CornerRadius.sm)
                        }
                        
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Popis")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            TextEditor(text: $editingDescription)
                                .font(DesignSystem.Typography.body)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                                .frame(minHeight: 80)
                                .padding(DesignSystem.Spacing.sm)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                )
                                .cornerRadius(DesignSystem.CornerRadius.sm)
                        }
                        
                        // Area
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Oblast")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            Picker("Oblast", selection: Binding(
                                get: { editingAreaId ?? "" },
                                set: { editingAreaId = $0.isEmpty ? nil : $0 }
                            )) {
                                Text("Bez oblasti").tag("")
                                ForEach(aspirations, id: \.id) { aspiration in
                                    Text(aspiration.title).tag(aspiration.id)
                                }
                            }
                            .pickerStyle(.menu)
                            .tint(DesignSystem.Colors.dynamicPrimary)
                            .padding(DesignSystem.Spacing.sm)
                            .background(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.sm)
                        }
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.md)
                    .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
                    
                    // Frequency Card
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        Text("Frekvence")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        Picker("Frekvence", selection: $editingFrequency) {
                            Text("Denně").tag("daily")
                            Text("Týdně").tag("weekly")
                            Text("Měsíčně").tag("monthly")
                        }
                        .pickerStyle(.segmented)
                        .tint(DesignSystem.Colors.dynamicPrimary)
                        
                        // Selected days for weekly/monthly
                        if editingFrequency == "weekly" || editingFrequency == "monthly" {
                            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                                Text(editingFrequency == "weekly" ? "Vyberte dny v týdnu" : "Vyberte dny v měsíci")
                                    .font(DesignSystem.Typography.caption)
                                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                
                                if editingFrequency == "weekly" {
                                    // Weekly days
                                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: DesignSystem.Spacing.sm) {
                                        ForEach(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], id: \.self) { day in
                                            let dayLabels: [String: String] = [
                                                "monday": "Po",
                                                "tuesday": "Út",
                                                "wednesday": "St",
                                                "thursday": "Čt",
                                                "friday": "Pá",
                                                "saturday": "So",
                                                "sunday": "Ne"
                                            ]
                                            let isSelected = editingSelectedDays.contains(day)
                                            
                                            Button(action: {
                                                if isSelected {
                                                    editingSelectedDays.removeAll { $0 == day }
                                                } else {
                                                    editingSelectedDays.append(day)
                                                }
                                            }) {
                                                Text(dayLabels[day] ?? day)
                                                    .font(DesignSystem.Typography.caption)
                                                    .fontWeight(.medium)
                                                    .foregroundColor(isSelected ? .white : DesignSystem.Colors.dynamicPrimary)
                                                    .frame(maxWidth: .infinity)
                                                    .padding(.vertical, DesignSystem.Spacing.xs)
                                                    .background(isSelected ? DesignSystem.Colors.dynamicPrimary : Color.white)
                                                    .overlay(
                                                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                                    )
                                                    .cornerRadius(DesignSystem.CornerRadius.sm)
                                            }
                                            .buttonStyle(PlainButtonStyle())
                                        }
                                    }
                                } else {
                                    // Monthly days (1-31)
                                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: DesignSystem.Spacing.xs) {
                                        ForEach(1...31, id: \.self) { day in
                                            let dayStr = String(day)
                                            let isSelected = editingSelectedDays.contains(dayStr)
                                            
                                            Button(action: {
                                                if isSelected {
                                                    editingSelectedDays.removeAll { $0 == dayStr }
                                                } else {
                                                    editingSelectedDays.append(dayStr)
                                                }
                                            }) {
                                                Text(dayStr)
                                                    .font(DesignSystem.Typography.caption2)
                                                    .fontWeight(.medium)
                                                    .foregroundColor(isSelected ? .white : DesignSystem.Colors.dynamicPrimary)
                                                    .frame(width: 32, height: 32)
                                                    .background(isSelected ? DesignSystem.Colors.dynamicPrimary : Color.white)
                                                    .overlay(
                                                        RoundedRectangle(cornerRadius: 4)
                                                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                                    )
                                                    .cornerRadius(4)
                                            }
                                            .buttonStyle(PlainButtonStyle())
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Always show toggle
                        Toggle("Vždy zobrazovat (i když není naplánováno)", isOn: $editingAlwaysShow)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .tint(DesignSystem.Colors.dynamicPrimary)
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.md)
                    .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
                    
                    // Reminder Card
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        Text("Upozornění")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        HStack {
                            DatePicker("Čas", selection: Binding(
                                get: {
                                    let components = editingReminderTime.split(separator: ":")
                                    let hour = Int(components.first ?? "9") ?? 9
                                    let minute = Int(components.last ?? "0") ?? 0
                                    let calendar = Calendar.current
                                    return calendar.date(bySettingHour: hour, minute: minute, second: 0, of: Date()) ?? Date()
                                },
                                set: { date in
                                    let calendar = Calendar.current
                                    let hour = calendar.component(.hour, from: date)
                                    let minute = calendar.component(.minute, from: date)
                                    editingReminderTime = String(format: "%02d:%02d", hour, minute)
                                }
                            ), displayedComponents: .hourAndMinute)
                            .tint(DesignSystem.Colors.dynamicPrimary)
                            
                            Toggle("Povolit", isOn: $editingNotificationEnabled)
                                .tint(DesignSystem.Colors.dynamicPrimary)
                        }
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.md)
                    .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
                    
                    // Action buttons
                    HStack(spacing: DesignSystem.Spacing.md) {
                        // Delete button
                        Button(action: {
                            showDeleteConfirmation = true
                        }) {
                            HStack {
                                Image(systemName: "trash")
                                Text("Smazat")
                            }
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(DesignSystem.Spacing.md)
                            .background(DesignSystem.Colors.redFull)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.redFull, lineWidth: 2)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.md)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .disabled(isDeleting)
                        
                        // Save button
                        Button(action: {
                            saveHabit()
                        }) {
                            HStack {
                                if isSaving {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "checkmark")
                                    Text("Uložit")
                                }
                            }
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(DesignSystem.Spacing.md)
                            .background(DesignSystem.Colors.dynamicPrimary)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.md)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .disabled(isSaving || editingName.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.top, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
        }
        .navigationTitle("Detail návyku")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Hotovo") {
                    dismiss()
                }
            }
        }
        .onAppear {
            loadAspirations()
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .alert("Smazat návyk", isPresented: $showDeleteConfirmation) {
            Button("Zrušit", role: .cancel) { }
            Button("Smazat", role: .destructive) {
                deleteHabit()
            }
        } message: {
            Text("Opravdu chcete smazat tento návyk? Tato akce je nevratná.")
        }
    }
    
    private func loadAspirations() {
        Task {
            do {
                let fetched = try await apiManager.fetchAspirations()
                await MainActor.run {
                    self.aspirations = fetched
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func saveHabit() {
        guard !editingName.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Název návyku je povinný"
            showError = true
            return
        }
        
        isSaving = true
        
        Task {
            do {
                let reminderTime = editingNotificationEnabled ? editingReminderTime : nil
                let selectedDays = (editingFrequency == "daily") ? [] : editingSelectedDays
                
                _ = try await apiManager.updateHabit(
                    habitId: habit.id,
                    name: editingName,
                    description: editingDescription.isEmpty ? nil : editingDescription,
                    frequency: editingFrequency,
                    reminderTime: reminderTime,
                    selectedDays: selectedDays.isEmpty ? nil : selectedDays,
                    alwaysShow: editingAlwaysShow,
                    xpReward: nil,
                    aspirationId: editingAreaId
                )
                
                await MainActor.run {
                    isSaving = false
                    // Reschedule notifications for this habit if reminder time is set
                    if let reminderTime = reminderTime {
                        // Create a temporary habit object with updated values for notification scheduling
                        // We'll use the updated habit from API response if available, otherwise create a mock
                        // For now, just reschedule with current editing values
                        let tempHabit = Habit(
                            id: habit.id,
                            userId: habit.userId,
                            name: editingName,
                            description: editingDescription.isEmpty ? nil : editingDescription,
                            frequency: editingFrequency,
                            streak: habit.streak,
                            maxStreak: habit.maxStreak,
                            category: habit.category,
                            difficulty: habit.difficulty,
                            isCustom: habit.isCustom,
                            reminderTime: reminderTime,
                            selectedDays: selectedDays.isEmpty ? nil : selectedDays,
                            habitCompletions: habit.habitCompletions,
                            alwaysShow: editingAlwaysShow,
                            xpReward: habit.xpReward,
                            aspirationId: editingAreaId,
                            createdAt: habit.createdAt,
                            updatedAt: habit.updatedAt
                        )
                        NotificationManager.shared.scheduleHabitNotification(habit: tempHabit)
                    } else {
                        // Remove notifications if reminder is disabled
                        NotificationManager.shared.removeHabitNotifications(habitId: habit.id)
                    }
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func deleteHabit() {
        // Note: API doesn't have delete habit endpoint yet, so we'll just show an error
        errorMessage = "Mazání návyků zatím není podporováno"
        showError = true
    }
}

#Preview {
    HabitDetailView(
        habit: Habit(
            id: "1",
            userId: "user1",
            name: "Příklad návyku",
            description: "Toto je popis příkladového návyku",
            frequency: "daily",
            streak: 5,
            maxStreak: 10,
            category: nil,
            difficulty: nil,
            isCustom: true,
            reminderTime: "09:00",
            selectedDays: nil,
            habitCompletions: nil,
            alwaysShow: false,
            xpReward: 1,
            aspirationId: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    )
}
