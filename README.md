# Miva 2.1 — Tu precio justo

Aplicación Android sin conexión para costear producción/reventa y administrar productos. Identificador com.miva.costos. Android mínimo 7.0. Mantiene los logos y navegación Atrás. Costeos básicos ilimitados. Algunas funciones se reservan para Pro. El pago y la validación de suscripciones aún no están integrados.

## Subir a GitHub y generar APK

1. Descomprimí el ZIP y subí **el contenido de miva-apk a la raíz del repositorio**. Incluí `.github`, `android`, `www`, `scripts`, `tests`, `branding` y los archivos de configuración.
2. Reemplazá los archivos existentes. No subas el ZIP como único archivo ni la carpeta contenedora.
3. Commit changes inicia **Actions → Generar APK Miva** en main/master. También podés ejecutar Run workflow → debug.
4. Cuando termine, descargá el artefacto Miva-debug-N y extraé app-debug.apk.

Incluye las correcciones del SDK (packages: platform-tools) y versionCode. El workflow valida JavaScript y ejecuta los tests antes de compilar.

## Funciones

- Producción y reventa con validación por paso, números argentinos y rechazo de negativos.
- Mano de obra por hora separada de la ganancia, gas y desgaste configurables.
- Recargo objetivo y margen neto sobre venta, incluyendo comisiones porcentuales y cargo fijo por unidad.
- Productos con costeo completo, edición, duplicado, confirmación al borrar e historial de precios.
- Ingredientes reutilizables; actualizar un precio permite recalcular sus productos.
- Borrador automático recuperable al cerrar la app.
- Stock por producto, aviso cuando quedan tres unidades o menos, ventas que descuentan existencias y anulaciones que las restituyen.
- Ventas y gastos adicionales, resumen acumulado y exportación CSV de ventas.
- Presupuestos con cliente, cantidad, validez y notas; compartir con Android/WhatsApp o exportar TXT.
- Simulación de aumentos de costos, precios y descuentos sin cambiar el producto.
- Punto de equilibrio estimado según los gastos de local asignados a cada producto.
- Backups JSON completos, validación antes de importar y copia automática antes de reemplazar datos.
- Logos propios y botón/gesto Atrás: retrocede pasos y pantallas; desde inicio permite salir.

## Uso

1. Configurá tarifas de gas, desgaste y el valor de tu hora.
2. Creá y guardá un costeo. El packaging/entrega se aplica por unidad vendible. En producción, el envío de insumos es el monto asignado al lote.
3. Abrí el producto para editar, duplicar, simular o presupuestar.
4. Agregá existencias desde Ajustar stock antes de registrar ventas. Las ventas guardan precio, costo y comisiones de ese momento: posteriores cambios no modifican esas ventas.
5. Registrá solo gastos adicionales que no estén incluidos en los costeos para no duplicarlos. El resultado es una estimación económica; no es un saldo de caja ni un sistema contable/fiscal.
6. Exportá backups periódicamente. En Android se abre el selector de destino; al compartir se abre el selector de aplicaciones. Si cancelás, no se guardó el archivo.

La mano de obra puede ser cero si así lo elegís. Repartí los gastos del local entre tus productos; no asignes el total completo a cada uno. El cargo fijo de comisión se expresa por unidad: dividí un cargo por operación entre las unidades de esa operación.

## Datos anteriores

Conserva los productos de la última miva.html (clave localStorage miva) y su contador histórico; retira el límite gratuito. Los productos anteriores guardaban únicamente nombre y precio: no es posible reconstruir ingredientes/costos inexistentes. Para editarlos o registrar ventas con costos, creá un costeo completo nuevo. Podés seguir presupuestando sus precios antiguos.

Se conserva una copia inicial de los datos previos en el dispositivo. Exportala desde Copias de seguridad → Exportar datos previos/originales. Si los datos iniciales están dañados, el guardado queda bloqueado hasta exportarlos para evitar reemplazarlos accidentalmente.

Esta migración no importa las claves separadas de Miva_v7 ni transfiere datos de navegador a APK. Desinstalar o borrar datos puede eliminarlos. Exportá antes.

## Compilación firmada

El APK debug es de prueba. Distintos runners pueden producir firmas debug diferentes y rechazar una actualización. No desinstales una versión con datos sin exportarlos primero. Para distribución y actualizaciones estables, usá siempre una misma clave release.

Creá la clave con Java instalado:

```bash
keytool -genkeypair -v -keystore miva-release.jks -alias miva -keyalg RSA -keysize 2048 -validity 10000
```

Guardá la clave y contraseñas fuera del repositorio. En Settings → Secrets and variables → Actions agregá:

| Secreto | Valor |
|---|---|
| ANDROID_KEYSTORE_BASE64 | Archivo JKS codificado Base64 |
| ANDROID_KEYSTORE_PASSWORD | Contraseña del JKS |
| ANDROID_KEY_ALIAS | miva o alias elegido |
| ANDROID_KEY_PASSWORD | Contraseña de la clave |

Linux/macOS:

```bash
base64 < miva-release.jks | tr -d '\n'
```

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('miva-release.jks'))
```

Run workflow → release genera APK firmado. No publica en Google Play ni crea AAB.

## Desarrollo y validación

Node 22+, Java 21, Android SDK 36.

```bash
npm ci
npm run configure
npm run check
npm test
npm run android:sync
cd android
./gradlew assembleDebug
```

Windows: gradlew.bat. versionName 2.1; versionCode usa el número de ejecución del workflow. Al migrar el repositorio, asegurá que el código aumente.

La lógica de costos, comisiones, merma, simulación, migración y validación de backups tiene pruebas automatizadas. La compilación nativa completa debe confirmarse en GitHub Actions y la integración de guardado/compartir/gestos en un teléfono. No se verificó una compilación Android local.

Originales de marca en branding/. En Android 12+ el splash del sistema utiliza el isotipo.


## Gratis y Pro

Gratis: costeos ilimitados, mano de obra, comisiones, edición/duplicado, ingredientes, stock, registro de ventas/gastos y backups.

Reservado para Pro: simulador, presupuestos, análisis económico de ventas, exportación CSV, actualización masiva de precios y uso sin anuncios. La pantalla Pro indica que la suscripción está en preparación: no simula una compra ni realiza cobros. Las funciones están implementadas y pueden verificarse en debug con MIVA_PRO_PREVIEW=true; esta variable nunca activa Pro en release.

Para vender suscripciones falta crear el producto de Google Play, integrar Google Play Billing y validar/restaurar compras por usuario. No uses una variable de GitHub ni un indicador en localStorage como prueba de pago. Los backups no contienen derechos Pro.

## AdMob y variables de GitHub

Abrí Settings → Secrets and variables → Actions → **Variables** → New repository variable. Los IDs de AdMob no son contraseñas: se incorporan al APK. Las contraseñas de firma siguen en Secrets.

| Variable | Valor / comportamiento |
|---|---|
| MIVA_ADS_ENABLED | true activa anuncios; false los desactiva. Sin configurar: debug activo con pruebas, release desactivado. |
| ADMOB_APP_ID | ID de aplicación AdMob, formato ca-app-pub-…~… |
| ADMOB_BANNER_ID | ID del bloque banner, formato ca-app-pub-…/… |
| ADMOB_INTERSTITIAL_ID | ID del bloque intersticial, formato ca-app-pub-…/… |
| MIVA_AD_COOLDOWN_SECONDS | 180 por defecto; mínimo permitido 120 |
| MIVA_AD_EVERY_SAVES | 3 por defecto; mínimo permitido 3 |
| MIVA_AD_MIN_USE_SECONDS | 6 por defecto; mínimo de uso, NO temporizador de inactividad |
| MIVA_PRO_PREVIEW | true para probar las funciones Pro en debug, sin anuncios. Ignorado en release. |

Para probar anuncios, compilá debug: usa siempre IDs oficiales de prueba aunque hayas cargado IDs reales. Para anuncios reales, configurá los tres IDs propios, MIVA_ADS_ENABLED=true y ejecutá release con la firma configurada. Si faltan IDs reales o se usan los de muestra, el build de producción con anuncios falla antes de compilar.

No se muestran intersticiales por estar quieto seis segundos, al abrir/cerrar o al volver del segundo plano. Solo se consumen anuncios precargados en la transición posterior a un guardado, si se cumplen frecuencia y tiempo mínimo. Sin anuncio listo, la navegación continúa. El tiempo entre anuncios arranca al abrir la app para que no aparezca uno inmediatamente.

AdMob indica que los intersticiales deben mostrarse en pausas naturales y evita apariciones inesperadas durante lectura o formularios:
https://support.google.com/admob/answer/6201362?hl=es

El banner tiene espacio reservado para no tapar contenido. El plugin consulta consentimiento UMP antes de solicitar anuncios y permite abrir Privacidad de anuncios desde Inicio. Configurá los mensajes de privacidad en la consola de AdMob y completá la política de privacidad y las declaraciones de datos correspondientes antes de publicar.

Las variables se aplican **al compilar**. Cambiarlas no modifica APK instalados: necesitás compilar y distribuir otra versión. Para controlar anuncios a distancia sin actualizar, una futura versión puede usar configuración remota. Los derechos de suscripción se validan por usuario, no por esa configuración.

Plugin: @capacitor-community/admob 8.2.0. Guía:
https://github.com/capacitor-community/admob

Pasaron 14 pruebas de lógica y flujos, incluyendo barreras Pro y elegibilidad de anuncios. La carga/visualización real de AdMob, los formularios UMP y la compilación Android deben comprobarse con Actions y en un teléfono.
