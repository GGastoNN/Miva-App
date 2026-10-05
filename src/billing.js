import { Purchases } from '@revenuecat/purchases-capacitor';
(function(){
'use strict';
const cfg=window.MIVA_CONFIG?.billing||{};
let configured=false,initializing=null,busy=false,customer=null,monthly=null,option=null,changed=()=>{};
let message='La suscripción estará disponible próximamente.';
function hasPro(){
 const e=customer?.entitlements?.active?.[cfg.entitlementId||'pro'];
 const verification=e?.verification||customer?.entitlements?.verification;
 return e?.isActive===true&&['VERIFIED','VERIFIED_ON_DEVICE'].includes(verification)&&(!e.expirationDate||Date.parse(e.expirationDate)>Date.now());
}
function accept(info){if(!info)return;customer=info;if(customer.entitlements?.verification==='FAILED')message='No pudimos verificar tu suscripción. Volvé a intentar con conexión.';changed();}
function notify(){changed();}
function errorText(e){if(String(e?.code)==='1'||e?.userCancelled)return 'Compra cancelada. No se activó Pro.';if(String(e?.code)==='20')return 'Pago pendiente. Pro se activará cuando Google Play confirme el pago.';return e?.message||'No pudimos conectar con la tienda. Volvé a intentar.';}
function findMonthly(offerings){
 const offering=cfg.offeringId?offerings.all?.[cfg.offeringId]:offerings.current;
 monthly=offering?.availablePackages?.find(p=>p.identifier===(cfg.packageId||'$rc_monthly')&&p.product?.identifier?.split(':')[0]===(cfg.productId||'miva_pro_monthly'))||null;
 option=monthly?.product?.subscriptionOptions?.find(o=>o.isBasePlan===true&&o.id===(cfg.basePlanId||'monthly')&&o.billingPeriod?.iso8601==='P1M'&&!o.isPrepaid)||null;
 if(option&&monthly.presentedOfferingContext)option={...option,presentedOfferingContext:monthly.presentedOfferingContext};
 if(!monthly||!option)message='El plan mensual todavía no está disponible en la tienda.';
}
async function load(){const result=await Purchases.getCustomerInfo();accept(result.customerInfo);try{findMonthly(await Purchases.getOfferings());if(monthly&&option)message=hasPro()?'Tu suscripción Pro está activa.':'Plan mensual disponible.';}catch(e){monthly=null;option=null;message=errorText(e);}notify();}
async function init(onChanged){if(onChanged)changed=onChanged;
 if(!cfg.enabled||!cfg.apiKey){message='La suscripción estará disponible próximamente.';notify();return;}
 if(window.Capacitor?.getPlatform?.()!=='android'){message='Las suscripciones se gestionan desde la app Android.';notify();return;}
 if(initializing)return initializing;
 initializing=(async()=>{try{if(!configured){await Purchases.configure({apiKey:cfg.apiKey,entitlementVerificationMode:'INFORMATIONAL'});configured=true;
 await Purchases.addCustomerInfoUpdateListener(info=>{accept(info);message=hasPro()?'Tu suscripción Pro está activa.':'Suscripción actualizada.';notify();});}await load();}catch(e){message=errorText(e);notify();}finally{initializing=null;}})();
 return initializing;
}
async function refresh(){if(busy)return;return init();}
async function buy(){if(busy)return;if(!configured||!monthly||!option){message='El plan mensual todavía no está disponible.';notify();return;}if(hasPro()){message='Ya tenés Pro activo.';notify();return;}
 busy=true;message='Esperando confirmación de Google Play…';notify();try{const result=await Purchases.purchaseSubscriptionOption({subscriptionOption:option});accept(result.customerInfo);message=hasPro()?'Pro activado. ¡Gracias!':'La compra aún no habilitó Pro. Podés actualizar o restaurar compras.';}catch(e){message=errorText(e);}finally{busy=false;notify();}
}
async function restore(){if(busy)return;if(!configured)await init();if(!configured){message='La restauración estará disponible al configurar la tienda.';notify();return;}
 busy=true;message='Restaurando compras…';notify();try{const result=await Purchases.restorePurchases();accept(result.customerInfo);message=hasPro()?'Pro restaurado.':'No encontramos una suscripción Pro activa para esta cuenta.';}catch(e){message=errorText(e);}finally{busy=false;notify();}}
function manage(){const url=customer?.managementURL||'https://play.google.com/store/account/subscriptions?sku='+encodeURIComponent(cfg.productId||'miva_pro_monthly')+'&package='+encodeURIComponent('com.miva.costos');if(/^https:\/\/(play\.google\.com|payments\.google\.com)\//.test(url))window.open(url,'_blank','noopener');}
function status(){return {ready:configured&&!!monthly&&!!option,busy,active:hasPro(),price:option?.fullPricePhase?.price?.formatted||monthly?.product?.priceString||'',message,expires:customer?.entitlements?.active?.[cfg.entitlementId||'pro']?.expirationDate||null};}
document.addEventListener('mivaNativeForeground',()=>{if(configured)refresh();});
window.MivaBilling={init,refresh,buy,restore,manage,hasPro,status};
})();
