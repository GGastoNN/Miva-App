/* Preloaded ads only at deliberate content breaks; no inactivity timer. */
(function(){
'use strict';
const config=window.MIVA_CONFIG?.ads||{},cap=window.Capacitor;
let plugin=null,initialized=false,ready=false,showing=false,loading=false,bannerVisible=false,foreground=true,saves=0,lastShown=Date.now(),started=Date.now(),done=null,pro=()=>false;
const visible=()=>foreground&&document.visibilityState!=='hidden';
function space(height){document.documentElement.style.setProperty('--ad-space',height+'px');}
async function hide(){if(plugin&&bannerVisible){bannerVisible=false;try{await plugin.hideBanner();}catch(e){}}space(0);}
async function banner(){if(!initialized||pro()||!visible())return hide();try{await plugin.showBanner({adId:config.bannerId,adSize:'BANNER',position:'BOTTOM_CENTER',margin:0,isTesting:config.test});bannerVisible=true;space(70);}catch(e){space(0);}}
async function preload(){if(loading||ready||!initialized||pro())return;loading=true;try{await plugin.prepareInterstitial({adId:config.interstitialId,isTesting:config.test});ready=true;}catch(e){ready=false;}finally{loading=false;}}
function complete(){showing=false;const next=done;done=null;if(next)next();preload();}
async function init(hasPro){pro=hasPro;if(!config.enabled||cap?.getPlatform?.()!=='android'||pro())return;
 plugin=cap.registerPlugin('AdMob');try{
  await plugin.addListener('interstitialAdDismissed',complete);
  await plugin.addListener('interstitialAdFailedToShow',complete);
  await plugin.addListener('bannerAdSizeChanged',size=>space(bannerVisible?Math.max(70,size.height+20):0));
  let consent=await plugin.requestConsentInfo();
  if(consent.isConsentFormAvailable&&consent.status==='REQUIRED')consent=await plugin.showConsentForm();
  if(!consent.canRequestAds)return;
  await plugin.initialize({initializeForTesting:config.test});initialized=true;
  await banner();preload();
 }catch(e){console.warn('Anuncios no disponibles; Miva continúa normalmente.');hide();}
}
function atBreak(next){saves++;if(!initialized||pro()||!visible()||showing||!ready||saves<config.everySaves||Date.now()-started<config.minUseSeconds*1000||Date.now()-lastShown<config.cooldownSeconds*1000){next();return;}
 // Consume only an already loaded ad. Never wait for a load and show it on a new screen.
 ready=false;showing=true;done=next;saves=0;lastShown=Date.now();
 plugin.showInterstitial().catch(complete);
}
async function privacy(){if(!plugin){window.alert('Las opciones publicitarias están disponibles en Android cuando AdMob está activo.');return;}
 try{await hide();ready=false;await plugin.showPrivacyOptionsForm();const info=await plugin.requestConsentInfo();if(info.canRequestAds){if(!initialized){await plugin.initialize({initializeForTesting:config.test});initialized=true;}await banner();preload();}else initialized=false;}catch(e){console.warn('No se pudieron abrir las opciones de privacidad.');}
}
document.addEventListener('visibilitychange',()=>{foreground=document.visibilityState!=='hidden';if(!visible())hide();else if(initialized)banner();});
document.addEventListener('mivaNativeForeground',()=>{foreground=true;if(initialized)banner();});
document.addEventListener('mivaNativeBackground',()=>{foreground=false;hide();});
window.MivaAds={init,atBreak,privacy};
})();
