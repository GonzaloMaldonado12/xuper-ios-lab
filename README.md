# Reconstrucción nativa para iPhone 11

Proyecto propio Swift/SwiftUI/AVKit en `XuperStudy.xcodeproj`, mínimo iOS 13.0. No es código iOS extraído del APK, una versión oficial ni un cliente conectado al servicio de Xuper. El código está escrito; no se ha compilado ni probado en Xcode o un teléfono. No hay IPA firmada. No se garantiza compatibilidad con todas las versiones futuras de iOS.

Incluye navegación de inicio/películas/series/directos, búsqueda, fichas, favoritos, capítulos, historial por título o episodio, selección de fuentes de calidad, AVPlayerViewController con controles nativos y preferencia por pistas de subtítulos españoles disponibles. Favoritos, progreso y URL de catálogo se guardan en UserDefaults de esta app. Sin dependencias de terceros ni reutilización de binarios, claves o telemetría del APK. No requiere cámara, micrófono, contactos, instalación de paquetes ni acceso global al almacenamiento. Las conexiones aceptadas son HTTPS; no se habilitan excepciones globales de ATS. Esto describe el diseño, no una auditoría que certifique seguridad.

**El catálogo y acceso multimedia de Xuper no están integrados.** Se conserva vacío para no presentar vídeos o accesos ficticios. La UI tiene una conexión para un contrato JSON propio; no es una API descubierta de Xuper. Falta desarrollar un adaptador usando acceso verificable al servicio. Ese paso no queda resuelto por compilar la interfaz.

## Contrato propio de catálogo

`catalog-contract.example.json` muestra el sobre vacío. `titles` admite objetos con `id`, `title`, `kind` (`movie`, `series`, `live`), `synopsis` y `year` opcionales. `sources` contiene objetos `{ "id": "identificador", "label": "calidad / variante", "url": "URL HTTPS real suministrada por el proveedor" }`. `episodes` contiene `{ "id": "id único", "title": "título", "season": 1, "number": 1, "sources": [] }`. Los IDs de títulos y episodios deben ser estables y únicos para mantener progreso; los IDs de variantes deben ser únicos dentro de su lista. No se configuran URLs de reproducción de ejemplo ni se incluyen contenidos alternativos.

El reproductor depende de formatos y códecs compatibles con AVFoundation. La preferencia española selecciona una pista que exista en la fuente; no obtiene traducciones ni descarga subtítulos SRT externos. Audio y otras pistas se eligen mediante controles nativos. No se implementaron login Xuper, DRM, cast del protocolo Android, Picture in Picture fuera de las capacidades nativas, ni descargas offline. Cambiar una variante conserva posición cuando la duración lo permite.

## Compilar y ejecutar cuando haya Mac

Si solo tienes Windows: [compilación remota e instalación nativa](INSTALAR-DESDE-WINDOWS.md). Workflow preparado, sin ejecutar; no requiere publicar el APK ni dar tu contraseña al agente.

1. Copia esta carpeta al Mac y abre `XuperStudy.xcodeproj` en un Xcode que admita el deployment target elegido y el sistema del teléfono. El objetivo 13.0 aún no se comprobó contra un SDK real; las versiones nuevas de Xcode pueden requerir elevarlo.
2. Selecciona el target XuperStudy. En Signing & Capabilities elige tu equipo de desarrollo; cambia el bundle identifier si se requiere para tu cuenta. No envíes credenciales a este chat.
3. Conecta el iPhone 11, confía en el Mac y selecciona el teléfono como destino. Activa Developer Mode si la versión del sistema y el flujo de instalación lo requieren.
4. Compila primero en simulador y resuelve cualquier diagnóstico real. Después ejecuta en el teléfono. Este proyecto no ha pasado esa fase todavía.
5. Prueba acceso real al servicio, inicio de reproducción, audio original, subtítulos españoles, cambio de calidad, reanudación, errores de red y rotación antes de considerar completada la adaptación.

Apple: [requisitos de Xcode/macOS](https://developer.apple.com/xcode/system-requirements/), [ejecutar en un dispositivo y firma](https://help.apple.com/xcode/mac/current/en.lproj/dev5a825a1ca.html), [pistas de subtítulos y audio](https://developer.apple.com/documentation/avfoundation/selecting-subtitles-and-alternative-audio-tracks), [UserDefaults y manifest de privacidad](https://developer.apple.com/documentation/foundation/userdefaults). Manifest de privacidad CA92.1 para preferencias propias: [reasons API](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype).

La validación local de Windows comprueba estructura de archivos/plists; no sustituye Swift compiler, Xcode, AVFoundation ni pruebas iOS. La elección de APK permanece sin dictamen de confianza; [análisis](../docs/XUPER-REVIEW.md).
