package com.fixhome.miva;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onPause() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript("document.dispatchEvent(new Event('mivaNativeBackground'))", null);
        }
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript("document.dispatchEvent(new Event('mivaNativeForeground'))", null);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MivaFilesPlugin.class);
        registerPlugin(MivaBillingPlugin.class);
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            private boolean pending = false;

            @Override
            public void handleOnBackPressed() {
                if (pending) return;
                if (getBridge() == null || getBridge().getWebView() == null) {
                    fallback();
                    return;
                }
                pending = true;
                getBridge().getWebView().evaluateJavascript(
                    "typeof window.mivaBack === 'function' && window.mivaBack() === true",
                    result -> {
                        pending = false;
                        if (!"true".equals(result)) fallback();
                    }
                );
            }

            private void fallback() {
                setEnabled(false);
                try {
                    getOnBackPressedDispatcher().onBackPressed();
                } finally {
                    setEnabled(true);
                }
            }
        });
    }
}
