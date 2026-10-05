import { build } from 'esbuild';
await build({entryPoints:['src/billing.js'],bundle:true,format:'iife',platform:'browser',target:'es2020',outfile:'www/billing.js',minify:true});
console.log('SDK de suscripciones compilado.');
