# Miva Pro mensual · Google Play Billing directo

Paquete com.fixhome.miva. Sin RevenueCat, sin cuenta Miva, sin servidor propio. La app utiliza Play Billing Library 8.0.0 mediante el plugin nativo MivaPlayBilling.

## Play Console

1. Subir el AAB firmado a pruebas internas.
2. Completar la configuración comercial y de pagos requerida por Play.
3. Monetización → Suscripciones: crear **miva_pro_monthly**.
4. Crear plan base **monthly**, renovación automática **cada mes**. Activar precio, países y plan. No agregar ofertas ni prepagos para esta versión.
5. Copiar la **clave pública RSA Base64 de licencia de esta aplicación** desde la sección de licencias de Play Console (puede figurar dentro de Configuración de monetización). No es la clave de firma ni una cuenta de servicio.
6. Configurar testers de licencia y testers de la pista interna, y usar la cuenta correcta al instalar desde Play.

## GitHub Variables

| Variable | Valor |
|---|---|
| MIVA_BILLING_ENABLED | true al tener el plan listo |
| PLAY_BILLING_PUBLIC_KEY | Clave pública RSA Base64 de licencia de esta app, una sola línea |
| MIVA_PRIVACY_URL | URL HTTPS pública de privacidad actualizada |
| MIVA_TERMS_URL | URL HTTPS pública de términos actualizados |
| MIVA_PRO_PREVIEW | false |
| MIVA_ADS_MODE | test durante las pruebas |
| MIVA_ADS_ENABLED | true |

Eliminar REVENUECAT_ANDROID_PUBLIC_KEY y MIVA_OFFERING_ID si existían. No se necesitan entitlement, offering, cuenta RevenueCat ni JSON de servicio. Las contraseñas de firma permanecen en Secrets.

Si billing queda false, el AAB se puede generar antes de configurar el producto. La clave pública se integra en BuildConfig; no se deben introducir claves privadas. Cuando billing se activa, el build valida formato RSA y exige URLs legales en release.

## Implementación y límites

- Precio de tienda; compra únicamente del plan base mensual regular sin promociones.
- Comprobación nativa de firma RSA y paquete, estado PURCHASED, reconocimiento de la compra con acknowledgePurchase. PENDING no habilita Pro.
- Restaurar consulta las compras de Google Play de la cuenta del dispositivo. No depende de una cuenta propia ni usa copias de seguridad para habilitar Pro.
- Consulta al iniciar, reanudar, recibir cambios y cada cinco minutos en primer plano. No persiste derechos Pro. La última comprobación en memoria deja de dar acceso tras diez minutos si no se actualiza; al fallar una consulta se suspende el acceso hasta una nueva comprobación correcta.
- Cancelar la renovación no corta de inmediato el período pagado: la app se guía por las compras que Play devuelve como vigentes, no por isAutoRenewing. No calcula una fecha de vencimiento a partir de la fecha de compra.
- No hay backend ni notificaciones de servidor. La consulta local puede depender de caché de Play y no da confirmación de vencimientos/reembolsos en tiempo real. La firma local no sustituye la validación del token en Google Play Developer API. Google recomienda verificar y reconocer compras en un backend para mayor protección. Esta versión es apta para comenzar las pruebas; no se presenta como validación antifraude de servidor.
- Un solo producto mensual; si después agregás otros planes con el mismo producto, habrá que ampliar la comprobación del plan de la compra.

## Pruebas en Play

Instalar desde pista interna con tester de licencia. Probar precio, cancelación, pago pendiente, pago aprobado, reconocimiento, reinicio, restauración, renovación de prueba, fin del período, revocación, falta de conexión y anuncios ausentes en Pro. Confirmar transacciones de prueba en la pantalla de Google Play antes de aceptarlas. Las pruebas JS simulan el plugin; no sustituyen compilar Android ni comprar en un teléfono.

La integración Android debe compilarse en Actions. No se crearon productos ni se realizaron compras desde este proyecto.

https://developer.android.com/google/play/billing/integrate
https://developer.android.com/google/play/billing/security
