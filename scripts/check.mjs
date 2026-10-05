import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync('www/index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length || !/<title>Miva(?: · Tu precio justo)?<\/title>/.test(html)) throw new Error('HTML base incompleto');
for (const [, source] of scripts) new vm.Script(source);
const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
if (config.webDir !== 'www') throw new Error('webDir incorrecto');
console.log('HTML, JavaScript y configuración: OK');
