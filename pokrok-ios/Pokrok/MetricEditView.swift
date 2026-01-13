import SwiftUI

struct MetricEditView: View {
    let metric: GoalMetric
    let onMetricUpdated: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    
    @State private var editingName: String
    @State private var editingDescription: String
    @State private var editingType: String
    @State private var editingUnit: String
    @State private var editingTargetValue: String
    @State private var editingCurrentValue: String
    @State private var editingInitialValue: String
    @State private var editingIncrementalValue: String
    
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    init(metric: GoalMetric, onMetricUpdated: @escaping () -> Void) {
        self.metric = metric
        self.onMetricUpdated = onMetricUpdated
        
        // Helper function to format decimal
        func formatDecimal(_ value: Decimal) -> String {
            let number = NSDecimalNumber(decimal: value)
            let formatter = NumberFormatter()
            formatter.numberStyle = .decimal
            formatter.maximumFractionDigits = 2
            formatter.minimumFractionDigits = 0
            return formatter.string(from: number) ?? "0"
        }
        
        self._editingName = State(initialValue: metric.name)
        self._editingDescription = State(initialValue: metric.description ?? "")
        self._editingType = State(initialValue: metric.type)
        self._editingUnit = State(initialValue: metric.unit ?? "")
        self._editingTargetValue = State(initialValue: formatDecimal(metric.targetValue))
        self._editingCurrentValue = State(initialValue: formatDecimal(metric.currentValue))
        self._editingInitialValue = State(initialValue: formatDecimal(metric.initialValue ?? 0))
        self._editingIncrementalValue = State(initialValue: formatDecimal(metric.incrementalValue ?? 1))
    }
    
    private func formatDecimal(_ value: Decimal) -> String {
        let number = NSDecimalNumber(decimal: value)
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0
        return formatter.string(from: number) ?? "0"
    }
    
    private func parseDecimal(_ string: String) -> Decimal? {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        if let number = formatter.number(from: string) {
            return number.decimalValue
        }
        return nil
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.lg) {
                // Name
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Název")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    TextField("Název metriky", text: $editingName)
                        .textFieldStyle(.roundedBorder)
                        .font(DesignSystem.Typography.body)
                }
                
                // Description
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Popis")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    TextField("Popis metriky", text: $editingDescription, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .font(DesignSystem.Typography.body)
                        .lineLimit(3...6)
                }
                
                // Type
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Typ")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    Picker("Typ", selection: $editingType) {
                        Text("Číslo").tag("number")
                        Text("Měna").tag("currency")
                        Text("Procento").tag("percentage")
                        Text("Vzdálenost").tag("distance")
                        Text("Čas").tag("time")
                        Text("Váha").tag("weight")
                        Text("Vlastní").tag("custom")
                    }
                    .pickerStyle(.menu)
                }
                
                // Unit
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Jednotka")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    TextField("Jednotka (např. kg, km)", text: $editingUnit)
                        .textFieldStyle(.roundedBorder)
                        .font(DesignSystem.Typography.body)
                }
                
                // Target Value
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Cílová hodnota")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    TextField("Cílová hodnota", text: $editingTargetValue)
                        .textFieldStyle(.roundedBorder)
                        .font(DesignSystem.Typography.body)
                        .keyboardType(.decimalPad)
                }
                
                // Current Value
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Aktuální hodnota")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    TextField("Aktuální hodnota", text: $editingCurrentValue)
                        .textFieldStyle(.roundedBorder)
                        .font(DesignSystem.Typography.body)
                        .keyboardType(.decimalPad)
                }
                
                // Initial Value
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Počáteční hodnota")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    TextField("Počáteční hodnota", text: $editingInitialValue)
                        .textFieldStyle(.roundedBorder)
                        .font(DesignSystem.Typography.body)
                        .keyboardType(.decimalPad)
                }
                
                // Incremental Value
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Přírůstek")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    TextField("Přírůstek", text: $editingIncrementalValue)
                        .textFieldStyle(.roundedBorder)
                        .font(DesignSystem.Typography.body)
                        .keyboardType(.decimalPad)
                }
                
                // Save Button
                Button(action: saveMetric) {
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
                .disabled(isSaving || editingName.isEmpty)
                .padding(.top, DesignSystem.Spacing.md)
            }
            .padding(DesignSystem.Spacing.md)
        }
        .background(DesignSystem.Colors.background)
        .navigationTitle("Upravit metriku")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func saveMetric() {
        guard !editingName.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Název metriky je povinný"
            showError = true
            return
        }
        
        isSaving = true
        
        Task {
            do {
                let targetValue = parseDecimal(editingTargetValue) ?? metric.targetValue
                let currentValue = parseDecimal(editingCurrentValue) ?? metric.currentValue
                let initialValue = parseDecimal(editingInitialValue) ?? metric.initialValue ?? 0
                let incrementalValue = parseDecimal(editingIncrementalValue) ?? metric.incrementalValue ?? 1
                
                _ = try await apiManager.updateGoalMetric(
                    metricId: metric.id,
                    goalId: metric.goalId,
                    name: editingName,
                    description: editingDescription.isEmpty ? nil : editingDescription,
                    type: editingType,
                    unit: editingUnit.isEmpty ? nil : editingUnit,
                    targetValue: targetValue,
                    currentValue: currentValue,
                    initialValue: initialValue,
                    incrementalValue: incrementalValue
                )
                
                await MainActor.run {
                    isSaving = false
                    onMetricUpdated()
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

