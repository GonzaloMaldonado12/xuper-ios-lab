# Compilación remota e instalación nativa desde Windows

Estado actual: hay fuentes y workflow preparado; **no se ejecutó el workflow, no existe IPA y no se instaló en el teléfono**. Sigue sin acceso al catálogo multimedia de Xuper. No se requiere tener Mac propio, pero sí un entorno macOS remoto para compilar.

## Compilar en GitHub Actions

1. Usa un repositorio de tu cuenta que contenga solo el contenido de esta carpeta `Xuper-iOS` en su raíz, incluida `.github/workflows`. No subas la APK analizada ni credenciales. Puedes usar un repositorio privado; verifica las condiciones y minutos de tu cuenta antes de ejecutar. No se creó ni publicó ningún repositorio desde este chat.
2. En Actions ejecuta **Build iPhone client (unsigned)**. El workflow usa macOS 15 y Xcode 16.4, publicados actualmente en [runner-images](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md). Las acciones están fijadas por SHA a revisiones oficiales consultadas el 2026-09-30. Si GitHub retira esa imagen/SDK, habrá que actualizar y volver a comprobar compatibilidad.
3. El workflow intenta compilar para dispositivo, empaquetar una IPA sin firma, compilar para simulador y abrirla en un iPhone 11 con iOS 18.5. El resultado no debe considerarse válido hasta que esos pasos hayan pasado realmente. La captura del simulador verifica apertura, no conexión al servicio ni reproducción.
4. Descarga el artefacto `Xuper-iOS-unsigned-build`. Revisa el resultado y los errores antes de instalar. El SHA-256 generado identifica esa compilación; no certifica ausencia de vulnerabilidades.

## Firmar e instalar desde Windows

La [guía oficial de AltStore Classic para Windows](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows) describe instalar iTunes/iCloud según sus requisitos, AltServer desde su enlace oficial, conectar y desbloquear el iPhone, confiar en el PC e instalar AltStore. No se descargaron ni instalaron estas herramientas aquí.

Una vez exista la IPA compilada y revisada, AltStore Classic puede firmarla para tu dispositivo e instalarla mediante su función de importar IPA. Tu cuenta Apple y confirmaciones se introducen personalmente en la herramienta: no las envíes a este chat ni las guardes en GitHub. La compatibilidad del firmador y los requisitos del teléfono deben comprobarse con tu versión real de iOS. Para iOS 16+ la guía requiere Developer Mode.

AltStore documenta [caducidad de 7 días y renovación](https://faq.altstore.io/altstore-classic/your-altstore) para las apps instaladas en su flujo habitual; no es una instalación perpetua. No se propone jailbreak ni certificados empresariales de terceros. Firmar el proyecto no le añade acceso al servicio de Xuper.

Para ejecutar la compilación faltan acceso autenticado a GitHub o un repositorio donde el usuario ejecute el workflow. Para instalar faltan una compilación exitosa, la versión real del sistema, conexión del teléfono y firma personal. Ninguna de esas fases se declara completada.
