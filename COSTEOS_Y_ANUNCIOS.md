# Miva 2.3: costeos gratuitos y desbloqueos

- Free permite 3 productos/costeos guardados a la vez.
- Cada anuncio intersticial recompensado completado habilita 1 lugar adicional permanente en este dispositivo.
- Editar no consume lugares; duplicar sí. Eliminar libera un lugar.
- Los productos anteriores se conservan aunque superen la capacidad. Para agregar otro habrá que obtener capacidad suficiente o activar Pro.
- Pro permite costeos ilimitados y no muestra anuncios.
- Se conserva el banner. Los intersticiales automáticos al guardar se reemplazaron por desbloqueos voluntarios.
- El SDK de AdMob confirma la recompensa. Cerrar antes, no tener conexión, no tener anuncios disponibles o un error no habilita lugares. No se requiere hacer clic ni comprar. No se manipula el botón de cierre del anuncio.
- Antes de mostrarlo, la pantalla explica la recompensa y permite elegir “Ahora no”.
- Los lugares se guardan aparte de las copias de productos. No se recuperan al reinstalar ni se transfieren a otro dispositivo mediante backup. No hay validación de recompensas por servidor en esta versión.

## GitHub y AdMob

1. En AdMob creá un bloque Android de tipo **Intersticial recompensado** (no un intersticial común). Configurá la recompensa como 1 costeo adicional.
2. En GitHub → Settings → Secrets and variables → Actions → Variables agregá `ADMOB_REWARDED_INTERSTITIAL_ID` con el ID `ca-app-pub-…/…` de ese bloque.
3. Conservá `ADMOB_APP_ID`, `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` y `MIVA_ADS_ENABLED=true`. El ID intersticial común se mantiene por compatibilidad de configuración; ya no se muestra automáticamente al guardar.
4. Subí el contenido del proyecto a la raíz del repositorio, incluida `.github/workflows/android.yml`. Generá un nuevo release para aplicar la variable.
5. Los APK debug usan IDs oficiales de prueba. Probá guardar 3 productos, cancelar un anuncio, completar otro, guardar el cuarto y reiniciar. Verificá también el acceso Pro y la ausencia de anuncios para suscriptores.

Verificaciones automáticas cubren límites, edición/duplicado, persistencia, cancelación, error, recompensa única y Pro. La visualización y entrega real de anuncios requieren validación en un dispositivo Android.

Referencias oficiales:
https://developers.google.com/admob/android/rewarded-interstitial
https://developers.google.com/admob/android/test-ads
