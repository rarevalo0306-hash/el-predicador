import AuthenticationServices
import CryptoKit
import Security
import WebKit

@MainActor
final class NativeAuthController: NSObject, WKScriptMessageHandler, ASWebAuthenticationPresentationContextProviding {
    weak var web: WKWebView?
    var onError: ((String) -> Void)?
    private var session: ASWebAuthenticationSession?
    private var active = false

    init(web: WKWebView) { self.web = web }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        guard message.frameInfo.isMainFrame, origin.protocol == "https",
              ["www.thepreacher.app", "thepreacher.app"].contains(origin.host),
              let body = message.body as? [String: String],
              let provider = body["provider"], ["google", "apple"].contains(provider) else { return }
        begin(provider: provider)
    }

    private func randomToken() throws -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw AuthError.invalid }
        return Data(bytes).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }

    func begin(provider: String) {
        guard !active, web?.window != nil else { return }
        do {
            let verifier = try randomToken()
            let state = try randomToken()
            let digest = Data(SHA256.hash(data: Data(verifier.utf8))).base64EncodedString()
                .replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
            var start = URLComponents(url: WebSession.home.appending(path: "api/native-auth/start"), resolvingAgainstBaseURL: false)!
            start.queryItems = [URLQueryItem(name: "provider", value: provider), URLQueryItem(name: "challenge", value: digest), URLQueryItem(name: "state", value: state)]
            active = true
            let auth = ASWebAuthenticationSession(url: start.url!, callbackURLScheme: "thepreacher") { [weak self] url, error in
                Task { @MainActor in
                    guard let self else { return }
                    defer { self.active = false; self.session = nil }
                    if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin { return }
                    do {
                        guard error == nil, let url, url.scheme == "thepreacher", url.host == "auth",
                              let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
                              parts.queryItems?.first(where: { $0.name == "state" })?.value == state,
                              let code = parts.queryItems?.first(where: { $0.name == "code" })?.value else { throw AuthError.invalid }
                        try await self.exchange(code: code, verifier: verifier)
                    } catch {
                        self.onError?(String(localized: "No se pudo completar el acceso. Vuelve a intentarlo. Puedes seguir leyendo sin iniciar sesión."))
                    }
                }
            }
            auth.presentationContextProvider = self
            auth.prefersEphemeralWebBrowserSession = true
            session = auth
            if !auth.start() { active = false; session = nil; throw AuthError.invalid }
        } catch { onError?("No pudimos abrir el acceso seguro. Vuelve a intentarlo.") }
    }

    private func exchange(code: String, verifier: String) async throws {
        let endpoint = WebSession.home.appending(path: "api/native-auth/exchange")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["code": code, "verifier": verifier])
        let network = URLSession(configuration: .ephemeral, delegate: NoAuthRedirects(), delegateQueue: nil)
        defer { network.invalidateAndCancel() }
        let (_, response) = try await network.data(for: request)
        guard let response = response as? HTTPURLResponse, response.statusCode == 200,
              response.url?.host == endpoint.host,
              let value = response.value(forHTTPHeaderField: "Set-Cookie"), let web else { throw AuthError.invalid }
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: ["Set-Cookie": value], for: endpoint)
        guard let cookie = cookies.first(where: { $0.name == "__Host-grok-auth.session_token" }), cookie.isSecure, cookie.isHTTPOnly, cookie.path == "/", cookie.domain == endpoint.host else { throw AuthError.invalid }
        let storage = web.configuration.websiteDataStore.httpCookieStore
        for old in await storage.allCookies() where old.name.hasPrefix("__Host-grok-auth.") {
            await storage.deleteCookie(old)
        }
        await storage.setCookie(cookie)
        web.load(URLRequest(url: WebSession.home))
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        web?.window ?? ASPresentationAnchor()
    }
    private enum AuthError: Error { case invalid }
}

/** Never forward a code + PKCE proof to a redirect destination. */
private final class NoAuthRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}
