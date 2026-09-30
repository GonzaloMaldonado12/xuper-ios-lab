import Foundation
import Combine

struct StreamSource: Codable, Identifiable {
    let id: String
    let label: String
    let url: String
}
struct Episode: Codable, Identifiable {
    let id: String
    let title: String
    let season: Int
    let number: Int
    let sources: [StreamSource]
}
struct MediaTitle: Codable, Identifiable {
    let id: String
    let title: String
    let kind: String // movie, series, live
    let synopsis: String?
    let year: String?
    let sources: [StreamSource]?
    let episodes: [Episode]?
}
struct Catalog: Codable { let schemaVersion: Int; let titles: [MediaTitle] }
struct PlaybackRequest: Identifiable {
    let id: String
    let title: String
    let sources: [StreamSource]
}

func trustedURL(_ text: String) -> URL? {
    guard let url = URL(string: text), url.scheme?.lowercased() == "https",
          let host = url.host, !host.isEmpty, url.user == nil, url.password == nil else { return nil }
    return url
}

final class MediaStore: ObservableObject {
    @Published var titles: [MediaTitle] = []
    @Published var loading = false
    @Published var message = "El servicio de Xuper aún no está conectado."
    @Published var favorites: Set<String>
    @Published var progress: [String: Double]
    @Published var catalogURL: String
    private var request: URLSessionDataTask?
    private var generation = UUID()
    private let session = URLSession(configuration: .ephemeral)
    private let defaults = UserDefaults.standard

    init() {
        favorites = Set(UserDefaults.standard.stringArray(forKey: "favorites") ?? [])
        progress = UserDefaults.standard.dictionary(forKey: "progress") as? [String: Double] ?? [:]
        catalogURL = UserDefaults.standard.string(forKey: "catalogURL") ?? ""
        if !catalogURL.isEmpty { load() }
    }
    func toggle(_ id: String) {
        if favorites.contains(id) { favorites.remove(id) } else { favorites.insert(id) }
        defaults.set(Array(favorites), forKey: "favorites")
    }
    func save(_ id: String, seconds: Double) {
        guard seconds.isFinite, seconds >= 0 else { return }
        progress[id] = seconds
        defaults.set(progress, forKey: "progress")
    }
    func load() {
        let generation = UUID()
        self.generation = generation
        request?.cancel()
        guard let url = trustedURL(catalogURL.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            loading = false; message = "Introduce la URL HTTPS de un catálogo con acceso documentado."; return
        }
        catalogURL = url.absoluteString
        defaults.set(catalogURL, forKey: "catalogURL")
        loading = true
        message = "Conectando…"
        var query = URLRequest(url: url)
        query.timeoutInterval = 20
        query.setValue("application/json", forHTTPHeaderField: "Accept")
        request = session.dataTask(with: query) { [weak self] data, response, error in
            let result: Result<Catalog, Error> = Result {
                if let error = error { throw error }
                guard let response = response as? HTTPURLResponse, response.statusCode == 200,
                      response.url?.scheme == "https", let data = data, data.count <= 1_048_576 else {
                    throw NSError(domain: "Catalog", code: 1, userInfo: [NSLocalizedDescriptionKey: "El catálogo no está disponible o excede el tamaño admitido."])
                }
                let catalog = try JSONDecoder().decode(Catalog.self, from: data)
                guard catalog.schemaVersion == 1, catalog.titles.count <= 5000,
                      Set(catalog.titles.map { $0.id }).count == catalog.titles.count,
                      catalog.titles.allSatisfy({ !$0.id.isEmpty && !$0.title.isEmpty && ["movie", "series", "live"].contains($0.kind) }) else {
                    throw NSError(domain: "Catalog", code: 2, userInfo: [NSLocalizedDescriptionKey: "Formato de catálogo incompatible."])
                }
                return catalog
            }
            DispatchQueue.main.async {
                guard let self = self, self.generation == generation else { return }
                self.loading = false
                switch result {
                case .success(let catalog): self.titles = catalog.titles; self.message = catalog.titles.isEmpty ? "El proveedor no devolvió títulos." : ""
                case .failure: self.message = "No se pudo cargar el catálogo. Comprueba la dirección y el acceso al servicio."
                }
            }
        }
        request?.resume()
    }
}
