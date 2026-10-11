# Miva 2.4 · Google Play y anuncios de prueba

Paquete: **com.fixhome.miva**. El proyecto genera un **AAB** (Android App Bundle), además del APK. El AAB se sube a Google Play, no se instala directamente. La versión release puede usar anuncios de prueba sin ser una compilación debug.

## 1. Variables de GitHub para esta etapa

Settings → Secrets and variables → Actions → Variables:

| Variable | Valor inicial |
|---|---|
| MIVA_ADS_MODE | test |
| MIVA_ADS_ENABLED | true |
| MIVA_BILLING_ENABLED | false hasta configurar el plan en Play |
| MIVA_PRO_PREVIEW | false |
| PLAY_BILLING_PUBLIC_KEY | completar al activar billing |

`test` usa IDs oficiales de Google para el banner, intersticial común e intersticial recompensado; no requiere IDs propios. Las variables ADMOB_* se ignoran en ese modo. Los anuncios son de prueba también dentro del AAB release. Miva solo muestra el banner y el intersticial recompensado voluntario para desbloquear costeos; no se reintroducen intersticiales automáticos al guardar.

Para producción: MIVA_ADS_MODE=live, MIVA_ADS_ENABLED=true y configurar ADMOB_APP_ID, ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID y ADMOB_REWARDED_INTERSTITIAL_ID con bloques reales para esta app. El último debe ser de tipo intersticial recompensado. El build rechaza IDs de demostración en live release. Debug siempre utiliza prueba, incluso si se selecciona live. Para desactivar: MIVA_ADS_MODE=off. Recompilar al cambiar variables. No usar anuncios de prueba como versión definitiva de monetización.

## 2. Firma: GitHub Secrets

Crear estos secretos, nunca Variables ni archivos del repositorio:

| Secreto | Contenido |
|---|---|
| ANDROID_KEYSTORE_BASE64 | Archivo de clave de carga JKS codificado en Base64 |
| ANDROID_KEYSTORE_PASSWORD | Contraseña del almacén |
| ANDROID_KEY_ALIAS | Alias de la clave |
| ANDROID_KEY_PASSWORD | Contraseña de la clave |

Si ya tenés una clave de carga para esta app, reutilizala. Si es nueva, crearla localmente con JDK/Android Studio y conservar copia segura. Ejemplo interactivo (no incluye contraseñas en el comando):

```sh
keytool -genkeypair -v -keystore miva-upload.jks -storetype JKS -alias miva-upload -keyalg RSA -keysize 2048 -validity 10000
```

El comando solicita contraseñas y los datos del titular. No subir el JKS a GitHub ni enviarlo por chat. Base64 no cifra la clave: guardarlo únicamente como Secret. Para obtener Base64 en Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path .\miva-upload.jks))) | Set-Clipboard
```

Linux/macOS:

```sh
base64 < miva-upload.jks | tr -d '\n' > miva-upload.base64.txt
```

Copiar el contenido al Secret y eliminar el archivo temporal. Mantener una copia privada del almacén y sus contraseñas. Con Play App Signing, Google administra la clave de distribución; Actions firma con la clave de carga.

## 3. Generar y subir

1. Subir el contenido del proyecto a la raíz del repo, incluida .github. Si quedó la carpeta Java anterior com/miva/costos, eliminarla.
2. Actions → Generar APK y AAB Miva → Run workflow → **release**.
3. Descargar el artefacto **Miva-google-play-N**, descomprimirlo y obtener app-release.aab. El workflow verifica la firma. Si faltan secretos no genera el release.
4. Crear la aplicación Miva en Play Console para com.fixhome.miva. Configurar Play App Signing y subir el AAB a **pruebas internas**.
5. Completar los requisitos que indique Play Console: ficha, contacto, contenido de la app, anuncios, público objetivo, clasificación y Seguridad de los datos. Publicar legal/privacidad.html y legal/terminos.html en URLs HTTPS públicas; no están publicadas por este proyecto.
6. Configurar MIVA_PRIVACY_URL y MIVA_TERMS_URL con esas URLs. Colocar privacidad también en Play Console. Revisar el informe previo al lanzamiento.
7. Agregar testers, compartir el enlace e instalar desde Google Play. Confirmar navegación, anuncios de prueba, tres costeos y desbloqueos.

versionCode usa el número de ejecución de este workflow. Cada actualización en Play debe tener un código mayor que el anterior. Reejecutar el mismo run conserva ese código; generar una ejecución nueva. El ZIP no contiene un AAB ya compilado ni claves de firma.

## 4. Activar suscripciones mensuales directamente con Google Play

Sin RevenueCat. Crear miva_pro_monthly y plan mensual monthly en Monetización de Play Console. Definir precio/países y activar el plan. Configurar MIVA_BILLING_ENABLED=true, PLAY_BILLING_PUBLIC_KEY con la clave pública de licencia de Play, y las dos URLs legales. Compilar y subir un nuevo release a pruebas internas. Guía completa y límites de validación local: SUSCRIPCIONES.md.

Fuentes oficiales:
https://developer.android.com/studio/publish/app-signing
https://developers.google.com/admob/android/test-ads
https://developer.android.com/google/play/billing/integrate
