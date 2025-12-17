import SwiftUI

// MARK: - Playful Animations
// Animation system for playful animated style according to REDESIGN_STRUCTURE.md

struct PlayfulAnimations {
    // MARK: - Animation Presets
    
    /// Bounce animation for buttons and cards on click/tap
    /// - Response: 0.4s (fast bounce)
    /// - Damping: 0.6 (slight overshoot for playful feel)
    static let bounce = Animation.spring(response: 0.4, dampingFraction: 0.6)
    
    /// Wiggle animation for attention/errors
    /// - Fast, bouncy rotation for playful error indication
    static let wiggle = Animation.spring(response: 0.15, dampingFraction: 0.3)
    
    /// Pulse animation for active states
    /// - Continuous pulse effect
    static let pulse = Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true)
    
    /// Slide in animation for modals and panels
    /// - Smooth slide with spring
    static let slideIn = Animation.spring(response: 0.5, dampingFraction: 0.8)
    
    /// Float animation for decorative elements
    /// - Gentle up and down movement
    static let float = Animation.easeInOut(duration: 2.0).repeatForever(autoreverses: true)
    
    // MARK: - Animation Durations
    
    struct Duration {
        static let fast: Double = 0.2
        static let normal: Double = 0.3
        static let slow: Double = 0.5
    }
}

// MARK: - Animation Modifiers

extension View {
    /// Applies playful bounce animation
    func playfulBounce(duration: Double = 0.4) -> some View {
        self.animation(.spring(response: duration, dampingFraction: 0.6), value: UUID())
    }
    
    /// Applies playful wiggle animation
    func playfulWiggle() -> some View {
        self.modifier(WiggleModifier())
    }
    
    /// Applies playful pulse animation
    func playfulPulse() -> some View {
        self.modifier(PulseModifier())
    }
    
    /// Applies playful float animation
    func playfulFloat() -> some View {
        self.modifier(FloatModifier())
    }
    
    /// Respects Reduce Motion accessibility setting
    /// Returns reduced motion animation if user prefers reduced motion
    func respectingReduceMotion(_ animation: Animation) -> Animation {
        if UIAccessibility.isReduceMotionEnabled {
            return .easeInOut(duration: 0.1) // Minimal animation
        }
        return animation
    }
}

// MARK: - Wiggle Modifier

struct WiggleModifier: ViewModifier {
    @State private var rotation: Double = 0
    
    func body(content: Content) -> some View {
        content
            .rotationEffect(.degrees(rotation))
            .onAppear {
                withAnimation(PlayfulAnimations.wiggle) {
                    rotation = 5
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    withAnimation(PlayfulAnimations.wiggle) {
                        rotation = -5
                    }
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    withAnimation(PlayfulAnimations.wiggle) {
                        rotation = 0
                    }
                }
            }
    }
}

// MARK: - Pulse Modifier

struct PulseModifier: ViewModifier {
    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 1.0
    
    func body(content: Content) -> some View {
        content
            .scaleEffect(scale)
            .opacity(opacity)
            .onAppear {
                if !UIAccessibility.isReduceMotionEnabled {
                    withAnimation(PlayfulAnimations.pulse) {
                        scale = 1.1
                        opacity = 0.9
                    }
                }
            }
    }
}

// MARK: - Float Modifier

struct FloatModifier: ViewModifier {
    @State private var offset: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .offset(y: offset)
            .onAppear {
                if !UIAccessibility.isReduceMotionEnabled {
                    withAnimation(PlayfulAnimations.float) {
                        offset = -10
                    }
                }
            }
    }
}

// MARK: - Button Press Animation

struct ButtonPressModifier: ViewModifier {
    @Binding var isPressed: Bool
    
    func body(content: Content) -> some View {
        content
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isPressed)
    }
}

extension View {
    /// Applies button press animation
    func buttonPress(isPressed: Binding<Bool>) -> some View {
        self.modifier(ButtonPressModifier(isPressed: isPressed))
    }
}

