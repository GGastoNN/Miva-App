package com.miva.costos;

import android.app.Activity;
import android.content.Intent;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "MivaFiles")
public class MivaFilesPlugin extends Plugin {
    @PluginMethod
    public void exportFile(PluginCall call) {
        String name = call.getString("name");
        String mime = call.getString("mime", "application/octet-stream");
        String data = call.getString("base64");
        if (name == null || data == null || data.length() > 16000000) {
            call.reject("Archivo inválido o demasiado grande.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        intent.putExtra(Intent.EXTRA_TITLE, name.replaceAll("[^a-zA-Z0-9._-]", "_"));
        startActivityForResult(call, intent, "fileChosen");
    }

    @ActivityCallback
    private void fileChosen(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("Guardado cancelado.", "CANCELLED");
            return;
        }
        try (OutputStream out = getContext().getContentResolver().openOutputStream(data.getData())) {
            if (out == null) throw new IllegalStateException("No se pudo abrir el archivo.");
            out.write(Base64.decode(call.getString("base64"), Base64.DEFAULT));
            call.resolve();
        } catch (Exception e) {
            call.reject("No se pudo guardar el archivo.", e);
        }
    }

    @PluginMethod
    public void shareText(PluginCall call) {
        String text = call.getString("text");
        if (text == null) { call.reject("Falta el texto."); return; }
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType("text/plain");
                intent.putExtra(Intent.EXTRA_TEXT, text);
                getActivity().startActivity(Intent.createChooser(intent, "Compartir con…"));
                call.resolve();
            } catch (Exception e) { call.reject("No se pudo abrir Compartir.", e); }
        });
    }
}
