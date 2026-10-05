# Miva — APK desde GitHub Actions

Capacitor 8.0.0, nombre Miva, identificador provisional com.miva.costos. Android mínimo 7.0. Incluye la última versión miva.html y sus logos oficiales, con límite de tres costeos y botón de reinicio para pruebas. Las mejoras funcionales propuestas quedan pendientes.

## Primer APK

1. Descomprimí el ZIP.
2. Creá un repositorio en GitHub y subí **el contenido de miva-apk a la raíz**, no el ZIP ni la carpeta contenedora.
3. Incluí la carpeta oculta `.github`, toda la carpeta `android` y `package-lock.json`. Activá mostrar archivos ocultos o usá Git.
4. Abrí **Actions → Generar APK Miva**. Al subir a main/master arranca automáticamente. También podés elegir **Run workflow → debug**.
5. Cuando termine, descargá **Artifacts → Miva-debug-N**.
6. Descomprimí el artefacto e instalá `app-debug.apk`. Android puede solicitar habilitar instalaciones desde esa fuente.

El APK debug es para pruebas. Diferentes runners pueden usar claves debug diferentes y rechazar una actualización. Exportá tus datos antes de desinstalar. Para distribuir y actualizar usá siempre una clave release estable.

## APK release firmado

Con Java instalado, creá una clave:

```bash
keytool -genkeypair -v -keystore miva-release.jks -alias miva -keyalg RSA -keysize 2048 -validity 10000
```

Guardá la clave y las contraseñas fuera del repositorio. Necesitás la misma clave para todas las actualizaciones.

En **Settings → Secrets and variables → Actions** agregá:

| Secreto | Contenido |
|---|---|
| ANDROID_KEYSTORE_BASE64 | Archivo JKS codificado en Base64 |
| ANDROID_KEYSTORE_PASSWORD | Contraseña del archivo |
| ANDROID_KEY_ALIAS | miva, o el alias elegido |
| ANDROID_KEY_PASSWORD | Contraseña de la clave |

Obtener Base64 en Linux/macOS:

```bash
base64 < miva-release.jks | tr -d '\n'
```

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('miva-release.jks'))
```

Ejecutá **Run workflow → release** y descargá Miva-release-N. Si falta un secreto, la ejecución falla y lo identifica. No publica en Google Play ni genera AAB.

## Editar y compilar localmente

Editá `www/index.html`; Actions lo sincroniza antes de compilar. No edites la copia generada dentro de android/app/src/main/assets/public.

Requisitos locales: Node 22+, Java 21, Android SDK 36.

```bash
npm ci
npm run check
npm run android:sync
cd android
./gradlew assembleDebug
```

Windows: `gradlew.bat assembleDebug`. Configurá ANDROID_HOME o android/local.properties si el SDK no se detecta.

## Versiones y revisión antes de distribuir

versionCode usa el número de ejecución de GitHub. versionName está en android/app/build.gradle. Al migrar de repositorio, asegurá que el código de versión aumente.

Antes de distribuir: revisá los íconos y splash personalizados, reemplazá el identificador provisional en Capacitor y Android si corresponde, retirá el botón de reinicio de pruebas y revisá el bloqueo Pro, y probá botón Atrás, compartir y portapapeles en un teléfono.

Los datos se guardan localmente. Borrar datos o desinstalar puede eliminarlos. Los datos del navegador no migran automáticamente al APK: exportá la copia desde la web e importala en la app.

## Verificación

Dependencias instaladas, Android generado, HTML sincronizado y sintaxis JavaScript/configuración verificadas. La compilación completa y la instalación quedan por confirmar con GitHub Actions y un teléfono real.

Referencias: https://capacitorjs.com/docs y https://docs.github.com/en/actions

## Última versión y marca

Base actual: miva.html. Isotipo m✓ para íconos Android; logo completo para splash anterior a Android 12. Android 12+ muestra el isotipo en su splash del sistema. Originales en branding/. No se alteraron los cálculos ni se agregaron funciones ausentes: esta versión no tiene backup ni edición de productos. Usa la clave localStorage miva; no importa automáticamente los datos de Miva_v7.
