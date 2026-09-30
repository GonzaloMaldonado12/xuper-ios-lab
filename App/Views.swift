import SwiftUI

struct RootView: View {
    @ObservedObject var store: MediaStore
    var body: some View {
        TabView {
            BrowserView(store: store, category: nil).tabItem { Image(systemName: "house.fill"); Text("Inicio") }
            BrowserView(store: store, category: "movie").tabItem { Image(systemName: "film"); Text("Películas") }
            BrowserView(store: store, category: "series").tabItem { Image(systemName: "tv"); Text("Series") }
            BrowserView(store: store, category: "live").tabItem { Image(systemName: "antenna.radiowaves.left.and.right"); Text("TV") }
            SettingsView(store: store).tabItem { Image(systemName: "gear"); Text("Ajustes") }
        }.accentColor(Color(red: 0.1, green: 0.8, blue: 0.9))
    }
}
struct BrowserView: View {
    @ObservedObject var store: MediaStore
    let category: String?
    @State private var query = ""
    @State private var favoritesOnly = false
    var filtered: [MediaTitle] {
        store.titles.filter {
            (category == nil || $0.kind == category) && (!favoritesOnly || store.favorites.contains($0.id)) &&
            (query.isEmpty || $0.title.localizedCaseInsensitiveContains(query))
        }
    }
    var heading: String { category == "movie" ? "Películas" : category == "series" ? "Series" : category == "live" ? "TV en directo" : "Xuper · iOS" }
    var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "magnifyingglass").foregroundColor(.secondary)
                    TextField("Buscar título", text: $query).autocapitalization(.none)
                    if !query.isEmpty { Button(action: { self.query = "" }) { Image(systemName: "xmark.circle.fill") } }
                }.padding(12).background(Color.white.opacity(0.07)).cornerRadius(12).padding(.horizontal)
                Toggle("Solo mis favoritos", isOn: $favoritesOnly).padding(.horizontal)
                if store.loading { Text("Cargando…").foregroundColor(.secondary) }
                if !store.message.isEmpty { Text(store.message).foregroundColor(.secondary).padding().multilineTextAlignment(.center) }
                List(filtered) { media in
                    NavigationLink(destination: DetailView(store: self.store, media: media)) {
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12).fill(Color.blue.opacity(0.18))
                                Image(systemName: media.kind == "live" ? "tv" : "play.circle.fill").font(.largeTitle).foregroundColor(Color(red: 0.1, green: 0.8, blue: 0.9))
                            }.frame(width: 62, height: 82)
                            VStack(alignment: .leading, spacing: 7) {
                                Text(media.title).font(.headline)
                                Text(media.year ?? (media.kind == "live" ? "EN DIRECTO" : "")).font(.caption).foregroundColor(.secondary)
                                if self.store.progress[media.id, default: 0] > 0 { Text("Continuar viendo").font(.caption).foregroundColor(Color(red: 0.1, green: 0.8, blue: 0.9)) }
                            }
                            Spacer()
                            if self.store.favorites.contains(media.id) { Image(systemName: "heart.fill").foregroundColor(Color(red: 0.1, green: 0.8, blue: 0.9)) }
                        }.padding(.vertical, 5)
                    }
                }.listStyle(PlainListStyle())
            }.navigationBarTitle(heading).navigationBarItems(trailing: Button(action: { self.store.load() }) { Image(systemName: "arrow.clockwise") })
        }.navigationViewStyle(StackNavigationViewStyle())
    }
}
struct DetailView: View {
    @ObservedObject var store: MediaStore
    let media: MediaTitle
    @State private var playback: PlaybackRequest?
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                ZStack {
                    LinearGradient(gradient: Gradient(colors: [.blue.opacity(0.35), .black]), startPoint: .topLeading, endPoint: .bottomTrailing)
                    Image(systemName: "play.circle").font(.system(size: 76)).foregroundColor(Color(red: 0.1, green: 0.8, blue: 0.9))
                }.frame(height: 210).cornerRadius(20)
                Text(media.title).font(.largeTitle).bold()
                Text(media.synopsis ?? "").foregroundColor(.secondary)
                Button(action: { self.store.toggle(self.media.id) }) {
                    Label13(text: store.favorites.contains(media.id) ? "Quitar de favoritos" : "Guardar en favoritos", symbol: "heart")
                }
                if let sources = media.sources, !sources.isEmpty {
                    Button(action: { self.playback = PlaybackRequest(id: self.media.id, title: self.media.title, sources: sources) }) {
                        Label13(text: store.progress[media.id, default: 0] > 0 ? "Continuar viendo" : "Reproducir", symbol: "play.fill")
                            .frame(maxWidth: .infinity).padding().background(Color.blue).cornerRadius(14)
                    }.foregroundColor(.white)
                }
                ForEach(media.episodes ?? []) { episode in
                    Button(action: { self.playback = PlaybackRequest(id: episode.id, title: episode.title, sources: episode.sources) }) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text("T\(episode.season) · E\(episode.number)").font(.caption).foregroundColor(.secondary)
                                Text(episode.title)
                            }
                            Spacer(); Image(systemName: "play.circle.fill")
                        }.padding().background(Color.white.opacity(0.06)).cornerRadius(12)
                    }
                }
                if (media.sources ?? []).isEmpty && (media.episodes ?? []).isEmpty { Text("El proveedor no ha suministrado una fuente reproducible.").foregroundColor(.secondary) }
            }.padding()
        }.navigationBarTitle("Ficha", displayMode: .inline)
            .sheet(item: $playback) { item in PlaybackView(store: self.store, request: item) }
    }
}
struct Label13: View {
    let text: String; let symbol: String
    var body: some View { HStack { Image(systemName: symbol); Text(text) } }
}
struct SettingsView: View {
    @ObservedObject var store: MediaStore
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Conexión al servicio")) {
                    Text("El acceso al servicio de Xuper aún no está integrado. Este proyecto usa un contrato de catálogo propio, pendiente de un adaptador verificado.").font(.footnote).foregroundColor(.secondary)
                    TextField("URL HTTPS del catálogo", text: $store.catalogURL).keyboardType(.URL).autocapitalization(.none).disableAutocorrection(true)
                    Button("Cargar catálogo", action: store.load)
                }
                Section(header: Text("Reproducción")) {
                    Text("Audio y subtítulos: controles nativos cuando la fuente incluye pistas. Preferencia de subtítulos: español. Calidad: variantes suministradas por el proveedor.")
                }
                Section(header: Text("Este proyecto")) {
                    Text("Reconstrucción independiente para iPhone. No es una versión oficial ni una conversión binaria de la APK.").font(.footnote)
                    Text("Favoritos e historial se guardan en este dispositivo.")
                }
            }.navigationBarTitle("Ajustes")
        }.navigationViewStyle(StackNavigationViewStyle())
    }
}
