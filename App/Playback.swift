import SwiftUI
import AVKit

final class PlaybackSession: ObservableObject {
    let player = AVPlayer()
    @Published var error: String?
    @Published var selected = ""
    private var observation: NSKeyValueObservation?
    private var timer: Any?
    private var onProgress: ((Double) -> Void)?

    func load(_ source: StreamSource, resume: Double, progress: @escaping (Double) -> Void) {
        guard let url = trustedURL(source.url) else { error = "La fuente debe ser una URL HTTPS sin credenciales incluidas."; return }
        onProgress = progress
        selected = source.id
        error = nil
        observation = nil
        if let timer = timer { player.removeTimeObserver(timer); self.timer = nil }
        let item = AVPlayerItem(url: url)
        player.replaceCurrentItem(with: item)
        observation = item.observe(\.status, options: [.initial, .new]) { [weak self] item, _ in
            DispatchQueue.main.async {
                guard let self = self, self.player.currentItem === item else { return }
                if item.status == .failed { self.error = "No se pudo reproducir esta fuente. Comprueba acceso, conexión y formato." }
                if item.status == .readyToPlay {
                    if let group = item.asset.mediaSelectionGroup(forMediaCharacteristic: .legible), let option = group.options.first(where: { $0.locale?.languageCode == "es" || $0.extendedLanguageTag?.hasPrefix("es") == true }) {
                        item.select(option, in: group)
                    }
                    if resume > 0 && item.duration.seconds.isFinite && resume < item.duration.seconds {
                        self.player.seek(to: CMTime(seconds: resume, preferredTimescale: 600))
                    }
                    self.player.play()
                }
            }
        }
        timer = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 5, preferredTimescale: 600), queue: .main) { [weak self] time in
            guard let self = self, time.seconds.isFinite else { return }
            self.onProgress?(time.seconds)
        }
    }
    func stop() {
        let seconds = player.currentTime().seconds
        if seconds.isFinite && seconds > 0 { onProgress?(seconds) }
        onProgress = nil
        player.pause()
        observation = nil
        if let timer = timer { player.removeTimeObserver(timer); self.timer = nil }
    }
    deinit { if let timer = timer { player.removeTimeObserver(timer) } }
}
struct NativePlayer: UIViewControllerRepresentable {
    let player: AVPlayer
    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        controller.player = player
        controller.allowsPictureInPicturePlayback = true
        return controller
    }
    func updateUIViewController(_ controller: AVPlayerViewController, context: Context) { controller.player = player }
}
struct PlaybackView: View {
    let store: MediaStore
    let request: PlaybackRequest
    @State private var session = PlaybackSession()
    var body: some View { PlaybackControls(store: store, request: request, session: session) }
}
struct PlaybackControls: View {
    @ObservedObject var store: MediaStore
    let request: PlaybackRequest
    @ObservedObject var session: PlaybackSession
    @Environment(\.presentationMode) private var presentation
    var body: some View {
        VStack(spacing: 14) {
            HStack {
                Text(request.title).font(.headline)
                Spacer()
                Button("Cerrar") { self.presentation.wrappedValue.dismiss() }
            }.padding()
            NativePlayer(player: session.player).frame(maxWidth: .infinity, maxHeight: .infinity)
            if let error = session.error { Text(error).foregroundColor(.orange).padding() }
            ScrollView(.horizontal) {
                HStack {
                    ForEach(request.sources) { source in
                        Button(action: {
                            let time = self.session.player.currentTime().seconds
                            self.start(source, resume: time.isFinite ? time : 0)
                        }) {
                            Text(source.label).padding(12).background(self.session.selected == source.id ? Color.blue : Color.gray.opacity(0.2)).cornerRadius(12)
                        }.foregroundColor(.white)
                    }
                }.padding(.horizontal)
            }
        }.background(Color.black.edgesIgnoringSafeArea(.all))
            .onAppear {
                try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
                try? AVAudioSession.sharedInstance().setActive(true)
                if let first = self.request.sources.first { self.start(first, resume: self.store.progress[self.request.id, default: 0]) }
                else { self.session.error = "El proveedor no suministró fuentes para este episodio." }
            }.onDisappear { self.session.stop(); try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation) }
    }
    private func start(_ source: StreamSource, resume: Double) {
        let store = store
        let id = request.id
        session.load(source, resume: resume) { [weak store] seconds in store?.save(id, seconds: seconds) }
    }
}
