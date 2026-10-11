package com.fixhome.miva;

import android.util.Base64;
import com.android.billingclient.api.*;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Google Play only. No subscription token or entitlement is stored in WebView storage. */
@CapacitorPlugin(name = "MivaPlayBilling")
public class MivaBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String PRODUCT = "miva_pro_monthly";
    private static final String PLAN = "monthly";
    private BillingClient client;
    private ProductDetails product;
    private ProductDetails.SubscriptionOfferDetails offer;
    private PluginCall purchaseCall;
    private boolean connecting;
    private final List<Runnable> connectedTasks = new ArrayList<>();
    private final List<PluginCall> connectionCalls = new ArrayList<>();

    @Override public void load() {
        client = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
    }
    private boolean ok(BillingResult r) { return r.getResponseCode() == BillingClient.BillingResponseCode.OK; }
    private void reject(PluginCall call, BillingResult r) {
        if (purchaseCall == call) purchaseCall = null;
        call.reject("Google Play no pudo completar la operación. Código " + r.getResponseCode(), String.valueOf(r.getResponseCode()));
    }
    private void connect(PluginCall call, Runnable task) {
        getActivity().runOnUiThread(() -> {
            if (BuildConfig.PLAY_BILLING_PUBLIC_KEY.isEmpty()) { if (purchaseCall == call) purchaseCall = null; call.reject("Falta configurar la clave pública de licencia de Google Play."); return; }
            if (client.isReady()) { task.run(); return; }
            connectedTasks.add(task); connectionCalls.add(call);
            if (connecting) return;
            connecting = true;
            client.startConnection(new BillingClientStateListener() {
                @Override public void onBillingSetupFinished(BillingResult result) {
                    getActivity().runOnUiThread(() -> {
                        connecting = false;
                        List<Runnable> tasks = new ArrayList<>(connectedTasks);
                        List<PluginCall> calls = new ArrayList<>(connectionCalls);
                        connectedTasks.clear(); connectionCalls.clear();
                        if (ok(result)) { for (Runnable t : tasks) t.run(); }
                        else { for (PluginCall c : calls) reject(c, result); }
                    });
                }
                @Override public void onBillingServiceDisconnected() { /* Automatic reconnection on the next API call. */ }
            });
        });
    }
    private void products(PluginCall call, Runnable next) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(
            QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT).setProductType(BillingClient.ProductType.SUBS).build())).build();
        client.queryProductDetailsAsync(params, (result, details) -> {
            product = null; offer = null;
            if (ok(result)) {
                for (ProductDetails p : details.getProductDetailsList()) {
                    if (!PRODUCT.equals(p.getProductId()) || p.getSubscriptionOfferDetails() == null) continue;
                    for (ProductDetails.SubscriptionOfferDetails o : p.getSubscriptionOfferDetails()) {
                        List<ProductDetails.PricingPhase> phases = o.getPricingPhases().getPricingPhaseList();
                        if (PLAN.equals(o.getBasePlanId()) && o.getOfferId() == null && phases.size() == 1
                            && "P1M".equals(phases.get(0).getBillingPeriod())
                            && phases.get(0).getRecurrenceMode() == ProductDetails.RecurrenceMode.INFINITE_RECURRING) {
                            product = p; offer = o; break;
                        }
                    }
                }
            }
            // Existing subscribers can still restore access if the product cannot be offered.
            next.run();
        });
    }
    private boolean verified(Purchase p) {
        try {
            if (!getContext().getPackageName().equals(new org.json.JSONObject(p.getOriginalJson()).optString("packageName"))) return false;
            Signature verifier = Signature.getInstance("SHA1withRSA");
            verifier.initVerify(KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(
                Base64.decode(BuildConfig.PLAY_BILLING_PUBLIC_KEY, Base64.DEFAULT))));
            verifier.update(p.getOriginalJson().getBytes(StandardCharsets.UTF_8));
            return verifier.verify(Base64.decode(p.getSignature(), Base64.DEFAULT));
        } catch (Exception e) { return false; }
    }
    private void query(PluginCall call) {
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(), (result, purchases) -> {
            if (!ok(result)) { reject(call, result); return; }
            process(call, purchases, 0, false, false, false);
        });
    }
    private void process(PluginCall call, List<Purchase> purchases, int index, boolean active, boolean pending, boolean invalid) {
        if (index == purchases.size()) {
            JSObject data = new JSObject(); data.put("active", active); data.put("pending", pending); data.put("invalid", invalid);
            data.put("ready", product != null && offer != null);
            data.put("price", offer == null ? "" : offer.getPricingPhases().getPricingPhaseList().get(0).getFormattedPrice());
            data.put("productId", PRODUCT); data.put("basePlanId", PLAN);
            call.resolve(data); notifyListeners("billingChanged", data); return;
        }
        Purchase p = purchases.get(index);
        if (!p.getProducts().contains(PRODUCT)) { process(call,purchases,index+1,active,pending,invalid); return; }
        if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) { process(call,purchases,index+1,active,true,invalid); return; }
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED || !verified(p)) {
            process(call,purchases,index+1,active,pending,true); return;
        }
        if (p.isAcknowledged()) { process(call,purchases,index+1,true,pending,invalid); return; }
        client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), result -> {
            if (!ok(result)) { reject(call, result); return; }
            process(call,purchases,index+1,true,pending,invalid);
        });
    }
    @PluginMethod public void getStatus(PluginCall call) { connect(call, () -> products(call, () -> query(call))); }
    @PluginMethod public void restore(PluginCall call) { getStatus(call); }
    @PluginMethod public void buy(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (purchaseCall != null) { call.reject("Ya hay una compra en curso."); return; }
            // Reserve the operation before any asynchronous connection or product query.
            purchaseCall = call;
            connect(call, () -> products(call, () -> getActivity().runOnUiThread(() -> {
                if (product == null || offer == null) { purchaseCall = null; call.reject("El plan mensual todavía no está disponible en Google Play."); return; }
                BillingFlowParams params = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(
                    BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).setOfferToken(offer.getOfferToken()).build())).build();
                BillingResult result = client.launchBillingFlow(getActivity(), params);
                if (!ok(result)) { purchaseCall = null; reject(call, result); }
            })));
        });
    }
    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        getActivity().runOnUiThread(() -> {
            PluginCall call = purchaseCall; purchaseCall = null;
            if (call != null) {
                if (ok(result) || result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) query(call);
                else reject(call, result);
            } else {
                // Purchases can finish while the app was backgrounded; JS refreshes via getStatus.
                notifyListeners("billingRefresh", new JSObject());
            }
        });
    }
    @Override protected void handleOnDestroy() {
        if (purchaseCall != null) { purchaseCall.reject("La operación fue interrumpida."); purchaseCall = null; }
        for (PluginCall c : connectionCalls) c.reject("La conexión fue interrumpida.");
        connectionCalls.clear(); connectedTasks.clear();
        if (client != null) client.endConnection();
    }
}
