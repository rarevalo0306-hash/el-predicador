import Foundation
import Combine

struct Reading: Codable, Identifiable, Equatable {
    var id = UUID()
    var title: String
    var text: String
    var source: URL?
    var createdAt = Date()
}

@MainActor
final class ReadingLibrary: ObservableObject {
    @Published private(set) var readings: [Reading] = []
    @Published var error: String?
    private let file: URL
    private(set) var loadFailed = false

    init(file: URL? = nil) {
        self.file = file ?? URL.documentsDirectory.appending(path: "readings.json")
        do {
            if FileManager.default.fileExists(atPath: self.file.path) {
                readings = try JSONDecoder().decode([Reading].self, from: Data(contentsOf: self.file))
            }
        } catch {
            loadFailed = true
            self.error = String(localized: "No pudimos abrir tus lecturas. El archivo original se conserva.")
        }
    }

    @discardableResult
    func save(title: String, text: String, source: URL?) -> Bool {
        let title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty, !text.isEmpty, title.count <= 200, text.count <= 50_000 else {
            error = String(localized: "Escribe un título (hasta 200 caracteres) y una lectura (hasta 50.000).")
            return false
        }
        return persist([Reading(title: title, text: text, source: source)] + readings)
    }

    @discardableResult
    func delete(_ reading: Reading) -> Bool {
        persist(readings.filter { $0.id != reading.id })
    }

    private func persist(_ next: [Reading]) -> Bool {
        // Never overwrite an unreadable library after a load failure.
        guard !loadFailed else { return false }
        error = nil
        do {
            let data = try JSONEncoder().encode(next)
            try data.write(to: file, options: [.atomic, .completeFileProtectionUnlessOpen])
            readings = next
            return true
        } catch {
            self.error = String(localized: "No pudimos guardar el cambio. Tus lecturas anteriores se conservan.")
            return false
        }
    }
}
