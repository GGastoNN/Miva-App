/* Ads only at deliberate breaks; errors are visible in the diagnostics screen. */
(function(){
'use strict';
const config=window.MIVA_CONFIG?.ads||{},cap=window.Capacitor;
const demo=config.test===true&&config.bannerId==='ca-app-pub-3940256099942544/6300978111'&&config.interstitialId==='ca-app-pub-3940256099942544/1033173712';
let plugin=null,initialized=false,ready=false,showing=false,loading=false,bannerVisible=false,foreground=true,saves=0,lastShown=Date.now(),started=Date.now(),done=null,pro=()=>false,listening=false,initializing=false;
const state={stage:'Sin iniciar',consent:'Pendiente',banner:'Sin solicitar',interstitial:'Sin solicitar',error:''};
const visible=()=>foreground&&document.visibilityState!=='hidden';
function message(e){return String(e?.message||e?.error?.message||JSON.stringify(e)||'Error desconocido');}
function failed(stage,e){state.stage=stage;state.error=message(e);console.warn(stage,state.error);}
function space(height){document.documentElement.style.setProperty('--ad-space',height+'px');}
async function hide(){if(plugin&&bannerVisible){bannerVisible=false;try{await plugin.hideBanner();}catch(e){}}space(0);}
async function banner(){if(!initialized||pro()||!visible())return hide();state.banner='Solicitando';try{await plugin.showBanner({adId:config.bannerId,adSize:'BANNER',position:'BOTTOM_CENTER',margin:0,isTesting:config.test});bannerVisible=true;space(70);}catch(e){state.banner='Error';failed('Banner: error',e);space(0);}}
async function preload(){if(loading||ready||!initialized||pro())return;loading=true;state.interstitial='Cargando';try{await plugin.prepareInterstitial({adId:config.interstitialId,isTesting:config.test});ready=true;state.interstitial='Listo';}catch(e){ready=false;state.interstitial='Error';failed('Intersticial: error de carga',e);}finally{loading=false;}}
function complete(){if(!showing)return;showing=false;state.interstitial='Cerrado';const next=done;done=null;if(next)next();preload();}
async function listeners(){if(listening)return;
 await plugin.addListener('interstitialAdDismissed',complete);
 await plugin.addListener('interstitialAdFailedToShow',e=>{failed('Intersticial: error al mostrar',e);complete();});
 await plugin.addListener('bannerAdLoaded',()=>{state.banner='Cargado';bannerVisible=true;space(70);});
 await plugin.addListener('bannerAdFailedToLoad',e=>{state.banner='Error de carga';bannerVisible=false;failed('Banner: no se pudo cargar',e);space(0);});
 await plugin.addListener('bannerAdSizeChanged',size=>space(size.height>0?Math.max(70,size.height+20):0));
 listening=true;
}
async function init(hasPro){if(hasPro)pro=hasPro;if(initializing)return;
 if(!config.enabled){state.stage='Desactivado en la configuración del APK';return;}
 if(cap?.getPlatform?.()!=='android'){state.stage='Los anuncios se muestran solo en el APK Android';return;}
 if(pro()){state.stage='Anuncios desactivados por la vista Pro';return;}
 initializing=true;state.error='';
 try{plugin=plugin||cap.registerPlugin('AdMob');await listeners();
  if(!initialized){
   if(demo){state.consent='Modo de demostración: solo bloques oficiales de prueba';}
   else{
    state.stage='Consultando consentimiento';let consent=await plugin.requestConsentInfo();
    state.consent=consent.status;
    if(consent.isConsentFormAvailable&&consent.status==='REQUIRED')consent=await plugin.showConsentForm();
    if(!consent.canRequestAds){state.stage='No se pueden solicitar anuncios: revisar consentimiento/UMP';return;}
   }
   state.stage='Inicializando SDK';await plugin.initialize({initializeForTesting:config.test===true});initialized=true;
  }
  state.stage=demo?'SDK listo · anuncios de prueba':'SDK listo';await banner();await preload();
 }catch(e){failed('No se pudieron iniciar los anuncios',e);await hide();}finally{initializing=false;}
}
function show(next){ready=false;showing=true;done=next;saves=0;lastShown=Date.now();state.interstitial='Mostrando';plugin.showInterstitial().catch(e=>{failed('Intersticial: error al mostrar',e);complete();});}
function atBreak(next){saves++;if(!initialized||pro()||!visible()||showing||!ready||saves<config.everySaves||Date.now()-started<config.minUseSeconds*1000||Date.now()-lastShown<config.cooldownSeconds*1000){if(initialized&&!ready&&!loading)preload();next();return;}show(next);}
async function privacy(){if(demo){window.alert('Este APK usa anuncios de demostración. El consentimiento real se configura con tu aplicación AdMob en release.');return;}if(!plugin){window.alert('AdMob no está activo. Revisá Estado de anuncios.');return;}
 try{await hide();ready=false;await plugin.showPrivacyOptionsForm();const info=await plugin.requestConsentInfo();state.consent=info.status;if(info.canRequestAds){if(!initialized){await plugin.initialize({initializeForTesting:config.test});initialized=true;}await banner();await preload();}else{initialized=false;state.stage='Consentimiento: anuncios no autorizados';}}catch(e){failed('No se pudieron abrir las opciones de privacidad',e);}
}
document.addEventListener('visibilitychange',()=>{foreground=document.visibilityState!=='hidden';if(!visible())hide();else if(initialized)banner();});
document.addEventListener('mivaNativeForeground',()=>{foreground=true;if(initialized)banner();});
document.addEventListener('mivaNativeBackground',()=>{foreground=false;hide();});
function status(){return {...state,enabled:!!config.enabled,test:!!config.test,pro:pro(),native:cap?.getPlatform?.()==='android',ready,initialized,saves,everySaves:config.everySaves,cooldownSeconds:config.cooldownSeconds,secondsToNext:Math.max(0,Math.ceil((config.cooldownSeconds*1000-(Date.now()-lastShown))/1000))};}
async function accessChanged(){if(pro()){ready=false;await hide();}else if(config.enabled){await init();}}
window.MivaAds={init,atBreak,privacy,status,accessChanged};
})();
