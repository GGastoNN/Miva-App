# Miva 2.5 · Google Play Billing directo

Paquete com.fixhome.miva. Sin SDK RevenueCat. Compra y restauración del plan mensual miva_pro_monthly / monthly mediante Google Play Billing. Configuración: SUSCRIPCIONES.md. Generación de AAB firmado y anuncios: GOOGLE_PLAY.md.

Inicio simplificado y menú hamburguesa con accesos a herramientas, Inicio, Pro, privacidad y términos. Free: 3 costeos guardados; cada intersticial recompensado completado habilita un lugar adicional en el dispositivo. Pro: ilimitados y sin anuncios, presupuestos, simulador, análisis, CSV y actualización masiva.

GitHub release genera APK y AAB con secretos de firma. MIVA_ADS_MODE=test usa anuncios oficiales de prueba también en release; live requiere IDs propios; off desactiva. MIVA_BILLING_ENABLED=false permite preparar el primer AAB sin producto activo. Para activarlo, configurar clave pública de licencia y URLs legales; no hay servidor propio de verificación.

Las pruebas automáticas simulan el plugin de compras. La compilación y las compras reales deben verificarse en Actions y pruebas internas de Google Play. La privacidad fue actualizada para Google Play directo; publicar nuevamente los HTML legales.
