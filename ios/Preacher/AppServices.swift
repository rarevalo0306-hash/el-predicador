import SwiftUI
import UIKit
import UserNotifications
import WebKit

/// Sends notification taps, universal links and quick actions into the app.
@MainActor
final class AppRouter: ObservableObject {
    static let shared = AppRouter()
    @Published var pendingURL: URL?
    @Published var showLibrary = false

    /// Only first-party https pages load in the app; anything else is ignored.
    func open(_ url: URL) {
        guard url.scheme == "https",
              ["www.thepreacher.app", "thepreacher.app"].contains(url.host?.lowercased() ?? "") else { return }
        pendingURL = url
    }

    @discardableResult
    func perform(shortcut type: String) -> Bool {
        switch QuickAction(rawValue: type) {
        case .today?: open(WebSession.home)
        case .bible?: open(URL(string: "https://www.thepreacher.app/?abrir=biblia")!)
        case .library?: showLibrary = true
        case nil: return false
        }
        return true
    }
}

/// Long-press menu on the app icon.
enum QuickAction: String, CaseIterable {
    case today = "app.thepreacher.ios.today"
    case bible = "app.thepreacher.ios.bible"
    case library = "app.thepreacher.ios.library"

    var item: UIApplicationShortcutItem {
        let title: String
        let symbol: String
        switch self {
        case .today: title = String(localized: "Versículo de hoy"); symbol = "sun.max"
        case .bible: title = String(localized: "Biblia"); symbol = "book"
        case .library: title = String(localized: "Mis lecturas"); symbol = "books.vertical"
        }
        return UIApplicationShortcutItem(type: rawValue, localizedTitle: title, localizedSubtitle: nil,
                                         icon: UIApplicationShortcutIcon(systemImageName: symbol))
    }
}

/// The daily reminder as a real push. The web page asks for it from Ajustes
/// through the `preacherPush` handler; the server sends it at the chosen hour.
@MainActor
final class PushCoordinator: NSObject, WKScriptMessageHandler {
    static let shared = PushCoordinator()
    weak var web: WKWebView?
    private let defaults = UserDefaults.standard
    private enum Key {
        static let enabled = "push.enabled"
        static let hour = "push.hour"
        static let locale = "push.locale"
        static let token = "push.token"
    }
    private static let endpoint = WebSession.home.appending(path: "api/push/devices")

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        guard message.frameInfo.isMainFrame, origin.protocol == "https",
              ["www.thepreacher.app", "thepreacher.app"].contains(origin.host),
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }
        switch action {
        case "enable":
            let hour = min(23, max(0, (body["hour"] as? NSNumber)?.intValue ?? 8))
            let locale = (body["locale"] as? String) == "en" ? "en" : "es"
            Task { await enable(hour: hour, locale: locale) }
        case "disable":
            Task { await disable() }
        default:
            break
        }
    }

    /// At launch: Apple can change the token, and the time zone may have moved.
    func refreshRegistration() {
        guard defaults.bool(forKey: Key.enabled) else { return }
        UIApplication.shared.registerForRemoteNotifications()
    }

    func enable(hour: Int, locale: String) async {
        defaults.set(hour, forKey: Key.hour)
        defaults.set(locale, forKey: Key.locale)
        let granted = (try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound])) ?? false
        defaults.set(granted, forKey: Key.enabled)
        if granted {
            UIApplication.shared.registerForRemoteNotifications()
            if defaults.string(forKey: Key.token) != nil { await upload() }
        }
        report(granted: granted)
    }

    func disable() async {
        defaults.set(false, forKey: Key.enabled)
        guard let token = defaults.string(forKey: Key.token) else { return }
        var request = URLRequest(url: Self.endpoint)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["token": token])
        _ = try? await URLSession.shared.data(for: request)
    }

    func didRegister(deviceToken: Data) {
        defaults.set(deviceToken.map { String(format: "%02x", $0) }.joined(), forKey: Key.token)
        guard defaults.bool(forKey: Key.enabled) else { return }
        Task { await upload() }
    }

    private func upload() async {
        guard let token = defaults.string(forKey: Key.token) else { return }
        #if DEBUG
        let environment = "sandbox"
        #else
        let environment = "production"
        #endif
        let body: [String: Any] = [
            "token": token,
            "hour": defaults.object(forKey: Key.hour) as? Int ?? 8,
            "locale": defaults.string(forKey: Key.locale) ?? "es",
            "timeZone": TimeZone.current.identifier,
            "environment": environment,
        ]
        var request = URLRequest(url: Self.endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: request)
    }

    /// Lets the page's switch know how the permission prompt ended.
    private func report(granted: Bool) {
        web?.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('preacher-push',{detail:{granted:\(granted)}}))"
        )
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        application.shortcutItems = QuickAction.allCases.map(\.item)
        Task { @MainActor in PushCoordinator.shared.refreshRegistration() }
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // A quick action that launched the app arrives here; later ones go to SceneDelegate.
        if let shortcut = options.shortcutItem {
            Task { @MainActor in AppRouter.shared.perform(shortcut: shortcut.type) }
        }
        let configuration = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
        configuration.delegateClass = SceneDelegate.self
        return configuration
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Task { @MainActor in PushCoordinator.shared.didRegister(deviceToken: deviceToken) }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {}

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        if let link = response.notification.request.content.userInfo["url"] as? String, let url = URL(string: link) {
            Task { @MainActor in AppRouter.shared.open(url) }
        }
        completionHandler()
    }
}

final class SceneDelegate: NSObject, UIWindowSceneDelegate {
    func windowScene(_ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        Task { @MainActor in completionHandler(AppRouter.shared.perform(shortcut: shortcutItem.type)) }
    }
}
