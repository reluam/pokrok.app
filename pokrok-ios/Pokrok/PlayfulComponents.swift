import SwiftUI

// MARK: - Playful Card Variant
// Variant types for playful components
enum PlayfulCardVariant {
    case pink
    case yellowGreen
    case purple
    case pattern
    
    var backgroundColor: Color {
        switch self {
        case .pink: return DesignSystem.Colors.dynamicPrimaryLight // Světlá verze primary barvy
        case .yellowGreen: return DesignSystem.Colors.Playful.yellowGreenLight
        case .purple: return DesignSystem.Colors.Playful.purpleLight
        case .pattern: return DesignSystem.Colors.surface
        }
    }
}

// MARK: - Playful Button Component
// Button with thick dark brown border, pastel background, and playful animations

struct PlayfulButton: View {
    enum Variant {
        case pink
        case yellowGreen
        case purple
        case yellow
        
        var backgroundColor: Color {
            switch self {
            case .pink: return DesignSystem.Colors.dynamicPrimary // Dynamická primary barva místo růžové
            case .yellowGreen: return DesignSystem.Colors.Playful.yellowGreen
            case .purple: return DesignSystem.Colors.Playful.purple
            case .yellow: return DesignSystem.Colors.Playful.yellow
            }
        }
        
        var backgroundColorDark: Color {
            switch self {
            case .pink: return DesignSystem.Colors.dynamicPrimaryDark // Tmavší verze primary barvy
            case .yellowGreen: return DesignSystem.Colors.Playful.yellowGreenDark
            case .purple: return DesignSystem.Colors.Playful.purpleDark
            case .yellow: return DesignSystem.Colors.Playful.yellow
            }
        }
    }
    
    enum Size {
        case sm
        case md
        case lg
        
        var padding: CGFloat {
            switch self {
            case .sm: return DesignSystem.Spacing.sm
            case .md: return DesignSystem.Spacing.md
            case .lg: return DesignSystem.Spacing.lg
            }
        }
        
        var fontSize: Font {
            switch self {
            case .sm: return DesignSystem.Typography.caption
            case .md: return DesignSystem.Typography.body
            case .lg: return DesignSystem.Typography.headline
            }
        }
        
        var minHeight: CGFloat {
            switch self {
            case .sm: return 36
            case .md: return 44
            case .lg: return 52
            }
        }
    }
    
    let variant: Variant
    let size: Size
    let title: String?
    let icon: String?
    let isLoading: Bool
    let isPressed: Bool // For navigation buttons that stay pressed
    let isDisabled: Bool
    let action: () -> Void
    
    @State private var isAnimating = false
    
    init(
        variant: Variant = .pink,
        size: Size = .md,
        title: String? = nil,
        icon: String? = nil,
        isLoading: Bool = false,
        isPressed: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.variant = variant
        self.size = size
        self.title = title
        self.icon = icon
        self.isLoading = isLoading
        self.isPressed = isPressed
        self.isDisabled = isDisabled
        self.action = action
    }
    
    var body: some View {
        Button(action: {
            if !isLoading && !isDisabled {
                // Haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.impactOccurred()
                
                // Scale down animation with smooth spring
                withAnimation(.spring(response: 0.2, dampingFraction: 0.6)) {
                    isAnimating = true
                }
                
                // Reset animation after click
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        isAnimating = false
                    }
                }
                
                action()
            }
        }) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: DesignSystem.Colors.textPrimary))
                        .scaleEffect(0.8)
                } else if let icon = icon {
                    Image(systemName: icon)
                        .font(size.fontSize)
                }
                
                if let title = title {
                    Text(title)
                        .font(size.fontSize)
                        .fontWeight(.semibold)
                }
            }
            .foregroundColor(DesignSystem.Colors.textPrimary)
            .frame(minWidth: size.minHeight, minHeight: size.minHeight)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, size.padding)
            .padding(.vertical, size.padding)
            .background(variant.backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 3) // Thicker border
            )
            .cornerRadius(DesignSystem.CornerRadius.md)
            .scaleEffect(isAnimating ? 0.95 : (isPressed ? 0.98 : 1.0))
            .opacity(isDisabled ? 0.6 : 1.0)
        }
        .disabled(isLoading || isDisabled)
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Playful Card Component
// Card with thick dark brown border and pastel background

struct PlayfulCard<Content: View>: View {
    let variant: PlayfulCardVariant
    let borderWidth: CGFloat
    let cornerRadius: CGFloat
    let animated: Bool
    let onTap: (() -> Void)?
    let content: Content
    
    @State private var isPressed = false
    
    init(
        variant: PlayfulCardVariant = .pink,
        borderWidth: CGFloat = 3, // Thicker border
        cornerRadius: CGFloat = DesignSystem.CornerRadius.lg,
        animated: Bool = true,
        onTap: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.variant = variant
        self.borderWidth = borderWidth
        self.cornerRadius = cornerRadius
        self.animated = animated
        self.onTap = onTap
        self.content = content()
    }
    
    var body: some View {
        Group {
            if let onTap = onTap {
                Button(action: {
                    // Haptic feedback
                    let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                    impactFeedback.impactOccurred()
                    
                    // Press animation
                    withAnimation(.spring(response: 0.2, dampingFraction: 0.6)) {
                        isPressed = true
                    }
                    
                    // Release animation
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            isPressed = false
                        }
                    }
                    
                    onTap()
                }) {
                    cardContent
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                cardContent
            }
        }
    }
    
    private var cardContent: some View {
        content
            .padding(DesignSystem.Spacing.md)
            .background(cardBackground)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: max(borderWidth, 3)) // Thicker border (minimum 3px)
            )
            .cornerRadius(cornerRadius)
            .scaleEffect(animated && isPressed ? 0.98 : 1.0)
    }
    
    @ViewBuilder
    private var cardBackground: some View {
        switch variant {
        case .pattern:
            // Diagonal stripes pattern (primary-yellow)
            DiagonalStripesPattern(
                color1: DesignSystem.Colors.dynamicPrimaryLight,
                color2: DesignSystem.Colors.Playful.yellow,
                stripeWidth: 10
            )
        default:
            // Regular solid background
            variant.backgroundColor
        }
    }
}

// MARK: - Playful Checkbox Component
// Custom checkbox with thick border and playful animations

struct PlayfulCheckbox: View {
    enum ColorVariant {
        case pink
        case yellowGreen
        case purple
        case red
        case gray
        
        var color: Color {
            switch self {
            case .pink: return DesignSystem.Colors.dynamicPrimary // Dynamická primary barva místo růžové
            case .yellowGreen: return DesignSystem.Colors.Playful.yellowGreen
            case .purple: return DesignSystem.Colors.Playful.purple
            case .red: return DesignSystem.Colors.redFull // Full red for overdue steps
            case .gray: return DesignSystem.Colors.grayBorder // Gray for future steps
            }
        }
    }
    
    @Binding var isChecked: Bool
    let color: ColorVariant
    let size: CGFloat
    
    @State private var isAnimating = false
    
    init(
        isChecked: Binding<Bool>,
        color: ColorVariant = .yellowGreen,
        size: CGFloat = 36 // Touch-friendly size for mobile (iOS recommended minimum 44pt, but 36px is good for checkboxes)
    ) {
        self._isChecked = isChecked
        self.color = color
        self.size = size
    }
    
    var body: some View {
        Button(action: {
            // Haptic feedback
            let impactFeedback = UIImpactFeedbackGenerator(style: .light)
            impactFeedback.impactOccurred()
            
            // Bounce animation
            withAnimation(PlayfulAnimations.bounce) {
                isAnimating = true
                isChecked.toggle()
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isAnimating = false
            }
        }) {
            ZStack {
                // Background - when checked, use variant color, otherwise surface color
                RoundedRectangle(cornerRadius: 6)
                    .fill(isChecked ? color.color : DesignSystem.Colors.surface)
                    .frame(width: size, height: size)
                
                // Border - use variant color for border
                RoundedRectangle(cornerRadius: 6)
                    .stroke(
                        color.color,
                        lineWidth: 2 // Changed from 3 to 2 to match web
                    )
                    .frame(width: size, height: size)
                
                // Checkmark - white when checked (on primary background)
                if isChecked {
                    Image(systemName: "checkmark")
                        .font(.system(size: size * 0.4, weight: .bold))
                        .foregroundColor(.white) // White checkmark on primary background
                        .scaleEffect(isAnimating ? 1.2 : 1.0)
                        .opacity(isAnimating ? 0.8 : 1.0)
                }
            }
            .scaleEffect(isAnimating ? 1.05 : 1.0) // Reduced scale effect
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Playful Badge Component
// Status badge with thick border and pastel background

struct PlayfulBadge: View {
    let text: String
    let variant: PlayfulCardVariant
    let size: PlayfulButton.Size
    
    init(
        text: String,
        variant: PlayfulCardVariant = .yellowGreen,
        size: PlayfulButton.Size = .sm
    ) {
        self.text = text
        self.variant = variant
        self.size = size
    }
    
    var body: some View {
        Text(text)
            .font(size == .sm ? DesignSystem.Typography.caption : DesignSystem.Typography.body)
            .fontWeight(.semibold)
            .foregroundColor(DesignSystem.Colors.textPrimary)
            .padding(.horizontal, size.padding)
            .padding(.vertical, size == .sm ? DesignSystem.Spacing.xs : DesignSystem.Spacing.sm)
            .background(variant.backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 3) // Thicker border
            )
            .cornerRadius(DesignSystem.CornerRadius.sm)
    }
}

// MARK: - Playful Input Component
// Text input with thick dark brown border

struct PlayfulInput: View {
    @Binding var text: String
    let placeholder: String
    let variant: PlayfulCardVariant
    
    init(
        text: Binding<String>,
        placeholder: String,
        variant: PlayfulCardVariant = .pink
    ) {
        self._text = text
        self.placeholder = placeholder
        self.variant = variant
    }
    
    var body: some View {
        TextField(placeholder, text: $text)
            .font(DesignSystem.Typography.body)
            .foregroundColor(DesignSystem.Colors.textPrimary)
            .padding(DesignSystem.Spacing.md)
            .background(variant.backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 3) // Thicker border
            )
            .cornerRadius(DesignSystem.CornerRadius.md)
    }
}

// MARK: - Playful Progress Bar Component
// Progress bar with playful styling

struct PlayfulProgressBar: View {
    let progress: Double
    let height: CGFloat
    let variant: PlayfulCardVariant
    
    init(
        progress: Double,
        height: CGFloat = 8,
        variant: PlayfulCardVariant = .yellowGreen
    ) {
        self.progress = max(0, min(1, progress))
        self.height = height
        self.variant = variant
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(DesignSystem.Colors.surfaceSecondary)
                    .frame(height: height)
                
                // Progress - use full primary color for fill
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(DesignSystem.Colors.dynamicPrimary)
                    .frame(width: geometry.size.width * progress, height: height)
                    .animation(.easeInOut(duration: 0.3), value: progress)
                
                // Outline - use full primary color
                RoundedRectangle(cornerRadius: height / 2)
                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 3) // Thicker border with full primary color
                    .frame(height: height)
            }
        }
        .frame(height: height)
    }
}

// MARK: - Playful Goal Card Component
// Goal card with playful styling

struct PlayfulGoalCard: View {
    let goal: Goal
    let onTap: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    private var cardVariant: PlayfulCardVariant {
        switch goal.priority {
        case "short_term": return .yellowGreen
        case "medium_term": return .purple
        case "long_term": return .pink
        default: return .pink
        }
    }
    
    var body: some View {
        PlayfulCard(variant: cardVariant, onTap: onTap) {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                // Header - Title on first row
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    // Title row
                    Text(goal.title)
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                        .lineLimit(nil)
                    
                    // Icon and action buttons row
                    HStack(alignment: .center, spacing: DesignSystem.Spacing.md) {
                        // Icon - use LucideIcon instead of emoji
                        if let icon = goal.icon {
                            LucideIcon(icon, size: 24, color: DesignSystem.Colors.dynamicPrimary)
                        }
                        
                        Spacer()
                        
                        // Action buttons - larger for better tapability
                        HStack(spacing: DesignSystem.Spacing.md) {
                            Button(action: onEdit) {
                                Image(systemName: "pencil")
                                    .font(.system(size: 20, weight: .medium))
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                                    .frame(width: 44, height: 44) // Touch-friendly size
                            }
                            
                            Button(action: onDelete) {
                                Image(systemName: "trash")
                                    .font(.system(size: 20, weight: .medium))
                                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                    .frame(width: 44, height: 44) // Touch-friendly size
                            }
                        }
                    }
                    
                    // Description (if exists)
                    if let description = goal.description, !description.isEmpty {
                        Text(description)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .lineLimit(3)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, DesignSystem.Spacing.xs)
                    }
                }
                
                // Progress section
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    HStack {
                        Text("Pokrok")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        
                        Spacer()
                        
                        Text("\(goal.progressPercentage)%")
                            .font(DesignSystem.Typography.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                    }
                    
                    PlayfulProgressBar(
                        progress: Double(goal.progressPercentage) / 100,
                        height: 8,
                        variant: cardVariant
                    )
                }
                
                // Footer
                HStack {
                    if let targetDate = goal.targetDate {
                        HStack(spacing: DesignSystem.Spacing.xs) {
                            Image(systemName: "calendar")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(DesignSystem.Colors.textLight)
                            Text("Do: \(targetDate, style: .date)")
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                    }
                    
                    Spacer()
                    
                    PlayfulBadge(
                        text: goal.status == "completed" ? "Dokončeno" : "Aktivní",
                        variant: goal.status == "completed" ? .yellowGreen : cardVariant,
                        size: .sm
                    )
                }
            }
        }
    }
}

// MARK: - Playful Step Card Component
// Step card with playful styling and checkbox

struct PlayfulStepCard: View {
    let step: DailyStep
    let goalTitle: String?
    let isOverdue: Bool
    let isFuture: Bool
    let onToggle: () -> Void
    
    @State private var isChecked: Bool
    
    // Custom background color based on state (matching web design)
    private var cardBackgroundColor: Color {
        if step.completed {
            return DesignSystem.Colors.greenLight // bg-green-50
        } else if isOverdue {
            return DesignSystem.Colors.redLight // bg-red-50
        } else if isFuture {
            return DesignSystem.Colors.surface
        } else {
            return DesignSystem.Colors.surface
        }
    }
    
    // Border color based on state (matching web design)
    private var cardBorderColor: Color {
        if step.completed {
            return DesignSystem.Colors.greenBorder // border-green-200
        } else if isOverdue {
            return DesignSystem.Colors.redFull // Full red for overdue steps
        } else if isFuture {
            return DesignSystem.Colors.grayBorder // border-gray-200 for future
        } else {
            // Today's steps use full primary color
            return DesignSystem.Colors.dynamicPrimary
        }
    }
    
    private var cardVariant: PlayfulCardVariant {
        // Keep variant for other purposes, but we'll override background in custom card
        if step.completed {
            return .pink // Will use primary color
        } else if isOverdue {
            return .pink
        } else {
            return .purple
        }
    }
    
    private var checkboxVariant: PlayfulCheckbox.ColorVariant {
        if step.completed {
            return .yellowGreen
        } else if isOverdue {
            return .red // Red checkbox for overdue steps
        } else if isFuture {
            return .gray // Gray checkbox for future steps
        } else {
            return .pink // Primary color for today's steps
        }
    }
    
    private var statusText: String {
        if step.completed {
            return "Dokončeno"
        } else if isOverdue {
            return "Zpožděno"
        } else if isFuture {
            return "Budoucí"
        } else {
            return "" // Remove "Čekající" tag
        }
    }
    
    private var textColor: Color {
        if isOverdue {
            return DesignSystem.Colors.redText // text-red-600 for overdue
        } else if isFuture {
            return DesignSystem.Colors.textSecondary
        } else {
            return DesignSystem.Colors.textPrimary
        }
    }
    
    // Format date: show day name if in current or next week (up to today), otherwise show date
    private var formattedDate: String {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let stepDate = calendar.startOfDay(for: step.date)
        
        // Get start of current week (Monday)
        let weekday = calendar.component(.weekday, from: today)
        // Convert to Monday = 0, Sunday = 6
        let daysFromMonday = (weekday + 5) % 7
        let currentWeekStart = calendar.date(byAdding: .day, value: -daysFromMonday, to: today)!
        
        // Get end of next week (Sunday) - 13 days from current week start
        let nextWeekEnd = calendar.date(byAdding: .day, value: 13, to: currentWeekStart)!
        
        // Check if step date is in current week or next week (but not beyond today if future)
        // For overdue steps, show day name if in current or next week
        // For future steps, show day name only if in current or next week AND <= today (but that doesn't make sense for future)
        // Actually, for future steps, we want to show day name if in current or next week
        if stepDate >= currentWeekStart && stepDate <= nextWeekEnd {
            // Show day name
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "cs_CZ")
            formatter.dateFormat = "EEEE"
            return formatter.string(from: step.date).capitalized
        } else {
            // Show date
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "cs_CZ")
            formatter.dateStyle = .short
            return formatter.string(from: step.date)
        }
    }
    
    init(
        step: DailyStep,
        goalTitle: String?,
        isOverdue: Bool,
        isFuture: Bool,
        onToggle: @escaping () -> Void
    ) {
        self.step = step
        self.goalTitle = goalTitle
        self.isOverdue = isOverdue
        self.isFuture = isFuture
        self.onToggle = onToggle
        self._isChecked = State(initialValue: step.completed)
    }
    
    var body: some View {
        NavigationLink(destination: StepDetailView(step: step)) {
            HStack(spacing: DesignSystem.Spacing.md) {
            // Checkbox - simpler design matching web
            Button(action: {
                isChecked.toggle()
                onToggle()
            }) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(isChecked ? (isOverdue ? DesignSystem.Colors.redFull : DesignSystem.Colors.greenFull) : Color.clear)
                        .frame(width: 20, height: 20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(isChecked ? (isOverdue ? DesignSystem.Colors.redFull : DesignSystem.Colors.greenFull) : (isOverdue ? DesignSystem.Colors.redFull : DesignSystem.Colors.grayBorder), lineWidth: 2)
                        )
                    
                    if isChecked {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(PlainButtonStyle())
            .onAppear {
                isChecked = step.completed
            }
            .onChange(of: step.completed) { _, newValue in
                isChecked = newValue
            }
                
                // Content - simpler layout matching web
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(step.title)
                        .font(DesignSystem.Typography.body)
                        .fontWeight(.medium)
                        .foregroundColor(textColor)
                        .strikethrough(step.completed)
                        .lineLimit(2)
                    
                    if let description = step.description, !description.isEmpty {
                        Text(description)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .lineLimit(2)
                    }
                    
                    // Tags row - matching web design
                    HStack(spacing: DesignSystem.Spacing.xs) {
                        if step.isImportant == true {
                            Text("Důležitý")
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.redText)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(DesignSystem.Colors.redLight)
                                .cornerRadius(4)
                        }
                        
                        if isOverdue || isFuture {
                            Text(formattedDate)
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(DesignSystem.Colors.surfaceSecondary)
                                .cornerRadius(4)
                        }
                    }
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.md)
            .background(cardBackgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(cardBorderColor, lineWidth: 2)
            )
            .cornerRadius(DesignSystem.CornerRadius.md)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Playful Habit Card Component
// Habit card with playful styling

struct PlayfulHabitCard: View {
    let habit: Habit
    let isCompleted: Bool
    let onToggle: () -> Void
    
    @State private var isChecked: Bool
    
    private var cardVariant: PlayfulCardVariant {
        isCompleted ? .yellowGreen : .purple
    }
    
    // Background color matching web design
    private var cardBackgroundColor: Color {
        isCompleted ? DesignSystem.Colors.primaryLightBackground : DesignSystem.Colors.surface
    }
    
    // Border color matching web design
    private var cardBorderColor: Color {
        isCompleted ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.dynamicPrimary
    }
    
    init(
        habit: Habit,
        isCompleted: Bool,
        onToggle: @escaping () -> Void
    ) {
        self.habit = habit
        self.isCompleted = isCompleted
        self.onToggle = onToggle
        self._isChecked = State(initialValue: isCompleted)
    }
    
    var body: some View {
        NavigationLink(destination: HabitDetailView(habit: habit)) {
            HStack(spacing: DesignSystem.Spacing.lg) {
                // Checkbox - larger for better tapability
                Button(action: {
                    isChecked.toggle()
                    onToggle()
                }) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(isChecked ? DesignSystem.Colors.dynamicPrimary : Color.clear)
                            .frame(width: 32, height: 32)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(isChecked ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.grayBorder, lineWidth: 2.5)
                            )
                        
                        if isChecked {
                            Image(systemName: "checkmark")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                }
                .buttonStyle(PlainButtonStyle())
                .onAppear {
                    isChecked = isCompleted
                }
                .onChange(of: isCompleted) { _, newValue in
                    isChecked = newValue
                }
                
                // Content - simpler layout matching web
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(habit.name)
                        .font(DesignSystem.Typography.body)
                        .fontWeight(.medium)
                        .foregroundColor(isCompleted ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textPrimary)
                        .strikethrough(isCompleted)
                        .lineLimit(2)
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.lg)
            .background(cardBackgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(cardBorderColor, lineWidth: 2)
            )
            .cornerRadius(DesignSystem.CornerRadius.md)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Playful Loading Spinner Component
// Playful loading spinner with bounce animation

struct PlayfulLoadingSpinner: View {
    let size: CGFloat
    let color: Color
    
    @State private var rotation: Double = 0
    @State private var scale: CGFloat = 0.8
    
    init(size: CGFloat = 40, color: Color = DesignSystem.Colors.dynamicPrimary) {
        self.size = size
        self.color = color
    }
    
    var body: some View {
        ZStack {
            ForEach(0..<8) { index in
                Circle()
                    .fill(color)
                    .frame(width: size / 4, height: size / 4)
                    .offset(y: -size / 2)
                    .rotationEffect(.degrees(Double(index) * 45 + rotation))
                    .opacity(Double(8 - index) / 8.0)
            }
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.linear(duration: 1.0).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                scale = 1.2
            }
        }
        .scaleEffect(scale)
    }
}

// MARK: - Playful Loading View
// Loading view with playful styling

struct PlayfulLoadingView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            PlayfulLoadingSpinner(size: 50, color: DesignSystem.Colors.dynamicPrimary)
            
            if !message.isEmpty {
                Text(message)
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(DesignSystem.Colors.background)
    }
}

// MARK: - Skeleton Loading View
// Skeleton loading state for cards

struct PlayfulSkeletonCard: View {
    var body: some View {
        PlayfulCard(variant: .pink) {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                // Title skeleton
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                    .fill(DesignSystem.Colors.surfaceSecondary)
                    .frame(height: 20)
                    .frame(maxWidth: .infinity)
                
                // Description skeleton
                VStack(spacing: DesignSystem.Spacing.xs) {
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                        .fill(DesignSystem.Colors.surfaceSecondary)
                        .frame(height: 16)
                        .frame(maxWidth: .infinity)
                    
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                        .fill(DesignSystem.Colors.surfaceSecondary)
                        .frame(height: 16)
                        .frame(width: 200)
                }
            }
        }
        .shimmer()
    }
}

// MARK: - Shimmer Effect Modifier

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .overlay(
                GeometryReader { geometry in
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color.clear,
                            DesignSystem.Colors.surface.opacity(0.5),
                            Color.clear
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: geometry.size.width * 2)
                    .offset(x: -geometry.size.width + phase * geometry.size.width * 2)
                }
            )
            .onAppear {
                withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                    phase = 1
                }
            }
    }
}

extension View {
    func shimmer() -> some View {
        self.modifier(ShimmerModifier())
    }
}

// MARK: - Pattern Backgrounds
// Pattern backgrounds for playful style according to REDESIGN_STRUCTURE.md

// MARK: - Diagonal Stripes Pattern
// Repeating diagonal stripes pattern (45deg) with pink and yellow colors

struct DiagonalStripesPattern: View {
    let color1: Color
    let color2: Color
    let stripeWidth: CGFloat
    
    init(
        color1: Color = DesignSystem.Colors.Playful.pinkLight,
        color2: Color = DesignSystem.Colors.Playful.yellow,
        stripeWidth: CGFloat = 10
    ) {
        self.color1 = color1
        self.color2 = color2
        self.stripeWidth = stripeWidth
    }
    
    var body: some View {
        GeometryReader { geometry in
            let size = max(geometry.size.width, geometry.size.height) * 2
            let stripeCount = Int(size / (stripeWidth * 2)) + 4
            
            ZStack {
                // Base color
                color1
                
                // Diagonal stripes pattern
                HStack(spacing: 0) {
                    ForEach(0..<stripeCount, id: \.self) { index in
                        Rectangle()
                            .fill(index % 2 == 0 ? color1 : color2)
                            .frame(width: stripeWidth)
                    }
                }
                .frame(width: size, height: size)
                .rotationEffect(.degrees(45))
                .offset(x: -size / 4, y: -size / 4)
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .clipped()
        }
    }
}

// MARK: - Dots Pattern
// Radial gradient dots pattern with outline color

struct DotsPattern: View {
    let dotColor: Color
    let dotSize: CGFloat
    let spacing: CGFloat
    
    init(
        dotColor: Color = DesignSystem.Colors.outline,
        dotSize: CGFloat = 1,
        spacing: CGFloat = 4
    ) {
        self.dotColor = dotColor
        self.dotSize = dotSize
        self.spacing = spacing
    }
    
    var body: some View {
        GeometryReader { geometry in
            Canvas { context, size in
                let columns = Int(size.width / spacing) + 1
                let rows = Int(size.height / spacing) + 1
                
                for row in 0..<rows {
                    for col in 0..<columns {
                        let x = CGFloat(col) * spacing
                        let y = CGFloat(row) * spacing
                        
                        context.fill(
                            Path(ellipseIn: CGRect(
                                x: x - dotSize / 2,
                                y: y - dotSize / 2,
                                width: dotSize,
                                height: dotSize
                            )),
                            with: .color(dotColor)
                        )
                    }
                }
            }
        }
    }
}

// MARK: - Pattern Background Modifier

struct PatternBackgroundModifier: ViewModifier {
    let patternType: PatternType
    let baseColor: Color
    
    enum PatternType {
        case diagonalStripes(color1: Color, color2: Color)
        case dots(dotColor: Color)
    }
    
    func body(content: Content) -> some View {
        ZStack {
            // Pattern background
            switch patternType {
            case .diagonalStripes(let color1, let color2):
                DiagonalStripesPattern(color1: color1, color2: color2)
            case .dots(let dotColor):
                baseColor.overlay(
                    DotsPattern(dotColor: dotColor)
                )
            }
            
            // Content on top
            content
        }
    }
}

extension View {
    func patternBackground(_ type: PatternBackgroundModifier.PatternType, baseColor: Color = DesignSystem.Colors.surface) -> some View {
        self.modifier(PatternBackgroundModifier(patternType: type, baseColor: baseColor))
    }
}

