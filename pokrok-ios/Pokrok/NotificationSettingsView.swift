import SwiftUI

struct NotificationSettingsView: View {
    @StateObject private var notificationManager = NotificationManager.shared
    @State private var showStepsTimePicker = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.lg) {
                    // Steps Notifications Section
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        Text("Notifikace kroků")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Dostávejte každý den připomínku o svých krocích")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                            HStack {
                                Text("Čas notifikace")
                                    .font(DesignSystem.Typography.body)
                                    .foregroundColor(DesignSystem.Colors.textPrimary)
                                
                                Spacer()
                                
                                Button(action: {
                                    showStepsTimePicker.toggle()
                                }) {
                                    HStack {
                                        Text(timeString(from: notificationManager.stepsNotificationTime))
                                            .font(DesignSystem.Typography.body)
                                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                        
                                        Image(systemName: "clock")
                                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                    }
                                    .padding(DesignSystem.Spacing.sm)
                                    .background(Color.white)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                    )
                                    .cornerRadius(DesignSystem.CornerRadius.sm)
                                }
                            }
                            
                            if showStepsTimePicker {
                                DatePicker(
                                    "Čas notifikace",
                                    selection: $notificationManager.stepsNotificationTime,
                                    displayedComponents: .hourAndMinute
                                )
                                .datePickerStyle(.wheel)
                                .tint(DesignSystem.Colors.dynamicPrimary)
                                .onChange(of: notificationManager.stepsNotificationTime) { _, _ in
                                    notificationManager.saveSettings()
                                }
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
                    }
                    
                    // Habits Notifications Info
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        Text("Notifikace návyků")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Návyky mají vlastní časy upozornění, které můžete nastavit v detailu každého návyku. Tyto upozornění se zobrazí jako alert s tlačítkem OK.")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .padding(DesignSystem.Spacing.md)
                            .background(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.md)
                            .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
                    }
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.top, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
        }
        .navigationTitle("Notifikace")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func timeString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

