import fs from 'node:fs';
const env=process.env;
const bool=(key,fallback)=>env[key]===undefined||env[key]===''?fallback:env[key]==='true';
const debug=(env.BUILD_TYPE||'debug')!=='release';
const enabled=bool('MIVA_ADS_ENABLED',debug);
const demo={app:'ca-app-pub-3940256099942544~3347511713',banner:'ca-app-pub-3940256099942544/6300978111',interstitial:'ca-app-pub-3940256099942544/1033173712'};
const ids=debug?demo:{app:env.ADMOB_APP_ID,banner:env.ADMOB_BANNER_ID,interstitial:env.ADMOB_INTERSTITIAL_ID};
if(enabled&&!debug){for(const [key,v]of Object.entries(ids)){const re=key==='app'?/^ca-app-pub-\d{16}~\d{10}$/:/^ca-app-pub-\d{16}\/\d{10}$/;if(!re.test(v||'')||v.includes('3940256099942544'))throw Error('ID AdMob real requerido: '+key);}}
function count(k,fallback,min){const n=Number(env[k]||fallback);if(!Number.isInteger(n)||n<min)throw Error(k+' debe ser entero >= '+min);return n;}
const billingEnabled=bool('MIVA_BILLING_ENABLED',false);
const billingKey=env.REVENUECAT_ANDROID_PUBLIC_KEY||'';
if(billingEnabled&&!/^goog_[A-Za-z0-9]+$/.test(billingKey))throw Error('Configurá la clave pública Android de RevenueCat (goog_…). Nunca uses una clave secreta.');
const url=k=>{const value=env[k]||'';if(value&&!/^https:\/\/[^\s"<>]+$/.test(value))throw Error(k+' debe ser una URL HTTPS válida');return value;};
const billing={enabled:billingEnabled,apiKey:billingKey,entitlementId:'pro',offeringId:env.MIVA_OFFERING_ID||'default',packageId:'$rc_monthly',productId:'miva_pro_monthly',basePlanId:'monthly',privacyUrl:url('MIVA_PRIVACY_URL'),termsUrl:url('MIVA_TERMS_URL')};
if(billingEnabled&&!debug&&(!billing.privacyUrl||!billing.termsUrl))throw Error('Antes de activar suscripciones en release, configurá MIVA_PRIVACY_URL y MIVA_TERMS_URL.');
const config={billing,ads:{enabled,test:debug,bannerId:ids.banner||'',interstitialId:ids.interstitial||'',cooldownSeconds:count('MIVA_AD_COOLDOWN_SECONDS',180,120),everySaves:count('MIVA_AD_EVERY_SAVES',3,3),minUseSeconds:count('MIVA_AD_MIN_USE_SECONDS',6,6)},proPreview:debug&&bool('MIVA_PRO_PREVIEW',false)};
fs.writeFileSync('www/config.js','window.MIVA_CONFIG = '+JSON.stringify(config,null,2)+';\n');
let manifest=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
const tag='<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="'+(ids.app||demo.app)+'" />';
if(manifest.includes('com.google.android.gms.ads.APPLICATION_ID'))manifest=manifest.replace(/<meta-data\s+android:name="com.google.android.gms.ads.APPLICATION_ID"\s+android:value="[^"]*"\s*\/>/,tag);else manifest=manifest.replace('<application', '<application').replace(/(<application[\s\S]*?>)/,'$1\n        '+tag);
fs.writeFileSync('android/app/src/main/AndroidManifest.xml',manifest);
console.log('Configuración generada: '+(enabled?(debug?'anuncios de prueba':'anuncios reales'):'anuncios desactivados')+'; vista Pro de pruebas: '+config.proPreview);
