# Traspaso a Claude — Xuper para iPhone 11

Estado al 2026-09-30, zona America/Santiago. Este documento resume hechos verificados y pendientes; no declara completo el objetivo del usuario.

## Leer primero

1. Este documento.
2. `README.md` y `INSTALAR-DESDE-WINDOWS.md`.
3. `App/MediaStore.swift`, `App/Playback.swift` y `App/Views.swift`, según la tarea.
4. `docs/evidence/` para evidencias de compilación e integridad.

## Objetivo y alcance autorizado

El usuario quiere una app para su iPhone 11 con una experiencia similar a Xuper TV y acceso multimedia. Canceló expresamente el proyecto Lumen. Solo dispone de Windows; no tiene Mac, no indicó la versión de iOS y no tiene suscripciones a los proveedores comerciales mencionados. Autorizó crear un repositorio nuevo, trabajar en él y avanzar con la instalación. **No modificar Animamente ni ningún proyecto anterior.**

La implementación actual es una reconstrucción independiente Swift/SwiftUI/AVKit. No es una conversión binaria de Android, una app oficial de Xuper ni una réplica funcional de su backend. **El catálogo está vacío y el servicio multimedia de Xuper no está integrado.** Firmar o instalar esta IPA no añade ese acceso. No se encontró un contrato público documentado del backend en las fuentes revisadas; no presentar URLs inventadas, credenciales extraídas ni contenidos ficticios como integración realizada.

## Ubicación y aislamiento

- Repositorio privado: https://github.com/GonzaloMaldonado12/xuper-ios-lab
- Raíz Git propia: `C:\Users\mbgam\OneDrive\Escritorio\Streaming codex\Xuper-iOS`.
- La carpeta superior contiene archivos de trabajos anteriores: no tomar su README, package.json, node_modules ni documentación antigua como arquitectura de esta app.
- Operar con `git -C Xuper-iOS ...` desde la carpeta superior, o desde la raíz propia. No cambiar configuración Git global ni remotes de otros proyectos.
- `origin` corresponde únicamente al repositorio privado anterior. Acceso por Git con autenticación existente; no extraer ni imprimir tokens. El conector GitHub de esta sesión devolvía 404 para este repo privado, aunque Git y el navegador autenticado sí accedían.
- No subir APK analizada, instaladores, credenciales, perfiles, claves de firma ni archivos de otros proyectos. `.gitignore` excluye `build/`, `artifacts/`, `installers/`, IPA, perfiles y p12.

## Arquitectura implementada

| Archivo | Responsabilidad |
|---|---|
| `App/AppDelegate.swift` | Ciclo UIKit, hosting SwiftUI y MediaStore compartido. |
| `App/MediaStore.swift` | Modelo Codable de catálogo, carga URLSession ephemeral, favoritos/progreso/URL en UserDefaults. |
| `App/Views.swift` | Inicio, películas, series, TV, búsqueda, favoritos, detalles, episodios y ajustes. |
| `App/Playback.swift` | AVPlayer y AVPlayerViewController, variantes, reanudación y preferencia por subtítulos españoles existentes. |
| `App/Info.plist` | Bundle `local.xuper.study`, versión 0.1.0; sin excepciones globales ATS. |
| `App/PrivacyInfo.xcprivacy` | UserDefaults para preferencias propias, razón CA92.1; tracking false. |
| `XuperStudy.xcodeproj` | Target iPhone, Swift 5, deployment target declarado iOS 13.0, scheme compartido XuperStudy. |
| `tools/package_unsigned.py` | Empaqueta una .app realmente compilada en IPA, genera hash y metadatos sin firma. |

Contrato JSON **propio**, no API de Xuper: `catalog-contract.example.json` contiene `schemaVersion: 1` y `titles: []`. Los modelos incluyen títulos `movie/series/live`, fuentes HTTPS `{id,label,url}` y episodios `{id,title,season,number,sources}`. IDs estables para favoritos y progreso. El cargador limita a 5000 títulos y comprueba tamaño de respuesta de hasta 1 MiB; acepta HTTPS sin usuario/contraseña embebidos. Consultar el código para validaciones exactas.

El reproductor depende de formatos/códecs AVFoundation y de las pistas que provea la fuente. No descarga traducciones ni SRT externos. No hay login Xuper, adaptador de backend, bypass DRM, descargas offline ni protocolo cast Android. Audio original, 720p/1080p y subtítulos españoles dependen de fuentes reales; no fueron verificados en reproducción iOS.

## Compilación y verificación reales

- Commit que se compiló: `0d064423ce046eb9cd2c6accc87c383f10ebda6c`.
- Ejecución exitosa #1: https://github.com/GonzaloMaldonado12/xuper-ios-lab/actions/runs/36787317561
- Job: https://github.com/GonzaloMaldonado12/xuper-ios-lab/actions/runs/36787317561/job/110131747784
- Workflow `.github/workflows/build-ios.yml`, ejecución manual `workflow_dispatch`, permisos contents read, macOS 15 / Xcode 16.4.
- Pasaron compilación Release para dispositivo sin firma, empaquetado IPA, compilación Debug para simulador y arranque/captura en iPhone 11 con iOS 18.5.
- Esto prueba compilación y apertura, **no playback, backend, instalación física ni compatibilidad con todas las versiones de iOS**.
- Artefacto `Xuper-iOS-unsigned-build`, ID `11130003262`, retención configurada 7 días. Si expiró, usar copia local o ejecutar de nuevo el workflow.
- Acciones oficiales fijadas por SHA. GitHub avisó sobre Node 20 y ejecutó con Node 24; la ejecución pasó. Actualizar solo si es necesario y volver a verificar.

IPA local: `artifacts/XuperStudy-unsigned.ipa`, 146170 bytes, ejecutable Mach-O ARM64, mínimo declarado 13.0.

```text
IPA SHA256:
8078caf15005bde025834f3427feb6466f68bbc3bb55230d8dbe644f7d11b732
ZIP del artefacto SHA256:
bf4011ca7ec72e1b718af9b321d628e92a6cca48c159f5eb013c879405657c23
```

El digest externo coincidió con GitHub. No confundir integridad con certificación de seguridad. `artifacts/iphone11-launch.png` muestra la UI y el aviso de servicio no conectado. La IPA no está en Git; los hashes y evidencias sí. La validación estructural local de Windows no sustituye la compilación remota.

## Instalación Windows: estado y bloqueo

Herramientas preparadas/instaladas durante esta sesión:

- iTunes desktop desde el enlace Apple: `C:\Program Files\iTunes\iTunes.exe`, instalación comprobada.
- iCloud 7.21.0.23 comprobado en registro, instalación desktop desde enlace Apple.
- AltServer 1.8.00 comprobado; ejecutable `C:\Program Files (x86)\AltServer\AltServer.exe`.
- Apple Devices ya existía en el PC. Se conservó; no se confirmó si influye en la detección.
- Usuario introdujo personalmente su cuenta Apple en AltServer. No se leyeron credenciales ni se guardaron en proyecto/chat.

El servicio Apple estuvo detenido/atascado. Después de reiniciar Windows, se verificó **Apple Mobile Device Service Running**, **Bonjour Service Running** e **Apple iPhone Status OK, Class WPD**. Esto solo demuestra detección Windows; no demuestra emparejamiento Apple ni detección del firmador. Una consulta USB acotada no mostró dispositivos Apple, sin diagnóstico concluyente del controlador.

**AltServer sigue mostrando “No connected devices”.** Se encontraron dos instancias del mismo ejecutable; se cerraron y abrió una como administrador. El usuario indicó que seguía igual. No se confirmó si iTunes muestra el icono del iPhone, ni si AltStore apareció en el teléfono. No declarar instalación exitosa.

Alternativa solicitada: **Sideloadly**, descargado desde https://sideloadly.io/SideloadlySetup64.exe. Se abrió el asistente. **El usuario no confirmó que terminara la instalación ni que detecte el teléfono.** Sideloadly también requiere iTunes/iCloud desktop; cambiar de firmador puede conservar el bloqueo de emparejamiento/controlador.

Instaladores locales en `installers/`, excluidos de Git:

| Archivo | SHA256 | Authenticode observado |
|---|---|---|
| AltInstaller.zip | E130EAEEA7957BEDCCA99743A799460BD2001E07B177EC49C67E4CDFBAEDA553 | No aplica como firma de ejecutable |
| setup.exe (AltServer) | DA3054755A9A852FD3E169F61BE9F893A27A15CF55C3A33BFFE104762BF8DF17 | NotSigned |
| altinstaller.msi | 944186A28493B628A7702C514155140D530DFADC31F4279033AE576F1403CD5F | NotSigned |
| iTunes64Setup.exe | 25B28905A81406A5EDBF482F7F3EE4831A8641D32D29DCEDA5D1EB3E8D534C08 | Valid, Apple Inc. |
| iCloudSetup.exe | 4CFD20D13CDCE2B5C435F2DDAF4EE4C81D976461846BF3B954E8AF6CBCDEB9F7 | Valid, Apple Inc. |
| SideloadlySetup64.exe | 7F5BBD15E00897C301F51C133A552AEAD5064AC29134B74B116D4D200986E49B | NotSigned |

No afirmar “sin virus”. No desactivar antivirus, firewall o validación de certificados como arreglo rutinario. No reinstalar/borrar componentes Apple existentes sin diagnóstico. Aceptación de términos, confianza en el teléfono y autenticación fueron pasos personales del usuario. En Codex no había control de UI nativa, solo navegador; Claude debe comprobar sus capacidades reales y no asumir acceso al teléfono.

## Siguientes pasos recomendados

1. Confirmar fin del asistente Sideloadly y si muestra el iPhone en iDevice.
2. Si no detecta, comprobar primero si iTunes/Apple Devices muestra el teléfono y su confianza. Diagnosticar USB/controlador/emparejamiento; no repetir instaladores ni solicitudes UAC sin evidencia nueva.
3. Cuando el firmador detecte el iPhone, cargar la IPA verificada, usar firma normal con cuenta personal y completar autenticación personalmente. No pedir contraseñas o códigos en chat ni subirlos a GitHub.
4. Confirmar app instalada y arranque físico. Consultar versión real de iOS y activar Developer Mode si corresponde al flujo. Registrar errores concretos sin datos de cuenta.
5. Probar reproducción únicamente cuando exista una fuente real autorizada y compatible. Documentar audio, subtítulos, calidad, cambio de variantes, reanudación y errores de red. La integración multimedia continúa siendo un pendiente independiente.

AltServer permite instalación directa de IPA mediante **Shift + clic en su icono → Sideload .ipa…**, documentado en release notes 1.5. Las instalaciones habituales con cuenta gratuita caducan a los 7 días y requieren renovación. No prometer instalación perpetua.

## Evidencias y fuentes

En el repo: `docs/evidence/github-build-state.json`, `ipa-verification.json`, `ios-project-validation.json`, `windows-installation-preparation.json`. El último archivo es una instantánea inicial de preparación: sus campos installed/deviceDetected no describen el estado posterior; usar esta sección y revalidar el estado actual.

En el PC, carpeta superior:

- `docs/XUPER-REVIEW.md` y `docs/xuper-*.json`: investigación selectiva del APK, firma y digests. Hay historial anterior reemplazado por avances posteriores; no interpretarlo como estado actual.
- `context-memory/xuper/INDEX.md` y `review-state.md`: notas fechadas de evolución y verificaciones.
- `scripts/validate-ios-project.py`: chequeo estructural; `scripts/create-ios-project.py`: generador inicial. **No ejecutar el generador sobre el proyecto editado** sin revisar qué sobrescribe.
- `analysis-inputs/xuper-mobile.apk`: muestra Android no ejecutada. No se seleccionó como “APK confiable”; checks de integridad/firma no verifican autenticidad del editor ni ausencia de malware. No incluida en GitHub ni necesaria para compilar esta app.

Fuentes primarias revisadas:

- https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows
- https://faq.altstore.io/altstore-classic/troubleshooting-guide
- https://github.com/altstoreio/FAQ/blob/main/release-notes/altserver.md — Direct .ipa Sideloading
- https://support.apple.com/en-ca/102347 — reinicio del servicio AMDS
- https://sideloadly.io/ y https://sideloadly.io/faq.html

Revalidar versiones/requisitos si se retoma después. Buscar selectivamente, no leer node_modules ni memorias enteras por precaución.

## Texto breve para iniciar con Claude

> Continúa este proyecto leyendo HANDOFF-CLAUDE.md del repositorio privado GonzaloMaldonado12/xuper-ios-lab. No alteres Animamente ni otros proyectos. Existe una app iOS independiente compilada y una IPA sin firma verificada; no está confirmada su instalación física y no conecta el catálogo de Xuper. AltServer da “No connected devices” pese a servicios Apple/Bonjour activos. Se abrió Sideloadly como alternativa, sin confirmar fin del asistente. Empieza comprobando su detección y el emparejamiento Apple. No solicites credenciales en chat, no inventes integración multimedia ni confundas arranque en simulador con prueba funcional.
