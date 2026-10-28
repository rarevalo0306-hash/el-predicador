import SwiftUI
import WebKit

@MainActor
final class WebSession: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    static let home = URL(string: "https://www.thepreacher.app")!
    @Published var loading = true
    @Published var failure: String?
    @Published var canGoBack = false
    @Published var externalURL: URL?
    @Published var authError: String?
    private var nativeAuth: NativeAuthController?
    let web: WKWebView

    override init() {
        let config = WKWebViewConfiguration()
        // Persistent first-party cookies keep the existing email/password session.
        config.websiteDataStore = .default()
        web = WKWebView(frame: .zero, configuration: config)
        super.init()
        let controller = NativeAuthController(web: web)
        controller.onError = { [weak self] message in self?.authError = message }
        nativeAuth = controller
        web.configuration.userContentController.add(controller, name: "preacherAuth")
        web.configuration.userContentController.add(PushCoordinator.shared, name: "preacherPush")
        PushCoordinator.shared.web = web
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsBackForwardNavigationGestures = true
        web.isOpaque = false
        web.backgroundColor = .systemBackground
        web.scrollView.backgroundColor = .systemBackground
        web.load(URLRequest(url: Self.home))
    }

    func reload() {
        failure = nil
        loading = true
        if web.url == nil { web.load(URLRequest(url: Self.home)) } else { web.reload() }
    }

    func navigationPolicy(for url: URL) -> WKNavigationActionPolicy {
        if url.scheme == "about" { return .allow }
        if url.scheme == "https", ["www.thepreacher.app", "thepreacher.app"].contains(url.host?.lowercased() ?? "") { return .allow }
        // External pages and app links require a user confirmation in native UI.
        if ["https", "http", "mailto", "tel", "sms", "whatsapp"].contains(url.scheme?.lowercased() ?? "") {
            externalURL = url
        }
        return .cancel
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        // Do not intercept third-party subframes as top-level navigation.
        if let frame = navigationAction.targetFrame, !frame.isMainFrame { decisionHandler(.allow); return }
        decisionHandler(navigationPolicy(for: url))
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, navigationPolicy(for: url) == .allow {
            webView.load(URLRequest(url: url))
        }
        return nil
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) { loading = true; failure = nil }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { loading = false; canGoBack = webView.canGoBack }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { failed(error) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { failed(error) }
    private func failed(_ error: Error) {
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        loading = false
        failure = String(localized: "No pudimos conectar con The Preacher. Comprueba tu conexión y vuelve a intentarlo. Tus notas personales siguen disponibles en Mis lecturas.")
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if navigationResponse.isForMainFrame, let response = navigationResponse.response as? HTTPURLResponse, response.statusCode >= 400 {
            loading = false
            failure = String(localized: "The Preacher no está disponible en este momento. Vuelve a intentarlo en unos minutos.")
            decisionHandler(.cancel)
        } else { decisionHandler(.allow) }
    }

    private func presenter() -> UIViewController? {
        var controller = web.window?.rootViewController
        while let next = controller?.presentedViewController { controller = next }
        return controller
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard let presenter = presenter() else { completionHandler(); return }
        let alert = UIAlertController(title: "The Preacher", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Aceptar", style: .default) { _ in completionHandler() })
        presenter.present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard let presenter = presenter() else { completionHandler(false); return }
        let alert = UIAlertController(title: "The Preacher", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "Confirmar", style: .default) { _ in completionHandler(true) })
        presenter.present(alert, animated: true)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        loading = false
        failure = String(localized: "La lectura se interrumpió. Pulsa Reintentar para volver a abrirla.")
    }


}

struct PreacherWebView: UIViewRepresentable {
    let session: WebSession
    func makeUIView(context: Context) -> WKWebView { session.web }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct OnlineView: View {
    @ObservedObject var library: ReadingLibrary
    @StateObject private var session = WebSession()
    @ObservedObject private var router = AppRouter.shared
    @State private var draft: ReadingDraft?
    @State private var showLibrary = false
    @State private var showInformation = false
    @Environment(\.openURL) private var openURL
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                PreacherWebView(session: session)
                if session.loading { ProgressView().padding(12).background(.regularMaterial, in: Capsule()).padding(8).accessibilityLabel("Cargando Predicador") }
                if let failure = session.failure {
                    ContentUnavailableView {
                        Label("No se pudo abrir Predicador", systemImage: "wifi.exclamationmark")
                    } description: { Text(failure) } actions: {
                        Button("Reintentar") { session.reload() }.buttonStyle(.borderedProminent).foregroundStyle(Color(.systemBackground))
                    }.frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(.systemBackground))
                }
            }
            .navigationTitle("The Preacher")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if session.canGoBack {
                        Button("Atrás", systemImage: "chevron.backward") { session.web.goBack() }.labelStyle(.iconOnly)
                    }
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button("Nueva nota", systemImage: "square.and.pencil") {
                        draft = ReadingDraft(title: "", text: "", source: nil)
                    }.labelStyle(.iconOnly)
                    Button("Mis lecturas", systemImage: "books.vertical") { showLibrary = true }.labelStyle(.iconOnly)
                    Menu {
                        Button("Recargar", systemImage: "arrow.clockwise") { session.reload() }.disabled(session.loading)
                        Button("Información", systemImage: "info.circle") { showInformation = true }
                    } label: { Label("Más opciones", systemImage: "ellipsis.circle").labelStyle(.iconOnly) }
                }
            }
            .alert("No se pudo entrar", isPresented: Binding(get: { session.authError != nil }, set: { if !$0 { session.authError = nil } })) {
                Button("Aceptar") { session.authError = nil }
            } message: { Text(session.authError ?? "") }
            .onAppear { openPending() }
            .onChange(of: router.pendingURL) { _, _ in openPending() }
            .onChange(of: router.showLibrary) { _, show in
                if show { showLibrary = true; router.showLibrary = false }
            }
            .sheet(item: $draft) { ReadingEditor(library: library, draft: $0) }
            .sheet(isPresented: $showLibrary) { LibraryView(library: library) }
            .sheet(isPresented: $showInformation) { InformationView() }
            .confirmationDialog("Abrir enlace fuera de The Preacher", isPresented: Binding(get: { session.externalURL != nil }, set: { if !$0 { session.externalURL = nil } }), titleVisibility: .visible) {
                if let url = session.externalURL {
                    Button("Abrir enlace") { openURL(url); session.externalURL = nil }
                }
            } message: {
                Text(session.externalURL?.host ?? session.externalURL?.scheme ?? "")
            }
        }
    }

    /// A passage from a notification, link or quick action replaces the page.
    private func openPending() {
        guard let url = router.pendingURL else { return }
        router.pendingURL = nil
        showLibrary = false
        session.failure = nil
        session.web.load(URLRequest(url: url))
    }
}
