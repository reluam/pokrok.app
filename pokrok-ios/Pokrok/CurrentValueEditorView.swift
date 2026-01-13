import SwiftUI

struct CurrentValueEditorView: View {
    let metric: GoalMetric
    let onValueUpdated: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    
    @State private var editingValue: String
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""
    @FocusState private var isTextFieldFocused: Bool
    
    init(metric: GoalMetric, onValueUpdated: @escaping () -> Void) {
        self.metric = metric
        self.onValueUpdated = onValueUpdated
        
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0
        let number = NSDecimalNumber(decimal: metric.currentValue)
        self._editingValue = State(initialValue: formatter.string(from: number) ?? "0")
    }
    
    private func parseDecimal(_ string: String) -> Decimal? {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        if let number = formatter.number(from: string) {
            return number.decimalValue
        }
        return nil
    }
    
    private func formatTargetValue() -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0
        let targetNumber = NSDecimalNumber(decimal: metric.targetValue)
        return "\(formatter.string(from: targetNumber) ?? "0")\(metric.unit.map { " \($0)" } ?? "")"
    }
    
    var body: some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            // Metric name
            Text(metric.name)
                .font(DesignSystem.Typography.title2)
                .fontWeight(.bold)
                .foregroundColor(DesignSystem.Colors.textPrimary)
                .padding(.top, DesignSystem.Spacing.lg)
            
            // Current value input
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                Text("Aktuální hodnota")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                
                TextField("Hodnota", text: $editingValue)
                    .textFieldStyle(.roundedBorder)
                    .font(DesignSystem.Typography.title2)
                    .fontWeight(.bold)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, DesignSystem.Spacing.lg)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .focused($isTextFieldFocused)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            isTextFieldFocused = true
                        }
                    }
                
                if let unit = metric.unit, !unit.isEmpty {
                    Text(unit)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .padding(.horizontal, DesignSystem.Spacing.md)
            
            // Target info
            HStack {
                Text("Cíl:")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                
                Text(formatTargetValue())
                    .font(DesignSystem.Typography.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
            }
            .padding(.horizontal, DesignSystem.Spacing.md)
            
            Spacer()
            
            // Save Button
            Button(action: saveValue) {
                HStack {
                    if isSaving {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Uložit")
                            .font(DesignSystem.Typography.body)
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.dynamicPrimary)
                .foregroundColor(.white)
                .cornerRadius(DesignSystem.CornerRadius.md)
            }
            .disabled(isSaving)
            .padding(.horizontal, DesignSystem.Spacing.md)
            .padding(.bottom, DesignSystem.Spacing.md)
        }
        .background(DesignSystem.Colors.background)
        .navigationTitle("Upravit hodnotu")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func saveValue() {
        guard let newValue = parseDecimal(editingValue) else {
            errorMessage = "Neplatná hodnota"
            showError = true
            return
        }
        
        isSaving = true
        
        Task {
            do {
                _ = try await apiManager.updateGoalMetric(
                    metricId: metric.id,
                    goalId: metric.goalId,
                    currentValue: newValue
                )
                
                await MainActor.run {
                    isSaving = false
                    onValueUpdated()
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
}

