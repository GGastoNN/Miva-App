/* First-run guide. Its marker is separate from business data and backups. */
(function(){
'use strict';
const KEY='miva_guide_seen',VERSION='1';
const steps=[
 {title:'Bienvenido a Miva',text:'Empezá eligiendo lo que querés costear. Te acompañamos paso a paso para llegar a un precio que tenga en cuenta tus gastos y tu trabajo.',hint:'Algo que yo hago · Algo que revendo',icon:'cost'},
 {title:'Tu trabajo también cuenta',text:'Ingresá cantidades, precios y los gastos que correspondan a tu producto. Si lo elaborás, incluí tu tiempo y el valor de tu hora. Al final vas a ver el costo y el precio sugerido.',hint:'Podés volver atrás y corregir los valores antes de guardar.',icon:'time'},
 {title:'Guardá y seguí tu emprendimiento',text:'Guardá el producto al terminar. En “Mi emprendimiento” podés consultar y editar tus costeos, ajustar el stock y registrar ventas. Si dejás un cálculo pendiente, podés continuar el borrador desde Inicio.',hint:'Guardá el producto para encontrarlo en Mi emprendimiento.',icon:'box'},
 {title:'El resto está en el menú',text:'Tocá ☰ para abrir ingredientes, ventas y gastos, configuración y copias de seguridad. La versión gratuita tiene 3 lugares; cada anuncio completado habilita uno más. Pro incluye lugares ilimitados y herramientas avanzadas.',hint:'Exportá copias para cuidar tus datos. Esta guía queda en ☰ → Guía de uso.',icon:'menu'}
];
let index=0,opened=false,resolveFirst=null,trigger=null,started=false;
const $=s=>document.querySelector(s);
function seen(){try{return localStorage.getItem(KEY)===VERSION;}catch(e){return false;}}
function mark(){try{localStorage.setItem(KEY,VERSION);}catch(e){/* Remains usable when persistent storage is unavailable. */}}
function render(){const s=steps[index];
 $('#guide-progress').textContent='Paso '+(index+1)+' de '+steps.length;
 $('#guide-title').textContent=s.title;$('#guide-text').textContent=s.text;$('#guide-hint').textContent=s.hint;
 $('#guide-symbol').textContent=['1','2','3','☰'][index];
 $('#guide-back').hidden=index===0;$('#guide-next').textContent=index===steps.length-1?'Empezar a usar Miva':'Siguiente';
 $('#guide-dots').innerHTML=steps.map((_,i)=>'<span class="guide-dot'+(i===index?' current':'')+'" aria-hidden="true"></span>').join('');
 if(opened)$('#guide-next').focus();
}
function open(){if(opened)return;index=0;trigger=document.activeElement;mark();render();$('#guide').showModal();opened=true;
 if(typeof statusBarForMenu==='function')statusBarForMenu(true);$('#guide-next').focus();
}
function close(){if(!opened)return;opened=false;$('#guide').close();if(typeof statusBarForMenu==='function')statusBarForMenu(false);
 if(trigger&&typeof trigger.focus==='function')trigger.focus();const done=resolveFirst;resolveFirst=null;if(done)done();
}
function next(){if(index===steps.length-1)close();else{index++;render();}}
function back(){if(!opened)return false;if(index>0){index--;render();}else close();return true;}
function firstRun(){if(started||seen())return Promise.resolve();started=true;return new Promise(resolve=>{resolveFirst=resolve;open();});}
window.MivaGuide={firstRun,open,close,next,back};
})();
