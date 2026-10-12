# Capacitor provides consumer rules for native plugins and callbacks.
# Preserve methods invoked by the WebView JavaScript bridge.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes SourceFile,LineNumberTable
