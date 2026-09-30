# Compilación remota e instalación nativa desde Windows

Estado verificado el 2026-09-30: **compilación para dispositivo y simulador exitosa, arranque en iPhone 11 simulado con iOS 18.5 e IPA sin firma descargada**. [Ejecución #1](https://github.com/GonzaloMaldonado12/xuper-ios-lab/actions/runs/36787317561). No se instaló en el teléfono físico. Sigue sin acceso al catálogo multimedia de Xuper. No se requiere tener Mac propio, pero sí un entorno macOS remoto para compilar.

## Compilar en GitHub Actions

1. Usa un repositorio de tu cuenta que contenga solo el contenido de esta carpeta `Xuper-iOS` en su raíz, incluida `.github/workflows`. No subas la APK analizada ni credenciales. Puedes usar un repositorio privado; verifica las condiciones y minutos de tu cuenta antes de ejecutar. Repositorio privado separado creado y fuentes subidas: https://github.com/GonzaloMaldonado12/xuper-ios-lab. Ningún proyecto anterior fue modificado.
2. En Actions ejecuta **Build iPhone client (unsigned)**. El workflow usa macOS 15 y Xcode 16.4, publicados actualmente en [runner-images](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md). Las acciones están fijadas por SHA a revisiones oficiales consultadas el 2026-09-30. Si GitHub retira esa imagen/SDK, habrá que actualizar y volver a comprobar compatibilidad.
3. El workflow intenta compilar para dispositivo, empaquetar una IPA sin firma, compilar para simulador y abrirla en un iPhone 11 con iOS 18.5. El resultado no debe considerarse válido hasta que esos pasos hayan pasado realmente. La captura del simulador verifica apertura, no conexión al servicio ni reproducción.
4. Descarga el artefacto `Xuper-iOS-unsigned-build`. Revisa el resultado y los errores antes de instalar. El SHA-256 generado identifica esa compilación; no certifica ausencia de vulnerabilidades.

## Firmar e instalar desde Windows

La [guía oficial de AltStore Classic para Windows](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows) describe instalar iTunes/iCloud según sus requisitos, AltServer desde su enlace oficial, conectar y desbloquear el iPhone, confiar en el PC e instalar AltStore. Los instaladores se preparan localmente en `installers/`, una carpeta excluida de Git; todavía no se ejecutaron. Apple Devices ya está instalado en el PC y no se ha modificado.

El ZIP de AltServer descargado desde el enlace de esa guía contiene `setup.exe` y `altinstaller.msi`. Ambos aparecen `NotSigned` en Get-AuthenticodeSignature; la procedencia observada es el enlace oficial, pero no hay firma Authenticode que verifique al editor. No se afirma ausencia de malware.

La instalación de herramientas requiere completar sus asistentes y aceptar personalmente sus términos. Después conecta el iPhone por USB, desbloquéalo y acepta «Confiar en este ordenador». Introduce tu cuenta Apple exclusivamente en la herramienta al firmar. En AltStore, importa `artifacts/XuperStudy-unsigned.ipa`. No se puede completar la firma sin el dispositivo y tu intervención.

La IPA compilada y revisada está en `artifacts/XuperStudy-unsigned.ipa`. AltStore Classic puede firmarla para tu dispositivo e instalarla mediante su función de importar IPA. Tu cuenta Apple y confirmaciones se introducen personalmente en la herramienta: no las envíes a este chat ni las guardes en GitHub. La compatibilidad del firmador y los requisitos del teléfono deben comprobarse con tu versión real de iOS. Para iOS 16+ la guía requiere Developer Mode.

AltStore documenta [caducidad de 7 días y renovación](https://faq.altstore.io/altstore-classic/your-altstore) para las apps instaladas en su flujo habitual; no es una instalación perpetua. No se propone jailbreak ni certificados empresariales de terceros. Firmar el proyecto no le añade acceso al servicio de Xuper.

La compilación remota quedó completada. Para instalar faltan comprobar la versión real del sistema, conectar el teléfono y completar la firma personal con AltStore/AltServer. El catálogo de Xuper sigue sin conexión; la instalación no lo resuelve.

