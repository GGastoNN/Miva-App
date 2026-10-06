import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
function app(storage=new Map()){
 const nodes={};const window={scrollTo(){},MIVA_CONFIG:{proPreview:true}};const ctx=vm.createContext({window,document:{querySelector:s=>nodes[s]??(nodes[s]={style:{},textContent:'',innerHTML:'',showModal(){this.open=true},close(){this.open=false},setAttribute(k,v){this[k]=v},focus(){this.focused=true}}),addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},confirm:()=>true,setTimeout:()=>0,clearTimeout(){},navigator:{}});
 for(const f of ['core.js','app.js'])vm.runInContext(fs.readFileSync('www/'+f,'utf8'),ctx);return {ctx,storage,run:s=>vm.runInContext(s,ctx)};
}
test('guardar, editar, duplicar, stock, venta y anulación',()=>{const a=app();a.run("start('rev');Object.assign(S,{nombre:'Alfajor',pc:1000,uc:10});finish();keep();selected=db.list[0].id;form={qty:10};adjustStock(1);form={qty:2,price:150,fee:10,fixed:5,channel:'Tarjeta'};recordSale()");assert.equal(a.run('db.list[0].stock'),8);assert.equal(a.run('summary().profit'),60);a.run("form={qty:99,price:150,fee:0,fixed:0};recordSale()");assert.equal(a.run('db.sales.length'),1);a.run("cancelSale(db.sales[0].id)");assert.equal(a.run('db.list[0].stock'),10);a.run("editProduct(db.list[0].id);S.nombre='Nuevo';finish();keep()");assert.equal(a.run('db.list.length'),1);assert.equal(a.run('db.list[0].history.length'),1);a.run("editProduct(db.list[0].id,true);finish();keep()");assert.equal(a.run('db.list.length'),2);assert.equal(a.run('db.list[0].stock'),0);});
test('borrador se recupera tras reiniciar y Atrás navega',()=>{const a=app();a.run("start('prod');S.nombre='Pan';step=2;draft()");const b=app(a.storage);b.run('resume()');assert.equal(b.run('S.nombre'),'Pan');assert.equal(b.run('step'),2);b.run('window.mivaBack()');assert.equal(b.run('step'),1);b.run('home()');assert.equal(b.run('window.mivaBack()'),false);});
test('precios de ingredientes, restauración y configuración',()=>{const a=app();a.run("start('prod');Object.assign(S,{nombre:'Pan',rinde:10,min:60,hour:1000,ing:[{n:'Harina',q:1000,u:'g',p:1000}]});finish();keep();const ingredient=db.ingredients[0];form={...ingredient,p:2000};storeIngredient()");assert.equal(a.run('db.list[0].data.ing[0].p'),2000);assert.equal(a.run('db.list[0].cost'),370);a.run("form={pending:C.normalize(JSON.parse(JSON.stringify(db)))};restore()");assert.equal(a.run('db.list.length'),1);assert.ok(a.storage.get('miva_before_restore'));assert.doesNotThrow(()=>app(a.storage));});
test('pantallas sin errores, datos previos conservados',()=>{const storage=new Map([['miva',JSON.stringify({list:[{n:'Antiguo',p:123}],n:3})]]);const a=app(storage);assert.equal(a.run('db.list[0].p'),123);assert.ok(storage.get('miva_before_v2'));for(const v of ['list','ingredients','reports','backup'])assert.doesNotThrow(()=>a.run(`tool('${v}')`));a.run("selected=db.list[0].id");for(const v of ['product','quote','simulate','stock','sale'])assert.doesNotThrow(()=>a.run(`productTool('${v}')`));});

test('Free reserva herramientas Pro sin bloquear datos y backups',()=>{const a=app();a.run("window.MIVA_CONFIG.proPreview=false;start('rev');Object.assign(S,{nombre:'Caja',pc:1000,uc:10});finish();keep();selected=db.list[0].id;productTool('simulate')");assert.equal(a.run('view'),'pro');a.run("productTool('quote')");assert.equal(a.run('view'),'pro');a.run("tool('backup')");assert.equal(a.run('view'),'backup');assert.equal(a.run('db.list.length'),1);});

test('3 costeos Free; edición permitida y nuevos/duplicados bloqueados',()=>{
 const a=app();a.run("window.MIVA_CONFIG.proPreview=false");
 for(let i=0;i<3;i++)a.run(`start('rev');Object.assign(S,{nombre:'Producto ${i}',pc:1000,uc:10});finish();keep()`);
 a.run("start('rev')");assert.equal(a.run('view'),'limit');
 a.run("editProduct(db.list[0].id);S.nombre='Editado';finish();keep()");assert.equal(a.run('db.list.length'),3);
 a.run("editProduct(db.list[0].id,true)");assert.equal(a.run('view'),'limit');
 a.run("editing=null;keep()");assert.equal(a.run('db.list.length'),3);
});
test('recompensa habilita 1 lugar, persiste y Pro no tiene límite',async()=>{
 const a=app();a.run("window.MIVA_CONFIG.proPreview=false;window.MivaAds={init(){},unlockCosteo:async grant=>{grant();return true}};");
 await a.run('unlockCosteo()');assert.equal(a.run('capacity()'),4);
 const b=app(a.storage);b.run('window.MIVA_CONFIG.proPreview=false');assert.equal(b.run('capacity()'),4);
 b.run("window.MivaAds={init(){},unlockCosteo:async()=>false}");await b.run('unlockCosteo()');assert.equal(b.run('capacity()'),4);
 b.run('window.MIVA_CONFIG.proPreview=true');assert.equal(b.run('capacity()'),Infinity);
});

test('inicio simple y menú: Atrás cierra sin perder borrador, accesos abren destino',()=>{
 const a=app();const h=a.run("$('#app').innerHTML");
 assert.match(h,/Algo que yo hago/);assert.match(h,/Mi emprendimiento/);assert.doesNotMatch(h,/onclick="(?:go\('ingredients'\)|tool\('reports'\)|openSettings\(\))/);
 a.run("start('rev');S.nombre='Pendiente';draft();openMenu()");assert.equal(a.run('menuOpen'),true);assert.equal(a.run("$('#menu-toggle')['aria-expanded']"),'true');
 a.run('window.mivaBack()');assert.equal(a.run('menuOpen'),false);assert.equal(a.run('view'),'flow');assert.equal(a.run('S.nombre'),'Pendiente');
 for(const [action,target] of [['ingredients','ingredients'],['reports','reports'],['settings','settings'],['backup','backup'],['pro','pro']]){
  a.run(`openMenu();menuAction('${action}')`);assert.equal(a.run('view'),target);assert.equal(a.run('menuOpen'),false);
 }
});
test('herramientas Pro bloqueadas con beneficio explícito; suscriptor puede acceder',()=>{
 const a=app();a.run("start('rev');Object.assign(S,{nombre:'Producto',pc:1000,uc:10});finish();keep();selected=db.list[0].id;window.MIVA_CONFIG.proPreview=false");
 for(const [tool,label] of [['quote','Presupuestos para compartir'],['simulate','Simulador de precios']]){
  a.run(`productTool('${tool}')`);assert.equal(a.run('view'),'pro');assert.match(a.run("$('#app').innerHTML"),/Suscribirse para obtener este beneficio/);assert.ok(a.run("$('#app').innerHTML").includes(label));
 }
 a.run('csv()');assert.equal(a.run('proBenefit'),'Exportación de ventas CSV');
 a.run("window.MIVA_CONFIG.proPreview=true;productTool('simulate')");assert.equal(a.run('view'),'simulate');
});
