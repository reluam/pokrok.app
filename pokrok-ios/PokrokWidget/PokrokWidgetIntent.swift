import Foundation
import AppIntents
import WidgetKit

// AppIntent pro výběr typu widgetu
struct SelectWidgetTypeIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Vyberte typ widgetu"
    static var description = IntentDescription("Vyberte, jaký obsah chcete zobrazit ve widgetu")
    
    @Parameter(title: "Typ widgetu", default: .todaySteps)
    var widgetType: WidgetTypeAppEnum
}

// AppEnum pro typy widgetu
enum WidgetTypeAppEnum: String, AppEnum, @unchecked Sendable {
    case todaySteps
    case futureSteps
    case inspiration
    
    static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Typ widgetu")
    }
    
    static var caseDisplayRepresentations: [WidgetTypeAppEnum: DisplayRepresentation] {
        [
            .todaySteps: DisplayRepresentation(
                title: "Dnešní kroky",
                subtitle: "Zobrazuje dnešní kroky a zpožděné úkoly"
            ),
            .futureSteps: DisplayRepresentation(
                title: "Dnešní a budoucí",
                subtitle: "Zobrazuje dnešní i budoucí kroky"
            ),
            .inspiration: DisplayRepresentation(
                title: "Inspirace",
                subtitle: "Zobrazuje náhodné inspirace a aktivity"
            )
        ]
    }
}

// Extension pro konverzi mezi AppEnum a WidgetType
extension WidgetTypeAppEnum {
    var toWidgetType: WidgetType {
        switch self {
        case .todaySteps:
            return .todaySteps
        case .futureSteps:
            return .futureSteps
        case .inspiration:
            return .inspiration
        }
    }
}
