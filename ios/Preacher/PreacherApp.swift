import SwiftUI

@main
struct PreacherApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var library = ReadingLibrary()
    var body: some Scene {
        WindowGroup {
            OnlineView(library: library)
            .tint(Color("AccentColor"))
            // Universal links (shared passages) and the widget's link.
            .onOpenURL { AppRouter.shared.open($0) }
        }
    }
}
