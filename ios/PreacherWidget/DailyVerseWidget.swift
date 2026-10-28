import ImageIO
import SwiftUI
import UIKit
import WidgetKit

/// Today's reference, theme and picture on the Home Screen. No Scripture text:
/// the LBLA licence keeps the words inside the reader, which the tap opens.
struct DailyEntry: TimelineEntry {
    let date: Date
    let ref: String
    let theme: String
    let url: URL
    let image: UIImage?

    static let sample = DailyEntry(date: .now, ref: "Salmos 23:1", theme: copy("Paz", "Peace"),
                                   url: URL(string: "https://www.thepreacher.app")!, image: nil)
}

private var english: Bool { Locale.current.language.languageCode?.identifier == "en" }
private func copy(_ es: String, _ en: String) -> String { english ? en : es }

private struct DailyInfo: Decodable {
    let ref: String
    let themeName: String
    let url: String
    let photo: String
}

struct DailyProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (DailyEntry) -> Void) {
        if context.isPreview { completion(.sample); return }
        Task { completion(await Self.load() ?? .sample) }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyEntry>) -> Void) {
        Task {
            let entry = await Self.load()
            // A new verse every day just after local midnight; retry sooner after a failure.
            let tomorrow = Calendar.current.nextDate(after: .now, matching: DateComponents(hour: 0, minute: 10),
                                                     matchingPolicy: .nextTime) ?? .now.addingTimeInterval(6 * 3600)
            let next = entry == nil ? Date.now.addingTimeInterval(30 * 60) : tomorrow
            completion(Timeline(entries: [entry ?? .sample], policy: .after(next)))
        }
    }

    private static func load() async -> DailyEntry? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        var components = URLComponents(string: "https://www.thepreacher.app/api/widget/today")!
        components.queryItems = [
            URLQueryItem(name: "day", value: formatter.string(from: .now)),
            URLQueryItem(name: "locale", value: english ? "en" : "es"),
        ]
        guard let requestURL = components.url,
              let result = try? await URLSession.shared.data(from: requestURL),
              (result.1 as? HTTPURLResponse)?.statusCode == 200,
              let info = try? JSONDecoder().decode(DailyInfo.self, from: result.0),
              let url = URL(string: info.url) else { return nil }
        var image: UIImage?
        if let photoURL = URL(string: info.photo), let photo = try? await URLSession.shared.data(from: photoURL) {
            image = downsample(photo.0, maxPixel: 800)
        }
        return DailyEntry(date: .now, ref: info.ref, theme: info.themeName, url: url, image: image)
    }

    /// Widgets have little memory: decode the photo straight to a small size.
    private static func downsample(_ data: Data, maxPixel: Int) -> UIImage? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixel,
        ]
        guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
        return UIImage(cgImage: image)
    }
}

struct DailyVerseView: View {
    let entry: DailyEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Spacer(minLength: 0)
            Text(entry.theme.uppercased())
                .font(.caption2.weight(.semibold))
                .tracking(1)
                .foregroundStyle(.white.opacity(0.85))
            Text(entry.ref)
                .font(family == .systemSmall ? Font.headline : Font.title3.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
            Text(copy("Tu palabra de hoy", "Your word for today"))
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.8))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
        .containerBackground(for: .widget) {
            ZStack {
                if let image = entry.image {
                    Image(uiImage: image).resizable().scaledToFill()
                } else {
                    LinearGradient(colors: [Color(red: 0.14, green: 0.25, blue: 0.42), Color(red: 0.06, green: 0.12, blue: 0.22)],
                                   startPoint: .topTrailing, endPoint: .bottomLeading)
                }
                LinearGradient(colors: [.clear, .black.opacity(0.7)], startPoint: .center, endPoint: .bottom)
            }
        }
        .widgetURL(entry.url)
        .accessibilityElement(children: .combine)
    }
}

struct DailyVerseWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "DailyVerse", provider: DailyProvider()) { DailyVerseView(entry: $0) }
            .configurationDisplayName(copy("Versículo del día", "Verse of the day"))
            .description(copy("La cita y la foto de hoy. Tócalo para leerlo.", "Today's reference and picture. Tap to read it."))
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct PreacherWidgetBundle: WidgetBundle {
    var body: some Widget { DailyVerseWidget() }
}
