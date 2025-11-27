import SwiftUI

struct StepsView: View {
    let goals: [Goal]
    @State private var steps: [Step] = []
    @State private var isLoading = true
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Steps")
                        .font(.largeTitle.bold())
                    Text("\(steps.count) total • \(steps.filter { $0.isCompleted }.count) completed")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Label("Add Step", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
            .padding(24)
            
            Divider()
            
            if isLoading {
                Spacer()
                ProgressView()
                Spacer()
            } else if steps.isEmpty {
                Spacer()
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle")
                        .font(.system(size: 48))
                        .foregroundColor(.gray.opacity(0.5))
                    Text("No steps yet")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Text("Create steps from your goals to track progress")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(steps) { step in
                            StepCard(step: step, goalTitle: goalTitle(for: step))
                        }
                    }
                    .padding(24)
                }
            }
        }
        .task {
            await loadSteps()
        }
    }
    
    private func goalTitle(for step: Step) -> String? {
        goals.first { $0.id == step.goalId }?.title
    }
    
    private func loadSteps() async {
        isLoading = true
        defer { isLoading = false }
        
        // TODO: Load steps from API
        // For now, use empty array
        steps = []
    }
}

struct StepCard: View {
    let step: Step
    let goalTitle: String?
    @State private var isHovering = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Checkbox
            Button(action: {}) {
                ZStack {
                    Circle()
                        .stroke(step.isCompleted ? Color.green : Color.orange, lineWidth: 2)
                        .frame(width: 28, height: 28)
                    
                    if step.isCompleted {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 28, height: 28)
                        
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(.plain)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(step.title)
                    .font(.headline)
                    .strikethrough(step.isCompleted)
                    .foregroundColor(step.isCompleted ? .secondary : .primary)
                
                if let goalTitle = goalTitle {
                    HStack(spacing: 4) {
                        Image(systemName: "target")
                            .font(.caption)
                        Text(goalTitle)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if let date = step.scheduledDate {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(date.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(isHovering ? 0.1 : 0.05), radius: isHovering ? 8 : 4, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.2), lineWidth: 1)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
}

#Preview {
    StepsView(goals: [])
}

