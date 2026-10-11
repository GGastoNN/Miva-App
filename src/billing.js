(function(){
'use strict';
const cfg=window.MIVA_CONFIG?.billing||{};
let plugin=null,listening=false,busy=false,initializing=null,changed=()=>{},active=false,checkedUntil=0,ready=false,price='';
let message='La suscripción estará disponible próximamente.';
function hasPro(){return active&&Date.now()<checkedUntil;}
function accept(data){active=data?.active===true&&data?.invalid!==true;checkedUntil=Date.now()+10*60*1000;ready=data?.ready===true;price=data?.price||'';message=data?.invalid?'No pudimos verificar la compra. Contactá soporte.':hasPro()?'Tu suscripción Pro está activa.':data?.pending?'Pago pendiente. Pro se activará cuando Google Play confirme el pago.':ready?'Plan mensual disponible.':'El plan mensual todavía no está disponible en Google Play.';changed();}
function failure(e){active=false;checkedUntil=0;message=String(e?.code)==='1'?'Compra cancelada. No se activó Pro.':e?.message||'No pudimos consultar Google Play. Volvé a intentar con conexión.';changed();}
async function init(onChanged){if(onChanged)changed=onChanged;if(!cfg.enabled){message='La suscripción estará disponible próximamente.';changed();return;}if(window.Capacitor?.getPlatform?.()!=='android'){message='Las suscripciones se gestionan desde la app Android.';changed();return;}if(initializing)return initializing;
 initializing=(async()=>{try{plugin=plugin||window.Capacitor.registerPlugin('MivaPlayBilling');if(!listening){await plugin.addListener('billingChanged',accept);await plugin.addListener('billingRefresh',()=>refresh());listening=true;}accept(await plugin.getStatus());}catch(e){ready=false;failure(e);}finally{initializing=null;}})();return initializing;
}
async function refresh(){if(!busy)return init();}
async function buy(){if(busy||hasPro())return;if(!plugin||!ready){message='El plan mensual todavía no está disponible.';changed();return;}busy=true;message='Esperando confirmación de Google Play…';changed();try{accept(await plugin.buy());}catch(e){failure(e);}finally{busy=false;changed();}}
async function restore(){if(busy)return;if(!plugin)await init();if(!plugin)return;busy=true;message='Consultando compras de Google Play…';changed();try{accept(await plugin.restore());}catch(e){failure(e);}finally{busy=false;changed();}}
function manage(){window.open('https://play.google.com/store/account/subscriptions?sku='+encodeURIComponent(cfg.productId||'miva_pro_monthly')+'&package=com.fixhome.miva','_blank','noopener');}
function status(){return {ready,busy,active:hasPro(),price,message};}
document.addEventListener('mivaNativeForeground',()=>refresh());
if(typeof setInterval==='function')setInterval(()=>{if(cfg.enabled&&document.visibilityState!=='hidden')refresh();},5*60*1000);
window.MivaBilling={init,refresh,buy,restore,manage,hasPro,status};
})();
