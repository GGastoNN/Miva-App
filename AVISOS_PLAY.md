# Miva 2.5.1 · avisos de Play Console

Release habilita R8, minificación, ofuscación y reducción de recursos con proguard-android-optimize.txt. Se conservan las reglas de consumidor de Capacitor y los métodos JavascriptInterface. No se modifica la lógica de anuncios ni compras.

La actividad solicita borde a borde mediante AndroidX EdgeToEdge. Se mantienen viewport-fit=cover y los insets CSS para menú, encabezado, navegación y recortes.

Subir un nuevo AAB con versionCode mayor al 31 de la captura; Actions usa su número de ejecución. Esperar el nuevo análisis de Play. No se garantiza un porcentaje de ofuscación concreto ni que desaparezcan todos los avisos: las bibliotecas conservan reglas necesarias y pueden referenciar APIs antiguas.

Si sigue el aviso de APIs obsoletas, abrir su detalle y obtener clases/métodos afectados. Hace falta esa lista para identificar la dependencia concreta; no se atribuyó el aviso a un SDK sin evidencia.

Descargar Miva-R8-mapping-N de Actions y guardar mapping.txt de cada release para interpretar errores ofuscados. El AAB incluye normalmente los metadatos de ofuscación generados por AGP.

Probar el release (no solo debug): inicio, menu y Atrás, rotación/teclado, banner, recompensa, exportación y Play Billing. Las pruebas JS no verifican efectos de R8 ni la visualización Android. La compilación Android se verifica en Actions.
