import Foundation
import UserNotifications
import SwiftUI

class NotificationManager: ObservableObject {
    static let shared = NotificationManager()
    
    @Published var stepsNotificationTime: Date = {
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month, .day], from: Date())
        components.hour = 9
        components.minute = 0
        return calendar.date(from: components) ?? Date()
    }()
    
    private let userDefaults = UserDefaults.standard
    private let stepsNotificationTimeKey = "steps_notification_time"
    
    private init() {
        loadSettings()
        requestAuthorization()
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Notification authorization error: \(error.localizedDescription)")
            } else if granted {
                print("Notification authorization granted")
            } else {
                print("Notification authorization denied")
            }
        }
    }
    
    // MARK: - Settings
    
    func loadSettings() {
        if let savedTime = userDefaults.object(forKey: stepsNotificationTimeKey) as? Date {
            stepsNotificationTime = savedTime
        }
    }
    
    func saveSettings() {
        userDefaults.set(stepsNotificationTime, forKey: stepsNotificationTimeKey)
        userDefaults.synchronize()
        scheduleStepsNotifications()
    }
    
    // MARK: - Habit Notifications (Local Alerts)
    
    /// Checks if a habit should be reminded today based on its frequency and selected days
    private func shouldRemindToday(habit: Habit) -> Bool {
        let calendar = Calendar.current
        let today = Date()
        let todayWeekday = calendar.component(.weekday, from: today)
        let todayDay = calendar.component(.day, from: today)
        
        switch habit.frequency {
        case "daily":
            return true
            
        case "weekly":
            guard let selectedDays = habit.selectedDays, !selectedDays.isEmpty else {
                return false
            }
            
            let dayMapping: [String: Int] = [
                "monday": 2,
                "tuesday": 3,
                "wednesday": 4,
                "thursday": 5,
                "friday": 6,
                "saturday": 7,
                "sunday": 1,
                "pondělí": 2,
                "úterý": 3,
                "středa": 4,
                "čtvrtek": 5,
                "pátek": 6,
                "sobota": 7,
                "neděle": 1
            ]
            
            for dayName in selectedDays {
                let normalizedDayName = dayName.lowercased()
                if let targetWeekday = dayMapping[normalizedDayName], targetWeekday == todayWeekday {
                    return true
                }
            }
            return false
            
        case "monthly":
            guard let selectedDays = habit.selectedDays, !selectedDays.isEmpty else {
                return false
            }
            
            for dayStr in selectedDays {
                if let dayNumber = Int(dayStr), dayNumber == todayDay {
                    return true
                }
            }
            return false
            
        default:
            return false
        }
    }
    
    /// Schedules a notification for a habit only for today (if applicable)
    func scheduleHabitNotificationForToday(habit: Habit) {
        guard let reminderTime = habit.reminderTime else {
            return
        }
        
        // Check if this habit should be reminded today
        guard shouldRemindToday(habit: habit) else {
            return
        }
        
        // Parse time string (format: "HH:mm" or "HH:mm:ss")
        let components = reminderTime.split(separator: ":")
        guard components.count >= 2,
              let hour = Int(components[0]),
              let minute = Int(components[1]) else {
            print("Invalid reminder time format for habit \(habit.name): \(reminderTime)")
            return
        }
        
        let calendar = Calendar.current
        let today = Date()
        let todayStart = calendar.startOfDay(for: today)
        
        // Create date components for today at the reminder time
        var dateComponents = calendar.dateComponents([.year, .month, .day], from: todayStart)
        dateComponents.hour = hour
        dateComponents.minute = minute
        
        guard let notificationDate = calendar.date(from: dateComponents) else {
            return
        }
        
        // Only schedule if the time hasn't passed yet today
        guard notificationDate > today else {
            return
        }
        
        // Remove any existing notification for this habit today
        removeHabitNotifications(habitId: habit.id)
        
        // Schedule notification for today
        let content = UNMutableNotificationContent()
        content.title = habit.name
        content.body = "Je čas na váš návyk!"
        content.sound = .default
        content.categoryIdentifier = "HABIT_ALERT"
        content.userInfo = [
            "habitId": habit.id,
            "habitName": habit.name,
            "type": "habit"
        ]
        
        let triggerComponents = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: notificationDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: triggerComponents, repeats: false)
        
        let identifier = "habit_\(habit.id)_today"
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling habit notification: \(error.localizedDescription)")
            } else {
                print("✅ Scheduled notification for habit \(habit.name) today at \(hour):\(String(format: "%02d", minute))")
            }
        }
    }
    
    func removeHabitNotifications(habitId: String) {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let identifiers = requests
                .filter { $0.identifier.hasPrefix("habit_\(habitId)_") }
                .map { $0.identifier }
            
            if !identifiers.isEmpty {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
            }
        }
    }
    
    /// Schedules habit notifications only for today
    func scheduleAllHabitNotifications(habits: [Habit]) {
        print("📅 Scheduling today's habit notifications for \(habits.count) habits")
        
        // Remove all old habit notifications first
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let habitIdentifiers = requests
                .filter { $0.identifier.hasPrefix("habit_") }
                .map { $0.identifier }
            
            if !habitIdentifiers.isEmpty {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: habitIdentifiers)
            }
        }
        
        var scheduledCount = 0
        for habit in habits {
            if habit.reminderTime != nil {
                scheduleHabitNotificationForToday(habit: habit)
                scheduledCount += 1
            }
        }
        
        print("✅ Scheduled today's notifications for \(scheduledCount) habits")
        
        // Debug: List all pending habit notifications
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let habitRequests = requests.filter { $0.identifier.hasPrefix("habit_") }
            print("📋 Total pending habit notifications: \(habitRequests.count)")
            for request in habitRequests {
                if let trigger = request.trigger as? UNCalendarNotificationTrigger {
                    let dateComponents = trigger.dateComponents
                    print("    • \(request.content.title) at \(dateComponents.hour ?? 0):\(String(format: "%02d", dateComponents.minute ?? 0))")
                }
            }
        }
    }
    
    // MARK: - Steps Notifications (Push Notifications)
    
    func scheduleStepsNotifications() {
        // Remove old steps notifications
        removeStepsNotifications()
        
        let calendar = Calendar.current
        let now = Date()
        
        // Schedule for next 30 days
        for dayOffset in 0..<30 {
            guard let date = calendar.date(byAdding: .day, value: dayOffset, to: now) else { continue }
            
            var components = calendar.dateComponents([.year, .month, .day], from: date)
            let timeComponents = calendar.dateComponents([.hour, .minute], from: stepsNotificationTime)
            components.hour = timeComponents.hour
            components.minute = timeComponents.minute
            
            guard let triggerDate = calendar.date(from: components), triggerDate > now else { continue }
            
            // Get first step for this date (will be updated later with actual step data)
            let content = UNMutableNotificationContent()
            content.title = "Dnešní kroky"
            content.body = "Dnes Vás čeká X kroků. Začněte s prvním krokem."
            content.sound = .default
            content.categoryIdentifier = "STEPS_REMINDER"
            content.userInfo = [
                "date": ISO8601DateFormatter().string(from: date),
                "type": "steps",
                "navigateTo": "feed"
            ]
            
            let triggerComponents = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: triggerDate)
            let trigger = UNCalendarNotificationTrigger(dateMatching: triggerComponents, repeats: false)
            
            let identifier = "steps_\(dayOffset)"
            let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("Error scheduling steps notification: \(error.localizedDescription)")
                }
            }
        }
    }
    
    func updateStepsNotificationContent(stepsCount: Int, firstStepTitle: String?, for date: Date) {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let notificationDate = calendar.startOfDay(for: date)
        let isToday = calendar.isDate(notificationDate, inSameDayAs: today)
        let dateString = ISO8601DateFormatter().string(from: date)
        
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let stepsRequests = requests.filter { request in
                guard let userInfo = request.content.userInfo["date"] as? String else { return false }
                return userInfo == dateString
            }
            
            for request in stepsRequests {
                let updatedContent = UNMutableNotificationContent()
                updatedContent.title = "Dnešní kroky"
                
                // Build notification body
                if stepsCount == 0 && isToday {
                    // All done for today
                    updatedContent.body = "Pro dnešek máš již vše splněno, dobrá práce!"
                } else {
                    let stepsText = stepsCount == 1 ? "krok" : (stepsCount < 5 ? "kroky" : "kroků")
                    if let firstStep = firstStepTitle, !firstStep.isEmpty {
                        updatedContent.body = "Dnes Vás čeká \(stepsCount) \(stepsText). Začněte s \(firstStep)."
                    } else {
                        updatedContent.body = "Dnes Vás čeká \(stepsCount) \(stepsText). Začněte s prvním krokem."
                    }
                }
                
                updatedContent.sound = .default
                updatedContent.categoryIdentifier = "STEPS_REMINDER"
                updatedContent.userInfo = request.content.userInfo
                
                // Remove old and add new
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [request.identifier])
                
                if let trigger = request.trigger as? UNCalendarNotificationTrigger {
                    let newRequest = UNNotificationRequest(identifier: request.identifier, content: updatedContent, trigger: trigger)
                    UNUserNotificationCenter.current().add(newRequest) { error in
                        if let error = error {
                            print("Error updating steps notification: \(error.localizedDescription)")
                        }
                    }
                }
            }
        }
    }
    
    func removeStepsNotifications() {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let identifiers = requests
                .filter { $0.identifier.hasPrefix("steps_") }
                .map { $0.identifier }
            
            if !identifiers.isEmpty {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
            }
        }
    }
    
    // MARK: - Notification Categories
    
    func setupNotificationCategories() {
        // Habit alert category (with OK action)
        let habitAlertCategory = UNNotificationCategory(
            identifier: "HABIT_ALERT",
            actions: [
                UNNotificationAction(
                    identifier: "OK_ACTION",
                    title: "OK",
                    options: []
                )
            ],
            intentIdentifiers: [],
            options: []
        )
        
        // Steps reminder category
        let stepsReminderCategory = UNNotificationCategory(
            identifier: "STEPS_REMINDER",
            actions: [],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([
            habitAlertCategory,
            stepsReminderCategory
        ])
    }
    
    // MARK: - Cleanup
    
    func removeAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}

