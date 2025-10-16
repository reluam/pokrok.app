import SwiftUI
import WidgetKit

struct TodayStepsWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.orange)
                    .font(.system(size: 16, weight: .semibold))
                
                Text("Dnešní kroky")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text("\(entry.todaySteps.count)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }
            
            if entry.todaySteps.isEmpty {
                VStack(spacing: 4) {
                    Image(systemName: "party.popper.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.green)
                    
                    Text("Všechny úkoly hotové!")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.green)
                        .multilineTextAlignment(.center)
                    
                    // Debug info
                    Text("Debug: \(entry.todaySteps.count) steps")
                        .font(.system(size: 8))
                        .foregroundColor(.red)
                    
                    Text("Type: \(entry.widgetType.rawValue)")
                        .font(.system(size: 8))
                        .foregroundColor(.red)
                    
                    Text("Date: \(entry.date.formatted())")
                        .font(.system(size: 8))
                        .foregroundColor(.red)
                    
                    // Test App Group access
                    Text("App Group: \(PokrokWidgetConfiguration.shared.getSharedUserDefaults() != nil ? "OK" : "FAIL")")
                        .font(.system(size: 8))
                        .foregroundColor(.red)
                    
                    // Test auth token
                    Text("Auth: \(PokrokWidgetConfiguration.shared.getSharedUserDefaults()?.string(forKey: "auth_token") != nil ? "OK" : "FAIL")")
                        .font(.system(size: 8))
                        .foregroundColor(.red)
                    
                    // Show available keys
                    Text("Keys: \(PokrokWidgetConfiguration.shared.getSharedUserDefaults()?.dictionaryRepresentation().keys.joined(separator: ", ") ?? "none")")
                        .font(.system(size: 6))
                        .foregroundColor(.red)
                        .lineLimit(2)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(entry.todaySteps.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { step in
                        HStack(spacing: 6) {
                            Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 12))
                                .foregroundColor(step.completed ? .green : .gray)
                            
                            Text(step.title)
                                .font(.system(size: 11))
                                .foregroundColor(step.completed ? .secondary : .primary)
                                .strikethrough(step.completed)
                                .lineLimit(1)
                            
                            Spacer()
                        }
                    }
                    
                    if entry.todaySteps.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.todaySteps.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
        }
        .padding(12)
        .background(Color(.systemBackground))
    }
}

struct FutureStepsWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Image(systemName: "calendar")
                    .foregroundColor(.blue)
                    .font(.system(size: 16, weight: .semibold))
                
                Text("Budoucí kroky")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text("\(entry.futureSteps.count)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }
            
            if entry.futureSteps.isEmpty {
                VStack(spacing: 4) {
                    Image(systemName: "calendar.badge.checkmark")
                        .font(.system(size: 24))
                        .foregroundColor(.blue)
                    
                    Text("Žádné budoucí kroky")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(entry.futureSteps.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { step in
                        HStack(spacing: 6) {
                            Image(systemName: "circle")
                                .font(.system(size: 12))
                                .foregroundColor(.blue)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(step.title)
                                    .font(.system(size: 11))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                
                                Text(step.date, style: .date)
                                    .font(.system(size: 9))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                        }
                    }
                    
                    if entry.futureSteps.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.futureSteps.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
        }
        .padding(12)
        .background(Color(.systemBackground))
    }
}

struct InspirationWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.yellow)
                    .font(.system(size: 16, weight: .semibold))
                
                Text("Inspirace")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            // Inspiration content
            VStack(spacing: 6) {
                Text(entry.inspiration.0)
                    .font(.system(size: family == .systemSmall ? 32 : 40))
                
                Text(entry.inspiration.1)
                    .font(.system(size: family == .systemSmall ? 11 : 13, weight: .medium))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(family == .systemSmall ? 2 : 3)
                
                Text(entry.inspiration.2)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(
                        Capsule()
                            .fill(Color.orange.opacity(0.15))
                    )
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            Spacer()
        }
        .padding(12)
        .background(Color(.systemBackground))
    }
}
