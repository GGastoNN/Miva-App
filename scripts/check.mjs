import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync('www/index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length || !/<title>Miva(?: · Tu precio justo)?<\/title>/.test(html)) throw new Error('HTML base incompleto');
for (const match of scripts) {
 const external=match[0].match(/src="([^"]+)"/);
 new vm.Script(external?readFileSync('www/'+external[1],'utf8'):match[1]);
}
const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
if (config.webDir !== 'www') throw new Error('webDir incorrecto');
console.log('HTML, JavaScript y configuración: OK');
