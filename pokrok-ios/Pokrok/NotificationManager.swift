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
    
    func scheduleHabitNotification(habit: Habit) {
        guard let reminderTime = habit.reminderTime else { return }
        
        // Parse time string (format: "HH:mm")
        let components = reminderTime.split(separator: ":")
        guard components.count == 2,
              let hour = Int(components[0]),
              let minute = Int(components[1]) else {
            return
        }
        
        let calendar = Calendar.current
        let now = Date()
        
        // Determine which days to schedule based on frequency
        var datesToSchedule: [Date] = []
        
        switch habit.frequency {
        case "daily":
            // Schedule for today and next 7 days
            for dayOffset in 0..<7 {
                if let date = calendar.date(byAdding: .day, value: dayOffset, to: now) {
                    var components = calendar.dateComponents([.year, .month, .day], from: date)
                    components.hour = hour
                    components.minute = minute
                    if let scheduledDate = calendar.date(from: components), scheduledDate > now {
                        datesToSchedule.append(scheduledDate)
                    }
                }
            }
            
        case "weekly":
            guard let selectedDays = habit.selectedDays, !selectedDays.isEmpty else { return }
            
            let dayMapping: [String: Int] = [
                "monday": 2,
                "tuesday": 3,
                "wednesday": 4,
                "thursday": 5,
                "friday": 6,
                "saturday": 7,
                "sunday": 1
            ]
            
            let weekday = calendar.component(.weekday, from: now)
            
            for dayName in selectedDays {
                if let targetWeekday = dayMapping[dayName] {
                    var daysToAdd = targetWeekday - weekday
                    if daysToAdd <= 0 {
                        daysToAdd += 7
                    }
                    
                    if let date = calendar.date(byAdding: .day, value: daysToAdd, to: now) {
                        var components = calendar.dateComponents([.year, .month, .day], from: date)
                        components.hour = hour
                        components.minute = minute
                        if let scheduledDate = calendar.date(from: components), scheduledDate > now {
                            datesToSchedule.append(scheduledDate)
                        }
                    }
                }
            }
            
        case "monthly":
            guard let selectedDays = habit.selectedDays, !selectedDays.isEmpty else { return }
            
            for dayStr in selectedDays {
                if let dayNumber = Int(dayStr), dayNumber >= 1 && dayNumber <= 31 {
                    let currentMonth = calendar.component(.month, from: now)
                    let currentYear = calendar.component(.year, from: now)
                    
                    // Try current month first
                    var components = DateComponents(year: currentYear, month: currentMonth, day: dayNumber, hour: hour, minute: minute)
                    if let date = calendar.date(from: components), date > now {
                        datesToSchedule.append(date)
                    } else {
                        // Try next month
                        if let nextMonth = calendar.date(byAdding: .month, value: 1, to: now) {
                            let nextMonthNum = calendar.component(.month, from: nextMonth)
                            let nextYear = calendar.component(.year, from: nextMonth)
                            components = DateComponents(year: nextYear, month: nextMonthNum, day: dayNumber, hour: hour, minute: minute)
                            if let date = calendar.date(from: components) {
                                datesToSchedule.append(date)
                            }
                        }
                    }
                }
            }
            
        default:
            return
        }
        
        // Remove old notifications for this habit
        removeHabitNotifications(habitId: habit.id)
        
        // Schedule new notifications
        for (index, date) in datesToSchedule.enumerated() {
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
            
            let triggerDate = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
            let trigger = UNCalendarNotificationTrigger(dateMatching: triggerDate, repeats: false)
            
            let identifier = "habit_\(habit.id)_\(index)"
            let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("Error scheduling habit notification: \(error.localizedDescription)")
                }
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
    
    func scheduleAllHabitNotifications(habits: [Habit]) {
        for habit in habits {
            if habit.reminderTime != nil {
                scheduleHabitNotification(habit: habit)
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
            
            let content = UNMutableNotificationContent()
            content.title = "Dnešní kroky"
            content.body = "Zkontrolujte své kroky na dnes"
            content.sound = .default
            content.categoryIdentifier = "STEPS_REMINDER"
            content.userInfo = [
                "date": ISO8601DateFormatter().string(from: date),
                "type": "steps"
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
    
    func updateStepsNotificationContent(stepsCount: Int, for date: Date) {
        let calendar = Calendar.current
        let dateString = ISO8601DateFormatter().string(from: date)
        
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let stepsRequests = requests.filter { request in
                guard let userInfo = request.content.userInfo["date"] as? String else { return false }
                return userInfo == dateString
            }
            
            for request in stepsRequests {
                let updatedContent = UNMutableNotificationContent()
                updatedContent.title = "Dnešní kroky"
                updatedContent.body = "Čekají vás dnes \(stepsCount) \(stepsCount == 1 ? "krok" : stepsCount < 5 ? "kroky" : "kroků")"
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

