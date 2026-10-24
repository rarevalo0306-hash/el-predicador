import SwiftUI

@main
struct PreacherApp: App {
    @StateObject private var library = ReadingLibrary()
    var body: some Scene {
        WindowGroup {
            OnlineView(library: library)
            .tint(Color("AccentColor"))
        }
    }
}
