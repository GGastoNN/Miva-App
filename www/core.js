/* Pure calculations and schema validation, shared by the app and tests. */
(function(root){
'use strict';
const rates={red:300,garrafa:900,amort:400,hour:0};
function number(v){
 if(typeof v==='number')return Number.isFinite(v)?v:NaN;
 let s=String(v??'').trim().replace(/[$\s]/g,'');if(!s)return 0;
 if(s.includes(',')&&s.includes('.')){const decimal=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.';s=s.split(decimal===','?'.':',').join('');s=s.replace(decimal,'.');}
 else if(s.includes(',')){s=s.replace(',','.');}
 else if(/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 return /^-?\d+(\.\d+)?$/.test(s)?Number(s):NaN;
}
const n=v=>number(v);
function fresh(mode){return {mode,nombre:'',rinde:'',ing:[{n:'',q:'',u:'g',p:''}],gas:'red',min:'',hour:'',ins:'local',envio:'',caja:'caja',pc:'',uc:'',rotos:'no',nr:'',pack:'',ent:'',loc:'no',lg:'',lv:'',g:50,channel:'Efectivo',fee:0,feeFixed:0};}
function validate(d,step){
 if(!d||!['prod','rev'].includes(d.mode))return 'Tipo de costeo inválido.';
 if(!['no','propio','alq'].includes(d.loc)||!['caja','unidad'].includes(d.caja)||!['si','no'].includes(d.rotos)||!['red','garrafa','no'].includes(d.gas)||!['local','envio'].includes(d.ins))return 'Revisá las opciones del costeo.';
 const bad=(k)=>!Number.isFinite(n(d[k]))||n(d[k])<0;
 const integer=k=>Number.isInteger(n(d[k]))&&n(d[k])>0;
 const extra=()=>['pack','ent','lg','lv'].some(bad)?'Los costos y cantidades deben ser números positivos o cero.':d.loc!=='no'&&!integer('lv')?'Indicá cuántas unidades vendés por mes (mayor que cero).':'';
 if(step===undefined){const count=d.mode==='prod'?6:4;for(let i=0;i<count;i++){const e=validate(d,i);if(e)return e;}return '';}
 if(step===0){if(!String(d.nombre||'').trim())return 'Escribí el nombre del producto.';
  if(d.mode==='prod'){
   if(!integer('rinde'))return 'El rendimiento debe ser una cantidad entera mayor que cero.';
   if(!Array.isArray(d.ing)||!d.ing.length)return 'Agregá al menos un ingrediente.';
   if(d.ing.some(i=>!String(i.n||'').trim()||!Number.isFinite(n(i.q))||n(i.q)<=0||!['g','ml','u'].includes(i.u)))return 'Completá nombre, cantidad y unidad de cada ingrediente.';
  }
 }
 if(d.mode==='prod'){
  if(step===1&&d.ing.some(i=>!Number.isFinite(n(i.p))||n(i.p)<=0))return 'Ingresá un precio mayor que cero para cada ingrediente.';
  if(step===2&&(bad('min')||n(d.min)<=0||bad('hour')))return 'Indicá tiempo mayor que cero y un valor de hora válido.';
  if(step===3&&d.ins==='envio'&&bad('envio'))return 'Ingresá un costo de envío válido.';
  if(step===4)return extra();
 }else{
  if(step===1&&(bad('pc')||n(d.pc)<=0||(d.caja==='caja'&&!integer('uc'))))return 'Ingresá precio y unidades compradas mayores que cero.';
  if(step===2){const e=extra();if(e)return e;const units=d.caja==='caja'?n(d.uc):1;
   if(d.caja==='caja'&&d.rotos==='si'&&(!Number.isInteger(n(d.nr))||n(d.nr)<1||n(d.nr)>=units))return 'Los productos dañados deben ser al menos uno y menos que las unidades compradas.';
  }
 }
 if(step===(d.mode==='prod'?5:3)){
  if(bad('g')||n(d.g)>200)return 'El recargo debe estar entre 0% y 200%.';
  if(bad('fee')||n(d.fee)>=100||bad('feeFixed'))return 'La comisión debe estar entre 0% y menos de 100%; el cargo fijo no puede ser negativo.';
 }
 return '';
}
function calculate(d,settings=rates){
 const units=d.mode==='prod'?n(d.rinde):(d.caja==='caja'?n(d.uc):1)-(d.caja==='caja'&&d.rotos==='si'?n(d.nr):0);
 if(!Number.isFinite(units)||units<=0)throw Error('No hay unidades vendibles.');
 let parts=[];
 if(d.mode==='prod'){
  const ing=d.ing.reduce((a,i)=>a+n(i.q)*n(i.p)/(i.u==='u'?1:1000),0);
  const hours=n(d.min)/60,gas=d.gas==='no'?0:n(settings[d.gas]);
  parts=[['Ingredientes',ing/units],['Gas',hours*gas/units],['Desgaste de equipos',hours*n(settings.amort)/units],['Mano de obra',hours*n(d.hour)/units],['Envío de insumos',(d.ins==='envio'?n(d.envio):0)/units]];
 }else parts=[['Compra por unidad vendible',n(d.pc)/units]];
 const loc=d.loc!=='no'?n(d.lg)/n(d.lv):0;
 parts.push(['Packaging',n(d.pack)],['Entrega',n(d.ent)],['Local',loc]);
 const cost=parts.reduce((a,p)=>a+p[1],0),fee=n(d.fee)/100,fixed=n(d.feeFixed);
 // Fixed fee is per unit. Preserve target profit after payment fees.
 const price=(cost*(1+n(d.g)/100)+fixed)/(1-fee),commission=price*fee+fixed,profit=price-commission-cost;
 if(![cost,price,commission,profit].every(Number.isFinite))throw Error('Revisá los datos del cálculo.');
 return {parts:parts.filter(p=>p[1]>0),cost,price,commission,profit,margin:price?profit/price*100:0,units,variable:cost-loc,local:loc};
}
function simulate(result,price,increase,fee,fixed){
 const cost=result.cost*(1+increase/100),commission=price*fee/100+fixed,profit=price-cost-commission;
 return {cost,profit,margin:price?profit/price*100:0};
}
const clone=v=>JSON.parse(JSON.stringify(v));
function normalize(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Array.isArray(raw.list))throw Error('Copia no válida.');
 const db={schema:2,list:[],n:Number.isInteger(raw.n)&&raw.n>=0?raw.n:0,ingredients:[],sales:[],expenses:[],settings:{...rates},draft:null};
 const finite=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
 const text=v=>typeof v==='string'&&v.length<=300;
 const ids=new Set();
 raw.list.forEach((p,i)=>{
  if(!p||!text(p.n)||!finite(p.p))throw Error('Producto inválido en la copia.');
  const key=p.id??'legacy_'+i;if(!id(key)||ids.has(key))throw Error('Identificador de producto inválido.');ids.add(key);
  if(p.data&&(!['prod','rev'].includes(p.data.mode)||validate(p.data)))throw Error('Datos de costeo inválidos.');
  if(p.stock!==undefined&&(!Number.isInteger(p.stock)||p.stock<0))throw Error('Stock inválido.');
  if(p.cost!==undefined&&p.cost!==null&&!finite(p.cost))throw Error('Costo inválido.');
  db.list.push({id:key,n:p.n,p:p.p,cost:p.cost??null,data:p.data?clone(p.data):null,stock:p.stock??0,updated:typeof p.updated==='string'?p.updated:'',history:Array.isArray(p.history)?p.history.filter(h=>h&&finite(h.price)&&finite(h.cost)&&typeof h.date==='string').slice(-100):[]});
 });
 if(raw.settings){for(const k of Object.keys(rates)){if(!finite(raw.settings[k]))throw Error('Configuración inválida.');db.settings[k]=raw.settings[k];}}
 for(const [key,check] of [
  ['ingredients',i=>i&&id(i.id)&&text(i.n)&&['g','ml','u'].includes(i.u)&&finite(i.p)&&i.p>0],
  ['sales',s=>s&&id(s.id)&&id(s.productId)&&text(s.name)&&Number.isInteger(s.qty)&&s.qty>0&&finite(s.price)&&finite(s.cost)&&finite(s.fee)&&s.fee<100&&finite(s.fixed)&&typeof s.date==='string'&&!isNaN(Date.parse(s.date))],
  ['expenses',e=>e&&id(e.id)&&text(e.name)&&finite(e.amount)&&e.amount>0&&typeof e.date==='string'&&!isNaN(Date.parse(e.date))]
 ]){if(raw[key]!==undefined){if(!Array.isArray(raw[key])||raw[key].some(x=>!check(x)))throw Error('Contenido inválido: '+key);const seen=new Set();for(const x of raw[key]){if(seen.has(x.id))throw Error('Identificadores repetidos: '+key);seen.add(x.id);}db[key]=clone(raw[key]);}}
 if(raw.draft&&['prod','rev'].includes(raw.draft.data?.mode)&&Array.isArray(raw.draft.data.ing)&&raw.draft.data.ing.every(i=>i&&typeof i.n==='string'&&['g','ml','u'].includes(i.u))&&Number.isInteger(raw.draft.step)&&raw.draft.step>=0&&raw.draft.step<(raw.draft.data.mode==='prod'?6:4))db.draft=clone(raw.draft);
 return db;
}
root.MivaCore={number,fresh,validate,calculate,simulate,normalize,rates,clone};
})(globalThis);
