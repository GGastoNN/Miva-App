> Actualización 2.3: consultá COSTEOS_Y_ANUNCIOS.md. Free permite 3 costeos guardados; cada intersticial recompensado completado habilita 1 lugar más. Pro conserva costeos ilimitados. Ya no se muestran intersticiales automáticos al guardar.

# Activar Miva Pro mensual

La compra/restauración está implementada en el código. Los productos aún no fueron creados en cuentas externas y no se están cobrando suscripciones. Necesitás Google Play Console y RevenueCat. RevenueCat verifica las compras y mantiene los derechos Pro.

## Google Play Console

1. Usá el mismo identificador Android del proyecto: com.miva.costos. Si ya registraste otro, hay que adaptar el proyecto antes de continuar.
2. Completá el perfil de pagos y la configuración de ventas que requiera tu consola.
3. Subí un AAB a una pista de pruebas internas. Actions release genera el artefacto Miva-google-play-N.
4. Creá una suscripción con ID **miva_pro_monthly** y nombre Miva Pro mensual.
5. Agregá el plan base **monthly**, con renovación automática cada mes. Definí precio, moneda y países y activalo.
6. No agregues ofertas, pruebas gratuitas ni planes prepagos en esta primera versión. La app compra el plan base mensual y muestra su precio regular.
7. Agregá testers de licencia y de la pista interna según tu consola.

El precio se obtiene de Google Play en la moneda del usuario; no se fija en GitHub. La compra final se confirma en la tienda.

## RevenueCat

1. Creá un proyecto Miva y una app Google Play con paquete com.miva.costos.
2. Conectá Google Play siguiendo la guía de credenciales de servicio de RevenueCat. El JSON privado se carga allí, nunca en el repositorio ni en el APK.
3. Importá el producto/plan **miva_pro_monthly:monthly**.
4. Creá el entitlement **pro** y asociá ese producto.
5. Creá el offering **default** y agregá el package Monthly, identificador **$rc_monthly**, con ese producto/plan.
6. Copiá la clave pública Android SDK, que empieza con **goog_**.
7. Configurá notificaciones de suscripción entre Google Play y RevenueCat siguiendo su guía.

La app usa identidad anónima del SDK. Restaurar compras recupera la suscripción con la cuenta de Google Play y la política de restauración de tu proyecto RevenueCat. Revisá esa política antes de publicar.

## GitHub Variables

Settings → Secrets and variables → Actions → Variables:

| Variable | Valor |
|---|---|
| MIVA_BILLING_ENABLED | true cuando producto y cuenta estén listos |
| REVENUECAT_ANDROID_PUBLIC_KEY | Clave pública Android goog_… |
| MIVA_OFFERING_ID | default |
| MIVA_PRIVACY_URL | URL HTTPS pública de tu política de privacidad |
| MIVA_TERMS_URL | URL HTTPS pública de condiciones de Miva Pro |
| MIVA_PRO_PREVIEW | false para comprobar derechos reales |

Sin MIVA_BILLING_ENABLED, la pantalla indica que la suscripción estará disponible próximamente. El build valida la clave pública y requiere las URLs de privacidad/condiciones cuando billing se activa en release.

La clave SDK es pública y queda dentro del APK. No uses claves secretas sk_…, cuentas de servicio ni contraseñas. Las contraseñas de firma siguen en Secrets. Conservá tus variables de AdMob actuales.

## Compilar y probar

1. Run workflow → release con los secretos de firma configurados.
2. Descargá Miva-google-play-N, extraé el AAB y subilo a la pista interna.
3. Instalá desde Google Play con una cuenta de tester habilitada.
4. Probá precio mensual, compra cancelada, pago pendiente, compra confirmada, restauración, renovación, cancelación y vencimiento.
5. Confirmá que Pro elimina anuncios y desbloquea herramientas sin borrar productos ni ventas.
6. Confirmá que cancelar la renovación conserva acceso hasta terminar el período pagado.

Un APK de Actions no reemplaza las pruebas de facturación de la pista interna. No uses MIVA_PRO_PREVIEW para aprobar una compra de prueba.

## Implementado

Un solo plan mensual. Compra del plan base con precio de tienda. Restaurar únicamente al pulsar el botón. Actualización de derechos al abrir/reanudar y con eventos del SDK. Pro requiere entitlement activo y verificado; cancelar una compra o tener pago pendiente no lo activa. Gestión de suscripción en Google Play. Licencias fuera de backups/localStorage. Probador y diagnóstico de anuncios retirados.

La compilación Android y las transacciones reales quedan por verificar en Actions, Play Console y un teléfono. Las pruebas automáticas simulan el SDK.

Referencias oficiales:
- https://www.revenuecat.com/docs/getting-started/installation/capacitor
- https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials
- https://www.revenuecat.com/docs/getting-started/entitlements
- https://www.revenuecat.com/docs/getting-started/restoring-purchases
- https://www.revenuecat.com/docs/test-and-launch/sandbox/google-play-store
