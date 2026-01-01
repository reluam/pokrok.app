import SwiftUI

// MARK: - Habit Banner Manager
class HabitBannerManager: ObservableObject {
    static let shared = HabitBannerManager()
    
    @Published var currentBanner: HabitBannerData?
    
    private init() {}
    
    func showBanner(habitId: String, habitName: String) {
        currentBanner = HabitBannerData(habitId: habitId, habitName: habitName)
    }
    
    func dismissBanner() {
        currentBanner = nil
    }
}

struct HabitBannerData: Identifiable {
    let id = UUID()
    let habitId: String
    let habitName: String
}

// MARK: - Habit Banner View
struct HabitBannerView: View {
    let banner: HabitBannerData
    let onDismiss: () -> Void
    
    var body: some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            // Icon
            Image(systemName: "bell.fill")
                .font(.system(size: 20))
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            // Text
            VStack(alignment: .leading, spacing: 2) {
                Text(banner.habitName)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Text("Je čas na váš návyk!")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }
            
            Spacer()
            
            // Dismiss button
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .frame(width: 24, height: 24)
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
        .padding(.horizontal, DesignSystem.Spacing.md)
    }
}

// MARK: - Banner Overlay Modifier
struct HabitBannerOverlay: ViewModifier {
    @ObservedObject private var bannerManager = HabitBannerManager.shared
    
    func body(content: Content) -> some View {
        ZStack(alignment: .top) {
            content
            
            if let banner = bannerManager.currentBanner {
                VStack {
                    HabitBannerView(banner: banner) {
                        bannerManager.dismissBanner()
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(1000)
                    
                    Spacer()
                }
                .padding(.top, DesignSystem.Spacing.md)
            }
        }
    }
}

extension View {
    func habitBannerOverlay() -> some View {
        modifier(HabitBannerOverlay())
    }
}

