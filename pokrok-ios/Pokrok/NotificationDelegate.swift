import Foundation
import UserNotifications
import SwiftUI

class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationDelegate()
    
    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    // MARK: - Handle notification when app is in foreground
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        
        // For habit alerts, show as alert (banner)
        if let type = userInfo["type"] as? String, type == "habit" {
            // Show as alert/banner when app is in foreground
            completionHandler([.banner, .sound, .badge])
        } else {
            // For steps notifications, show as banner
            completionHandler([.banner, .sound, .badge])
        }
    }
    
    // MARK: - Handle notification tap
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle habit alert OK action
        if response.actionIdentifier == "OK_ACTION" {
            // User tapped OK on habit alert - notification is dismissed
            completionHandler()
            return
        }
        
        // Handle notification tap
        if let type = userInfo["type"] as? String {
            switch type {
            case "habit":
                // Could navigate to habits view or specific habit
                // For now, just dismiss
                break
            case "steps":
                // Could navigate to steps view
                // For now, just dismiss
                break
            default:
                break
            }
        }
        
        completionHandler()
    }
}

